import { describe, expect, it } from 'vitest'
import { DisplayProfileManager } from '../../src/display/DisplayProfileManager'
import { matchDisplayProfile, scoreProfile } from '../../src/display/matcher'
import { DISPLAY_PROFILES, getProfileById } from '../../src/display/profiles'
import { runtimeFromPartial } from '../../src/display/runtime'
import { createMemoryStorage } from '../../src/display/storage'
import { formatDisplayReport } from '../../src/display/report'
import type { DisplayEnvironment, DisplayRuntime, OverrideMode } from '../../src/display'

function runtime(innerWidth: number, innerHeight: number, extras: Partial<DisplayRuntime> = {}) {
  return runtimeFromPartial({ innerWidth, innerHeight, ...extras })
}

function createHarness(initial?: { innerWidth: number; innerHeight: number; overrideMode?: OverrideMode }) {
  let innerWidth = initial?.innerWidth ?? 1280
  let innerHeight = initial?.innerHeight ?? 800
  const listeners = new Map<string, Set<EventListener>>()
  const applied: string[] = []
  const storage = createMemoryStorage(
    initial?.overrideMode ? { overrideMode: initial.overrideMode } : undefined,
  )

  const environment: DisplayEnvironment = {
    collectRuntime: () => runtime(innerWidth, innerHeight),
    collectIdentity: (stored) => ({
      vehicle: stored.userSelectedVehicle,
      userSelectedVehicle: stored.userSelectedVehicle,
      fingerprintProfileId: stored.fingerprints[runtime(innerWidth, innerHeight).hardwareFingerprint] ?? null,
    }),
    addEventListener: (type, listener) => {
      const set = listeners.get(type) ?? new Set()
      set.add(listener)
      listeners.set(type, set)
    },
    removeEventListener: (type, listener) => {
      listeners.get(type)?.delete(listener)
    },
    applyToDocument: (next) => {
      applied.push(`${next.profile.id}:${next.resolvedLayout}`)
    },
  }

  const manager = new DisplayProfileManager({
    storage,
    environment,
    debounceMs: 25,
  })

  return {
    manager,
    applied,
    storage,
    setSize(width: number, height: number) {
      innerWidth = width
      innerHeight = height
    },
    fire(type: string) {
      for (const listener of listeners.get(type) ?? []) {
        listener(new Event(type))
      }
    },
  }
}

describe('display profile matching', () => {
  it('selects RAM portrait for a tall RAM-like viewport', () => {
    const result = matchDisplayProfile(runtime(1080, 1920), DISPLAY_PROFILES)
    expect(result.winner.id).toBe('RAM_12_4_PORTRAIT')
    expect(result.usedFallback).toBe(false)
    expect(result.confidence).toBeGreaterThan(60)
  })

  it('selects RAM HDMI for an AV-CM01-like 16:9 viewport', () => {
    const result = matchDisplayProfile(runtime(1920, 1080), DISPLAY_PROFILES)
    expect(result.winner.id).toBe('RAM_AV_CM01')
    expect(result.winner.layout).toBe('ram-hdmi-bridge')
    expect(result.usedFallback).toBe(false)
  })

  it('selects Ford for a 12-inch style landscape viewport', () => {
    const result = matchDisplayProfile(runtime(1280, 768), DISPLAY_PROFILES)
    expect(result.winner.id).toBe('FORD_F250_12_LANDSCAPE')
  })

  it('selects Tesla for a wide Model Y-like viewport', () => {
    const result = matchDisplayProfile(runtime(1920, 1200), DISPLAY_PROFILES)
    expect(result.winner.id).toBe('TESLA_MODEL_Y_LANDSCAPE')
  })

  it('falls back to generic portrait for an unknown phone-sized viewport', () => {
    const result = matchDisplayProfile(runtime(390, 844), DISPLAY_PROFILES)
    expect(result.winner.id).toBe('GENERIC_PORTRAIT')
    expect(result.usedFallback).toBe(true)
  })

  it('falls back to generic landscape for an unknown 4:3 viewport', () => {
    const result = matchDisplayProfile(runtime(1024, 768), DISPLAY_PROFILES)
    expect(result.winner.id).toBe('GENERIC_LANDSCAPE')
    expect(result.usedFallback).toBe(true)
  })

  it('does not identify a vehicle from a single exact width', () => {
    const ram = getProfileById('RAM_12_4_PORTRAIT')!
    const nearby = scoreProfile(runtime(1074, 1910), ram)
    const exactish = scoreProfile(runtime(1080, 1920), ram)
    expect(nearby.score).toBeGreaterThan(50)
    expect(Math.abs(nearby.score - exactish.score)).toBeLessThan(8)
  })
})

describe('DisplayProfileManager', () => {
  it('applies RAM HDMI bridge composition for AV-CM01-like geometry', () => {
    const { manager } = createHarness({ innerWidth: 1920, innerHeight: 1080 })
    const snapshot = manager.start()
    expect(snapshot.detectedProfile.id).toBe('RAM_AV_CM01')
    expect(snapshot.activeLayout).toBe('ram-hdmi-bridge')
    expect(snapshot.applied.navPlacement).toBe('left')
    expect(snapshot.applied.mediaLayout).toBe('ram-hdmi-stage')
    expect(snapshot.applied.towLiveLayout).toBe('ram-hdmi-tow')
  })

  it('lets a manual override beat auto detection', () => {
    const { manager } = createHarness({ innerWidth: 1920, innerHeight: 1080 })
    manager.start()
    const forced = manager.setOverride('FORCE_TESLA')
    expect(forced.detectedProfile.id).toBe('RAM_AV_CM01')
    expect(forced.activeProfile.id).toBe('TESLA_MODEL_Y_LANDSCAPE')
    expect(forced.activeLayout).toBe('tesla-landscape')
    expect(forced.overrideMode).toBe('FORCE_TESLA')
    expect(forced.source).toBe('override')
  })

  it('persists a manual override locally', () => {
    const { manager, storage } = createHarness({ innerWidth: 1280, innerHeight: 768 })
    manager.start()
    manager.setOverride('FORCE_RAM_PORTRAIT')
    expect(storage.load().overrideMode).toBe('FORCE_RAM_PORTRAIT')
  })

  it('returning to Auto re-enables detection', () => {
    const { manager } = createHarness({ innerWidth: 1280, innerHeight: 768 })
    manager.start()
    manager.setOverride('FORCE_TESLA')
    const restored = manager.setOverride('AUTO')
    expect(restored.overrideMode).toBe('AUTO')
    expect(restored.activeProfile.id).toBe('FORD_F250_12_LANDSCAPE')
    expect(restored.source).toBe('auto')
  })

  it('GENERIC override follows current orientation', () => {
    const { manager } = createHarness({ innerWidth: 1080, innerHeight: 1920 })
    manager.start()
    const snapshot = manager.setOverride('GENERIC')
    expect(snapshot.activeProfile.id).toBe('GENERIC_PORTRAIT')
  })

  it('stores calibration per display profile', () => {
    const { manager, storage } = createHarness({ innerWidth: 1920, innerHeight: 1080 })
    manager.start()
    manager.setCalibration('RAM_AV_CM01', {
      scale: 1.12,
      touchTarget: 60,
      safeArea: { top: 40 },
    })
    manager.setCalibration('FORD_F250_12_LANDSCAPE', {
      scale: 0.9,
      touchTarget: 50,
    })

    const ram = storage.load().calibrations.RAM_AV_CM01
    const ford = storage.load().calibrations.FORD_F250_12_LANDSCAPE
    expect(ram?.scale).toBe(1.12)
    expect(ram?.touchTarget).toBe(60)
    expect(ram?.safeArea?.top).toBe(40)
    expect(ford?.scale).toBe(0.9)
    expect(ford?.touchTarget).toBe(50)
    expect(ford?.scale).not.toBe(ram?.scale)
  })

  it('applies per-profile calibration to the active profile only', () => {
    const { manager } = createHarness({ innerWidth: 1920, innerHeight: 1080 })
    manager.start()
    const snapshot = manager.setCalibration('RAM_AV_CM01', { scale: 1.2, touchTarget: 70 })
    expect(snapshot.applied.uiScale).toBe(1.2)
    expect(snapshot.applied.touchTarget).toBe(70)
  })

  it('does not re-enter apply when the same profile is detected again', () => {
    const { manager } = createHarness({ innerWidth: 1920, innerHeight: 1080 })
    const layouts: string[] = []
    manager.subscribe((event) => {
      if (event.snapshot.layoutChanged) {
        layouts.push(event.snapshot.activeLayout)
      }
    })
    const first = manager.start()
    const second = manager.detect()
    expect(first.activeProfile.id).toBe('RAM_AV_CM01')
    expect(second.activeProfile.id).toBe('RAM_AV_CM01')
    expect(second.layoutChanged).toBe(false)
    expect(second.generation).toBe(first.generation)
    expect(layouts).toEqual(['ram-hdmi-bridge'])
  })

  it('switches shells when geometry moves to another vehicle class', () => {
    const { manager, setSize } = createHarness({ innerWidth: 1512, innerHeight: 982 })
    const first = manager.start()
    expect(first.activeProfile.vehicle === 'tesla' || first.activeProfile.vehicle === 'generic').toBe(true)

    setSize(1920, 1080)
    const ram = manager.detect()
    expect(ram.activeLayout).toBe('ram-hdmi-bridge')
    expect(ram.layoutChanged).toBe(true)

    setSize(1280, 768)
    const ford = manager.detect()
    expect(ford.activeLayout).toBe('ford-landscape')

    setSize(1920, 1200)
    const tesla = manager.detect()
    expect(tesla.activeLayout).toBe('tesla-landscape')
    expect(tesla.activeProfile.vehicle).toBe('tesla')
  })

  it('RAM_AUTO resolves portrait vs HDMI from orientation', () => {
    const { manager } = createHarness({ innerWidth: 1920, innerHeight: 1080 })
    manager.start()
    const hdmi = manager.apply(getProfileById('RAM_AUTO')!)
    expect(hdmi.activeLayout).toBe('ram-hdmi-bridge')

    const portrait = manager.apply(getProfileById('RAM_AUTO')!, runtime(900, 1600))
    expect(portrait.activeLayout).toBe('ram-portrait')
  })
})

describe('resize re-evaluation', () => {
  it('re-evaluates after a debounced resize', async () => {
    const { manager, setSize, fire } = createHarness({ innerWidth: 390, innerHeight: 844 })
    const started = manager.start()
    expect(started.activeProfile.id).toBe('GENERIC_PORTRAIT')

    setSize(1920, 1080)
    fire('resize')
    expect(manager.getSnapshot()?.activeProfile.id).toBe('GENERIC_PORTRAIT')

    await new Promise((resolve) => setTimeout(resolve, 40))
    expect(manager.getSnapshot()?.activeProfile.id).toBe('RAM_AV_CM01')
    expect(manager.getSnapshot()?.layoutChanged).toBe(true)
    manager.stop()
  })

  it('does not thrash into a re-render loop on repeated resize of the same profile', async () => {
    const { manager, fire } = createHarness({ innerWidth: 1920, innerHeight: 1080 })
    let layoutChanges = 0
    manager.subscribe((event) => {
      if (event.snapshot.layoutChanged) layoutChanges += 1
    })
    manager.start()
    fire('resize')
    fire('resize')
    fire('orientationchange')
    await new Promise((resolve) => setTimeout(resolve, 40))
    expect(manager.getSnapshot()?.activeProfile.id).toBe('RAM_AV_CM01')
    expect(layoutChanges).toBe(1)
    manager.stop()
  })
})

describe('display report', () => {
  it('formats the copyable diagnostics report', () => {
    const { manager } = createHarness({ innerWidth: 1920, innerHeight: 1080 })
    const snapshot = manager.start()
    const report = formatDisplayReport(snapshot)
    expect(report).toContain('Friends Drive OS Display Report')
    expect(report).toContain('Profile: RAM_AV_CM01')
    expect(report).toMatch(/Confidence: \d+%/)
    expect(report).toContain('innerWidth: 1920')
    expect(report).toContain('innerHeight: 1080')
    expect(report).toContain('devicePixelRatio:')
    expect(report).toContain('aspectRatio:')
    expect(report).toContain('orientation:')
    expect(report).toContain('fullscreen:')
  })
})
