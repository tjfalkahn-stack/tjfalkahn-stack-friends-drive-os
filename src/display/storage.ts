import { GENERIC_PROFILE_IDS } from './profiles'
import { isCurrentFingerprintFormat, migrateFingerprintKey } from './fingerprint'
import {
  DISPLAY_STORAGE_KEY,
  DISPLAY_STORAGE_LEGACY_KEYS,
  DISPLAY_STORAGE_VERSION,
  type OverrideMode,
  type PersistedDisplayState,
  type ProfileCalibration,
} from './types'

export const DEFAULT_DISPLAY_STATE: PersistedDisplayState = {
  version: DISPLAY_STORAGE_VERSION,
  lastDetectedProfileId: null,
  overrideMode: 'AUTO',
  calibrations: {},
  fingerprints: {},
  userSelectedVehicle: null,
}

export interface DisplayStorage {
  load(): PersistedDisplayState
  save(state: PersistedDisplayState): void
}

function cloneState(state: PersistedDisplayState): PersistedDisplayState {
  return {
    ...state,
    calibrations: { ...state.calibrations },
    fingerprints: { ...state.fingerprints },
  }
}

export function createMemoryStorage(initial?: Partial<PersistedDisplayState>): DisplayStorage {
  let state = migratePersistedState({
    ...DEFAULT_DISPLAY_STATE,
    ...initial,
    calibrations: { ...DEFAULT_DISPLAY_STATE.calibrations, ...initial?.calibrations },
    fingerprints: { ...DEFAULT_DISPLAY_STATE.fingerprints, ...initial?.fingerprints },
  })

  return {
    load: () => cloneState(state),
    save: (next) => {
      state = cloneState(migratePersistedState(next))
    },
  }
}

export function preferFingerprintProfile(existing: string | undefined, incoming: string): string {
  if (!existing) return incoming
  if (GENERIC_PROFILE_IDS.has(existing) && !GENERIC_PROFILE_IDS.has(incoming)) return incoming
  if (!GENERIC_PROFILE_IDS.has(existing) && GENERIC_PROFILE_IDS.has(incoming)) return existing
  return incoming
}

export function migrateFingerprintMap(fingerprints: Record<string, string> | undefined): Record<string, string> {
  const next: Record<string, string> = {}
  for (const [key, profileId] of Object.entries(fingerprints ?? {})) {
    const migrated = isCurrentFingerprintFormat(key) ? key : migrateFingerprintKey(key)
    if (!migrated) continue
    next[migrated] = preferFingerprintProfile(next[migrated], profileId)
  }
  return next
}

export function migratePersistedState(raw: unknown): PersistedDisplayState {
  const parsed = (raw && typeof raw === 'object' ? raw : {}) as Partial<PersistedDisplayState> & {
    fingerprints?: Record<string, string>
  }
  const version = typeof parsed.version === 'number' ? parsed.version : 1
  const fingerprints =
    version >= DISPLAY_STORAGE_VERSION &&
    Object.keys(parsed.fingerprints ?? {}).every((key) => isCurrentFingerprintFormat(key))
      ? { ...(parsed.fingerprints ?? {}) }
      : migrateFingerprintMap(parsed.fingerprints)

  return {
    version: DISPLAY_STORAGE_VERSION,
    lastDetectedProfileId: parsed.lastDetectedProfileId ?? null,
    overrideMode: (parsed.overrideMode as OverrideMode) || 'AUTO',
    calibrations: parsed.calibrations ?? {},
    fingerprints,
    userSelectedVehicle: parsed.userSelectedVehicle ?? null,
  }
}

export function createLocalStorageAdapter(
  key = DISPLAY_STORAGE_KEY,
  store?: Pick<Storage, 'getItem' | 'setItem'>,
  legacyKeys: readonly string[] = DISPLAY_STORAGE_LEGACY_KEYS,
): DisplayStorage {
  const backend = store ?? (typeof localStorage === 'undefined' ? null : localStorage)

  const readRaw = (storageKey: string): unknown => {
    if (!backend) return null
    const raw = backend.getItem(storageKey)
    if (!raw) return null
    try {
      return JSON.parse(raw) as unknown
    } catch {
      return null
    }
  }

  return {
    load() {
      if (!backend) return cloneState(DEFAULT_DISPLAY_STATE)
      const current = readRaw(key)
      if (current) {
        const migrated = migratePersistedState(current)
        if (JSON.stringify(current) !== JSON.stringify(migrated)) backend.setItem(key, JSON.stringify(migrated))
        return migrated
      }
      for (const legacyKey of legacyKeys) {
        const legacy = readRaw(legacyKey)
        if (!legacy) continue
        const migrated = migratePersistedState(legacy)
        backend.setItem(key, JSON.stringify(migrated))
        return migrated
      }
      return cloneState(DEFAULT_DISPLAY_STATE)
    },
    save(state) {
      if (!backend) return
      backend.setItem(key, JSON.stringify(migratePersistedState(state)))
    },
  }
}

export function mergeCalibration(
  base: ProfileCalibration | undefined,
  patch: ProfileCalibration,
): ProfileCalibration {
  return {
    scale: patch.scale ?? base?.scale,
    touchTarget: patch.touchTarget ?? base?.touchTarget,
    safeArea: { ...base?.safeArea, ...patch.safeArea },
  }
}

export function resetRememberedDisplayState(
  state: PersistedDisplayState,
  options: { resetOverride?: boolean } = {},
): PersistedDisplayState {
  return {
    ...state,
    version: DISPLAY_STORAGE_VERSION,
    fingerprints: {},
    lastDetectedProfileId: null,
    userSelectedVehicle: null,
    overrideMode: options.resetOverride === false ? state.overrideMode : 'AUTO',
    calibrations: { ...state.calibrations },
  }
}
