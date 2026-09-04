import { applyProfileToDocument, buildAppliedProfile, resolveLayout } from './applyProfile'
import { rememberTargetId } from './rememberedDisplay'
import { collectIdentitySignals, withFingerprintMatch } from './identity'
import { matchDisplayProfile } from './matcher'
import { DISPLAY_PROFILES, getProfileById } from './profiles'
import { collectDisplayRuntime } from './runtime'
import { createLocalStorageAdapter, mergeCalibration, resetRememberedDisplayState, type DisplayStorage } from './storage'
import type {
  AppliedProfile,
  DetectionSnapshot,
  DisplayManagerEvent,
  DisplayProfile,
  DisplayRuntime,
  IdentitySignals,
  OverrideMode,
  PersistedDisplayState,
  ProfileCalibration,
} from './types'
import { CONFIDENCE_THRESHOLD } from './types'

export type DisplayEnvironment = {
  collectRuntime: () => DisplayRuntime
  collectIdentity: (stored: PersistedDisplayState) => IdentitySignals
  addEventListener: (type: string, listener: EventListener) => void
  removeEventListener: (type: string, listener: EventListener) => void
  applyToDocument?: (applied: AppliedProfile) => void
  now?: () => number
}

export type DisplayProfileManagerOptions = {
  profiles?: DisplayProfile[]
  storage?: DisplayStorage
  environment?: DisplayEnvironment
  debounceMs?: number
  confidenceThreshold?: number
}

const OVERRIDE_PROFILE_ID: Record<Exclude<OverrideMode, 'AUTO' | 'GENERIC'>, string> = {
  FORCE_RAM_PORTRAIT: 'RAM_12_4_PORTRAIT',
  FORCE_RAM_HDMI: 'RAM_AV_CM01',
  FORCE_FORD: 'FORD_F250_12_LANDSCAPE',
  FORCE_TESLA: 'TESLA_MODEL_Y_LANDSCAPE',
}

function defaultEnvironment(): DisplayEnvironment {
  return {
    collectRuntime: () => collectDisplayRuntime(),
    collectIdentity: (stored) => collectIdentitySignals(window.location.search, stored),
    addEventListener: (type, listener) => {
      window.addEventListener(type, listener)
      document.addEventListener(type, listener)
    },
    removeEventListener: (type, listener) => {
      window.removeEventListener(type, listener)
      document.removeEventListener(type, listener)
    },
    applyToDocument: (applied) => applyProfileToDocument(applied),
    now: () => Date.now(),
  }
}

export class DisplayProfileManager {
  private readonly profiles: DisplayProfile[]
  private readonly storage: DisplayStorage
  private readonly environment: DisplayEnvironment
  private readonly debounceMs: number
  private readonly confidenceThreshold: number
  private readonly listeners = new Set<(event: DisplayManagerEvent) => void>()
  private persisted: PersistedDisplayState
  private snapshot: DetectionSnapshot | null = null
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private started = false
  private applying = false
  private generation = 0
  private readonly onGeometryEvent = () => this.scheduleEvaluate()

  constructor(options: DisplayProfileManagerOptions = {}) {
    this.profiles = options.profiles ?? DISPLAY_PROFILES
    this.storage = options.storage ?? createLocalStorageAdapter()
    this.environment = options.environment ?? defaultEnvironment()
    this.debounceMs = options.debounceMs ?? 180
    this.confidenceThreshold = options.confidenceThreshold ?? CONFIDENCE_THRESHOLD
    this.persisted = this.storage.load()
  }

  getSnapshot(): DetectionSnapshot | null {
    return this.snapshot
  }

  getOverrideMode(): OverrideMode {
    return this.persisted.overrideMode
  }

  subscribe(listener: (event: DisplayManagerEvent) => void): () => void {
    this.listeners.add(listener)
    if (this.snapshot) {
      listener({ reason: 'startup', snapshot: this.snapshot })
    }
    return () => {
      this.listeners.delete(listener)
    }
  }

  start(): DetectionSnapshot {
    if (!this.started) {
      this.started = true
      this.environment.addEventListener('resize', this.onGeometryEvent)
      this.environment.addEventListener('orientationchange', this.onGeometryEvent)
      this.environment.addEventListener('fullscreenchange', this.onGeometryEvent)
      this.environment.addEventListener('webkitfullscreenchange', this.onGeometryEvent)
    }
    return this.detectAndApply('startup', { debounce: false })
  }

  stop(): void {
    if (!this.started) return
    this.started = false
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    this.environment.removeEventListener('resize', this.onGeometryEvent)
    this.environment.removeEventListener('orientationchange', this.onGeometryEvent)
    this.environment.removeEventListener('fullscreenchange', this.onGeometryEvent)
    this.environment.removeEventListener('webkitfullscreenchange', this.onGeometryEvent)
  }

  detect(runtime?: DisplayRuntime): DetectionSnapshot {
    return this.evaluate(runtime, 'manual', false)
  }

  apply(profile: DisplayProfile, runtime?: DisplayRuntime): DetectionSnapshot {
    const currentRuntime = runtime ?? this.environment.collectRuntime()
    const identity = withFingerprintMatch(
      this.environment.collectIdentity(this.persisted),
      currentRuntime.hardwareFingerprint,
      this.persisted,
    )
    return this.commit(currentRuntime, identity, profile, this.confidenceFrom(profile, currentRuntime, identity), 'manual', 'override')
  }

  setOverride(mode: OverrideMode): DetectionSnapshot {
    this.persisted = { ...this.persisted, overrideMode: mode }
    this.storage.save(this.persisted)
    return this.detectAndApply('override', { debounce: false })
  }

  setCalibration(profileId: string, patch: ProfileCalibration): DetectionSnapshot {
    const existing = this.persisted.calibrations[profileId]
    this.persisted = {
      ...this.persisted,
      calibrations: {
        ...this.persisted.calibrations,
        [profileId]: mergeCalibration(existing, patch),
      },
    }
    this.storage.save(this.persisted)
    return this.detectAndApply('calibration', { debounce: false })
  }

  rememberFingerprint(profileId?: string, fingerprint?: string, options: { overwrite?: boolean } = {}): DetectionSnapshot {
    const runtime = this.environment.collectRuntime()
    const snapshot = this.snapshot
    const targetId =
      profileId ??
      (snapshot ? rememberTargetId(this.persisted.overrideMode, snapshot.detectedProfile, snapshot.activeProfile) : undefined)
    if (!targetId) {
      return snapshot ?? this.detectAndApply('identity', { debounce: false })
    }
    const key = fingerprint ?? runtime.hardwareFingerprint
    const existing = this.persisted.fingerprints[key]
    if (existing && existing !== targetId && !options.overwrite) {
      return snapshot ?? this.detectAndApply('identity', { debounce: false })
    }
    this.persisted = {
      ...this.persisted,
      fingerprints: {
        ...this.persisted.fingerprints,
        [key]: targetId,
      },
    }
    this.storage.save(this.persisted)
    return this.detectAndApply('identity', { debounce: false })
  }

  forgetFingerprint(fingerprint?: string): DetectionSnapshot {
    const runtime = this.environment.collectRuntime()
    const key = fingerprint ?? runtime.hardwareFingerprint
    const fingerprints = { ...this.persisted.fingerprints }
    delete fingerprints[key]
    this.persisted = { ...this.persisted, fingerprints }
    this.storage.save(this.persisted)
    return this.detectAndApply('identity', { debounce: false })
  }

  resetDisplayMemory(options: { resetOverride?: boolean } = {}): DetectionSnapshot {
    this.persisted = resetRememberedDisplayState(this.persisted, options)
    this.storage.save(this.persisted)
    return this.detectAndApply('identity', { debounce: false })
  }

  getCalibration(profileId: string): ProfileCalibration {
    return this.persisted.calibrations[profileId] ?? {}
  }

  private scheduleEvaluate(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null
      this.detectAndApply('geometry', { debounce: false })
    }, this.debounceMs)
  }

  private detectAndApply(
    reason: DisplayManagerEvent['reason'],
    options: { debounce: boolean },
  ): DetectionSnapshot {
    if (options.debounce) {
      this.scheduleEvaluate()
      return this.snapshot ?? this.evaluate(undefined, reason, false)
    }
    return this.evaluate(undefined, reason, true)
  }

  private evaluate(
    runtimeInput: DisplayRuntime | undefined,
    reason: DisplayManagerEvent['reason'],
    emit: boolean,
  ): DetectionSnapshot {
    const runtime = runtimeInput ?? this.environment.collectRuntime()
    const identity = withFingerprintMatch(
      this.environment.collectIdentity(this.persisted),
      runtime.hardwareFingerprint,
      this.persisted,
    )
    const match = matchDisplayProfile(runtime, this.profiles, identity, this.confidenceThreshold)
    const detectedProfile = match.winner
    const activeProfile = this.resolveOverride(detectedProfile, runtime)
    const source: DetectionSnapshot['source'] =
      this.persisted.overrideMode === 'AUTO'
        ? identity.fingerprintProfileId && identity.fingerprintProfileId === activeProfile.id
          ? 'identity'
          : 'auto'
        : 'override'

    return this.commit(runtime, identity, detectedProfile, match.confidence, reason, source, match.scores, emit, activeProfile)
  }

  private resolveOverride(detected: DisplayProfile, runtime: DisplayRuntime): DisplayProfile {
    const mode = this.persisted.overrideMode
    if (mode === 'AUTO') return detected
    if (mode === 'GENERIC') {
      const id = runtime.orientation === 'portrait' ? 'GENERIC_PORTRAIT' : 'GENERIC_LANDSCAPE'
      return this.requireProfile(id)
    }
    return this.requireProfile(OVERRIDE_PROFILE_ID[mode])
  }

  private requireProfile(id: string): DisplayProfile {
    const profile = getProfileById(id) ?? this.profiles.find((item) => item.id === id)
    if (!profile) throw new Error(`Unknown display profile: ${id}`)
    return profile
  }

  private confidenceFrom(profile: DisplayProfile, runtime: DisplayRuntime, identity: IdentitySignals): number {
    const match = matchDisplayProfile(runtime, this.profiles, identity, this.confidenceThreshold)
    const scored = match.scores.find((item) => item.profile.id === profile.id)
    return Math.round(scored?.score ?? match.confidence)
  }

  private commit(
    runtime: DisplayRuntime,
    identity: IdentitySignals,
    detectedProfile: DisplayProfile,
    detectedConfidence: number,
    reason: DisplayManagerEvent['reason'],
    source: DetectionSnapshot['source'],
    scores = matchDisplayProfile(runtime, this.profiles, identity, this.confidenceThreshold).scores,
    emit = true,
    activeProfile = detectedProfile,
  ): DetectionSnapshot {
    if (this.applying) {
      return this.snapshot as DetectionSnapshot
    }

    this.applying = true
    try {
      const calibration = this.persisted.calibrations[activeProfile.id]
      const applied = buildAppliedProfile(activeProfile, runtime, calibration)
      const previous = this.snapshot
      const layoutChanged =
        !previous ||
        previous.activeProfile.id !== activeProfile.id ||
        previous.activeLayout !== applied.resolvedLayout

      if (layoutChanged) this.generation += 1

      this.persisted = {
        ...this.persisted,
        lastDetectedProfileId: detectedProfile.id,
      }
      this.storage.save(this.persisted)

      const snapshot: DetectionSnapshot = {
        runtime,
        identity,
        scores,
        detectedProfile,
        detectedConfidence,
        activeProfile,
        activeLayout: applied.resolvedLayout,
        applied,
        overrideMode: this.persisted.overrideMode,
        source,
        layoutChanged,
        generation: this.generation,
      }

      this.snapshot = snapshot
      this.environment.applyToDocument?.(applied)

      if (emit) {
        const event: DisplayManagerEvent = { reason, snapshot }
        for (const listener of this.listeners) listener(event)
      }

      return snapshot
    } finally {
      this.applying = false
    }
  }
}

export function overrideLabel(mode: OverrideMode): string {
  return mode.replaceAll('_', ' ')
}

export function resolvedLayoutFor(profile: DisplayProfile, runtime: DisplayRuntime) {
  return resolveLayout(profile, runtime)
}
