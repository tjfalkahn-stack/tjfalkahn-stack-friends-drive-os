import { describe, expect, it } from 'vitest'
import { DisplayProfileManager } from '../../src/display/DisplayProfileManager'
import { matchDisplayProfile, scoreProfile } from '../../src/display/matcher'
import { computePhysicalMap } from '../../src/display/physicalMap'
import { DISPLAY_PROFILES, getProfileById } from '../../src/display/profiles'
import { VERIFIED_RAM_AV_CM01_SAMPLE, verifiedRamAvCm01Runtime } from '../../src/display/samples'
import { createMemoryStorage } from '../../src/display/storage'
import type { DisplayEnvironment, DisplayRuntime, IdentitySignals } from '../../src/display'

function createHarness(initial: DisplayRuntime, identity?: IdentitySignals) {
  let current = initial
  const storage = createMemoryStorage()
  const environment: DisplayEnvironment = {
    collectRuntime: () => current,
    collectIdentity: (stored) => ({
      ...identity,
      vehicle: identity?.vehicle ?? stored.userSelectedVehicle,
      userSelectedVehicle: stored.userSelectedVehicle,
      fingerprintProfileId: stored.fingerprints[current.hardwareFingerprint] ?? identity?.fingerprintProfileId ?? null,
    }),
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }

  const manager = new DisplayProfileManager({ storage, environment, debounceMs: 25 })
  return {
    manager,
    storage,
    setRuntime(next: DisplayRuntime) {
      current = next
    },
  }
}

describe('verified RAM AV-CM01 sample', () => {
  it('matches the exact captured report as RAM_AV_CM01 at high confidence', () => {
    const runtime = verifiedRamAvCm01Runtime({
      innerWidth: VERIFIED_RAM_AV_CM01_SAMPLE.innerWidth,
      innerHeight: VERIFIED_RAM_AV_CM01_SAMPLE.innerHeight,
      outerWidth: VERIFIED_RAM_AV_CM01_SAMPLE.outerWidth,
      outerHeight: VERIFIED_RAM_AV_CM01_SAMPLE.outerHeight,
      screenWidth: VERIFIED_RAM_AV_CM01_SAMPLE.screenWidth,
      screenHeight: VERIFIED_RAM_AV_CM01_SAMPLE.screenHeight,
      availWidth: VERIFIED_RAM_AV_CM01_SAMPLE.availWidth,
      availHeight: VERIFIED_RAM_AV_CM01_SAMPLE.availHeight,
      devicePixelRatio: VERIFIED_RAM_AV_CM01_SAMPLE.devicePixelRatio,
      orientationType: VERIFIED_RAM_AV_CM01_SAMPLE.orientationType,
      fullscreen: false,
    })

    expect(runtime.aspectRatio).toBeCloseTo(1.4385, 4)

    const result = matchDisplayProfile(runtime, DISPLAY_PROFILES)
    expect(result.winner.id).toBe('RAM_AV_CM01')
    expect(result.winner.layout).toBe('ram-hdmi-bridge')
    expect(result.usedFallback).toBe(false)
    expect(result.confidence).toBeGreaterThanOrEqual(90)

    const { manager } = createHarness(runtime)
    const snapshot = manager.start()
    expect(snapshot.overrideMode).toBe('AUTO')
    expect(snapshot.detectedProfile.id).toBe('RAM_AV_CM01')
    expect(snapshot.activeLayout).toBe('ram-hdmi-bridge')
    expect(snapshot.detectedConfidence).toBeGreaterThanOrEqual(90)
  })

  it('does not require innerWidth === 1555', () => {
    const exact = scoreProfile(verifiedRamAvCm01Runtime(), getProfileById('RAM_AV_CM01')!)
    const nearby = scoreProfile(
      verifiedRamAvCm01Runtime({ innerWidth: 1540, innerHeight: 1070 }),
      getProfileById('RAM_AV_CM01')!,
    )
    expect(nearby.score).toBeGreaterThan(80)
    expect(Math.abs(exact.score - nearby.score)).toBeLessThan(12)
  })

  it.each([
    { innerWidth: 1500, innerHeight: 1050 },
    { innerWidth: 1600, innerHeight: 1100 },
    { innerWidth: 1555, innerHeight: 1081, devicePixelRatio: 1.8 },
    { innerWidth: 1520, innerHeight: 1090 },
  ])('keeps RAM_AV_CM01 for nearby window $innerWidth×$innerHeight', (variant) => {
    const result = matchDisplayProfile(verifiedRamAvCm01Runtime(variant), DISPLAY_PROFILES)
    expect(result.winner.id).toBe('RAM_AV_CM01')
    expect(result.confidence).toBeGreaterThan(70)
  })

  it('stays on RAM_AV_CM01 when Chrome goes fullscreen on the same screen', () => {
    const windowed = matchDisplayProfile(verifiedRamAvCm01Runtime({ fullscreen: false }), DISPLAY_PROFILES)
    const fullscreen = matchDisplayProfile(
      verifiedRamAvCm01Runtime({
        innerWidth: 1728,
        innerHeight: 1117,
        outerWidth: 1728,
        outerHeight: 1117,
        availWidth: 1728,
        availHeight: 1117,
        fullscreen: true,
        orientationType: 'landscape-primary',
      }),
      DISPLAY_PROFILES,
    )
    const fullscreenAvail = matchDisplayProfile(
      verifiedRamAvCm01Runtime({
        innerWidth: 1728,
        innerHeight: 1079,
        fullscreen: true,
        orientationType: 'landscape-primary',
      }),
      DISPLAY_PROFILES,
    )

    expect(windowed.winner.id).toBe('RAM_AV_CM01')
    expect(fullscreen.winner.id).toBe('RAM_AV_CM01')
    expect(fullscreenAvail.winner.id).toBe('RAM_AV_CM01')
    expect(fullscreen.confidence).toBeGreaterThan(70)
  })

  it('boosts RAM_AV_CM01 when ?vehicle=ram&adapter=av-cm01 and geometry is compatible', () => {
    const identity: IdentitySignals = { vehicle: 'ram', adapter: 'av-cm01' }
    const slightlyOff = verifiedRamAvCm01Runtime({ innerWidth: 1480, innerHeight: 1040 })
    const withHint = matchDisplayProfile(slightlyOff, DISPLAY_PROFILES, identity)
    const withoutHint = matchDisplayProfile(slightlyOff, DISPLAY_PROFILES)
    expect(withHint.winner.id).toBe('RAM_AV_CM01')
    expect(withHint.confidence).toBeGreaterThanOrEqual(withoutHint.confidence)
    expect(withHint.scores.find((item) => item.profile.id === 'RAM_AV_CM01')?.breakdown.identity).toBeGreaterThan(20)
  })

  it('does not let an ordinary laptop landscape become RAM', () => {
    const laptop = verifiedRamAvCm01Runtime({
      innerWidth: 1512,
      innerHeight: 982,
      screenWidth: 1512,
      screenHeight: 982,
      availWidth: 1512,
      availHeight: 954,
      devicePixelRatio: 2,
      orientationType: 'landscape-primary',
    })
    const result = matchDisplayProfile(laptop, DISPLAY_PROFILES)
    expect(result.winner.id).not.toBe('RAM_AV_CM01')
    expect(result.winner.vehicle).not.toBe('ram')
  })

  it('does not regress Ford or Tesla profiles', () => {
    expect(matchDisplayProfile(verifiedRamAvCm01Runtime({
      innerWidth: 1280,
      innerHeight: 768,
      screenWidth: 1280,
      screenHeight: 768,
      devicePixelRatio: 1,
    }), DISPLAY_PROFILES).winner.id).toBe('FORD_F250_12_LANDSCAPE')

    expect(matchDisplayProfile(verifiedRamAvCm01Runtime({
      innerWidth: 1920,
      innerHeight: 1200,
      screenWidth: 1920,
      screenHeight: 1200,
      devicePixelRatio: 1,
      orientationType: 'landscape-primary',
    }), DISPLAY_PROFILES).winner.id).toBe('TESLA_MODEL_Y_LANDSCAPE')
  })
})

describe('Remember this display', () => {
  it('stores the active RAM_AV_CM01 profile, not a stale generic detection', () => {
    const runtime = verifiedRamAvCm01Runtime()
    const { manager, storage } = createHarness(runtime)
    manager.start()
    manager.setOverride('GENERIC')
    expect(manager.getSnapshot()?.detectedProfile.id).toBe('RAM_AV_CM01')
    expect(manager.getSnapshot()?.activeProfile.id).toBe('GENERIC_LANDSCAPE')

    manager.setOverride('FORCE_RAM_HDMI')
    const remembered = manager.rememberFingerprint()
    expect(remembered.activeProfile.id).toBe('RAM_AV_CM01')
    expect(storage.load().fingerprints[runtime.hardwareFingerprint]).toBe('RAM_AV_CM01')
    expect(storage.load().fingerprints[runtime.hardwareFingerprint]).not.toBe('GENERIC_PORTRAIT')
    expect(storage.load().fingerprints[runtime.hardwareFingerprint]).not.toBe('GENERIC_LANDSCAPE')
  })

  it('AUTO still selects RAM_AV_CM01 after a Force HDMI override is cleared', () => {
    const { manager } = createHarness(verifiedRamAvCm01Runtime())
    manager.start()
    manager.setOverride('FORCE_RAM_HDMI')
    const restored = manager.setOverride('AUTO')
    expect(restored.overrideMode).toBe('AUTO')
    expect(restored.detectedProfile.id).toBe('RAM_AV_CM01')
    expect(restored.activeProfile.id).toBe('RAM_AV_CM01')
    expect(restored.activeLayout).toBe('ram-hdmi-bridge')
    expect(restored.detectedConfidence).toBeGreaterThanOrEqual(90)
    expect(restored.source).toBe('auto')
  })
})

describe('12.4 mapping region', () => {
  it('derives a high-coverage mapping frame from the HDMI profile, not a squeezed portrait box', () => {
    const runtime = verifiedRamAvCm01Runtime()
    const profile = getProfileById('RAM_AV_CM01')!
    const map = computePhysicalMap('ram-hdmi-bridge', runtime, profile.safeArea, profile.touchTarget)
    expect(map.coverage).toBeGreaterThan(0.85)
    expect(map.leftPct).toBeLessThan(8)
    expect(map.rightPct).toBeLessThan(8)
    expect(map.topPct).toBeLessThan(6)
    expect(map.leftPct).toBeGreaterThan(0)

    const { manager } = createHarness(runtime)
    const snapshot = manager.start()
    expect(snapshot.applied.physicalMap.coverage).toBeGreaterThan(0.85)
    expect(snapshot.applied.resolvedLayout).toBe('ram-hdmi-bridge')
    expect(snapshot.applied.heroProportion).toBe('1555 / 1081')
  })
})
