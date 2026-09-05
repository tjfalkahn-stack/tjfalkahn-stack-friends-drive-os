import { describe, expect, it } from 'vitest'
import { DisplayProfileManager } from '../../src/display/DisplayProfileManager'
import { computeDisplayFingerprint } from '../../src/display/fingerprint'
import { describeRememberedDisplay } from '../../src/display/rememberedDisplay'
import { getProfileById } from '../../src/display/profiles'
import { verifiedRamAvCm01Runtime } from '../../src/display/samples'
import {
  createLocalStorageAdapter,
  createMemoryStorage,
  migrateFingerprintMap,
  migratePersistedState,
} from '../../src/display/storage'
import { DISPLAY_STORAGE_KEY, DISPLAY_STORAGE_VERSION } from '../../src/display/types'
import type { DisplayEnvironment, DisplayRuntime, IdentitySignals } from '../../src/display'

function createHarness(
  initial: DisplayRuntime,
  stored?: Parameters<typeof createMemoryStorage>[0],
  identity?: IdentitySignals,
) {
  let current = initial
  const storage = createMemoryStorage(stored)
  const environment: DisplayEnvironment = {
    collectRuntime: () => current,
    collectIdentity: (state) => ({
      ...identity,
      vehicle: identity?.vehicle ?? state.userSelectedVehicle,
      userSelectedVehicle: state.userSelectedVehicle,
      fingerprintProfileId: state.fingerprints[current.hardwareFingerprint] ?? null,
    }),
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }
  return {
    manager: new DisplayProfileManager({ storage, environment, debounceMs: 25 }),
    storage,
  }
}

function viewFrom(manager: DisplayProfileManager) {
  const snapshot = manager.getSnapshot()
  if (!snapshot) throw new Error('missing snapshot')
  return describeRememberedDisplay({
    currentFingerprint: snapshot.runtime.hardwareFingerprint,
    currentDetectedProfile: snapshot.detectedProfile,
    currentActiveProfile: snapshot.activeProfile,
    currentlyRememberedProfileForFingerprint: snapshot.identity.fingerprintProfileId ?? null,
    overrideMode: snapshot.overrideMode,
  })
}

describe('remembered display view', () => {
  const runtime = verifiedRamAvCm01Runtime()
  const detected = getProfileById('RAM_AV_CM01')!
  const generic = getProfileById('GENERIC_PORTRAIT')!

  it('prompts to remember the current Auto profile when unmapped', () => {
    const view = describeRememberedDisplay({
      currentFingerprint: runtime.hardwareFingerprint,
      currentDetectedProfile: detected,
      currentActiveProfile: detected,
      currentlyRememberedProfileForFingerprint: null,
      overrideMode: 'AUTO',
    })
    expect(view.headline).toBe('Remember this display as RAM AV-CM01')
    expect(view.status).toBe('unmapped')
    expect(view.forcedWarning).toBeNull()
  })

  it('shows Remembered as RAM AV-CM01 when the fingerprint already maps to it', () => {
    const view = describeRememberedDisplay({
      currentFingerprint: runtime.hardwareFingerprint,
      currentDetectedProfile: detected,
      currentActiveProfile: detected,
      currentlyRememberedProfileForFingerprint: 'RAM_AV_CM01',
      overrideMode: 'AUTO',
    })
    expect(view.headline).toBe('Remembered as RAM AV-CM01')
    expect(view.status).toBe('matched')
  })

  it('shows the stale stored id when the mapping is wrong', () => {
    const view = describeRememberedDisplay({
      currentFingerprint: runtime.hardwareFingerprint,
      currentDetectedProfile: detected,
      currentActiveProfile: detected,
      currentlyRememberedProfileForFingerprint: generic.id,
      overrideMode: 'AUTO',
    })
    expect(view.headline).toBe('This display is remembered as GENERIC_PORTRAIT')
    expect(view.differsFromActive).toBe(true)
    expect(view.rememberTargetLabel).toBe('RAM AV-CM01')
  })

  it('warns that forced mode will store RAM_AV_CM01', () => {
    const view = describeRememberedDisplay({
      currentFingerprint: runtime.hardwareFingerprint,
      currentDetectedProfile: detected,
      currentActiveProfile: detected,
      currentlyRememberedProfileForFingerprint: null,
      overrideMode: 'FORCE_RAM_HDMI',
    })
    expect(view.forcedWarning).toBe(
      'You are in forced mode. Remembering will store RAM_AV_CM01 for this fingerprint.',
    )
  })
})

describe('Remember / Forget / Update / Reset', () => {
  it('surfaces an old Generic fingerprint mapping after RAM auto-detection', () => {
    const runtime = verifiedRamAvCm01Runtime()
    const { manager } = createHarness(runtime, {
      fingerprints: { [runtime.hardwareFingerprint]: 'GENERIC_PORTRAIT' },
    })
    const snapshot = manager.start()
    expect(snapshot.detectedProfile.id).toBe('RAM_AV_CM01')
    expect(snapshot.identity.fingerprintProfileId).toBe('GENERIC_PORTRAIT')
    const remembered = viewFrom(manager)
    expect(remembered.headline).toBe('This display is remembered as GENERIC_PORTRAIT')
    expect(remembered.differsFromActive).toBe(true)
  })

  it('shows Remembered as RAM AV-CM01 after AUTO remember', () => {
    const runtime = verifiedRamAvCm01Runtime()
    const { manager, storage } = createHarness(runtime)
    manager.start()
    const snapshot = manager.rememberFingerprint()
    expect(snapshot.detectedProfile.id).toBe('RAM_AV_CM01')
    expect(storage.load().fingerprints[runtime.hardwareFingerprint]).toBe('RAM_AV_CM01')
    expect(viewFrom(manager).headline).toBe('Remembered as RAM AV-CM01')
  })

  it('replaces a stale mapping only through an explicit update', () => {
    const runtime = verifiedRamAvCm01Runtime()
    const { manager, storage } = createHarness(runtime, {
      fingerprints: { [runtime.hardwareFingerprint]: 'GENERIC_PORTRAIT' },
    })
    manager.start()
    const blocked = manager.rememberFingerprint()
    expect(storage.load().fingerprints[runtime.hardwareFingerprint]).toBe('GENERIC_PORTRAIT')
    expect(blocked.identity.fingerprintProfileId).toBe('GENERIC_PORTRAIT')

    const updated = manager.rememberFingerprint(undefined, undefined, { overwrite: true })
    expect(updated.identity.fingerprintProfileId).toBe('RAM_AV_CM01')
    expect(storage.load().fingerprints[runtime.hardwareFingerprint]).toBe('RAM_AV_CM01')
    expect(viewFrom(manager).headline).toBe('Remembered as RAM AV-CM01')
  })

  it('Forget removes only the current fingerprint mapping', () => {
    const runtime = verifiedRamAvCm01Runtime()
    const { manager, storage } = createHarness(runtime, {
      fingerprints: {
        [runtime.hardwareFingerprint]: 'RAM_AV_CM01',
        '1111x2222@2:portrait': 'GENERIC_PORTRAIT',
      },
    })
    manager.start()
    manager.forgetFingerprint()
    const next = storage.load()
    expect(next.fingerprints[runtime.hardwareFingerprint]).toBeUndefined()
    expect(next.fingerprints['1111x2222@2:portrait']).toBe('GENERIC_PORTRAIT')
    expect(viewFrom(manager).status).toBe('unmapped')
    expect(viewFrom(manager).headline).toBe('Remember this display as RAM AV-CM01')
  })

  it('Reset Display Memory clears fingerprints and override, keeping calibration', () => {
    const runtime = verifiedRamAvCm01Runtime()
    const { manager, storage } = createHarness(runtime, {
      overrideMode: 'FORCE_RAM_HDMI',
      fingerprints: { [runtime.hardwareFingerprint]: 'GENERIC_PORTRAIT' },
      userSelectedVehicle: 'ram',
      calibrations: { RAM_AV_CM01: { scale: 1.12, touchTarget: 64 } },
    })
    manager.start()
    const reset = manager.resetDisplayMemory({ resetOverride: true })
    const next = storage.load()
    expect(next.fingerprints).toEqual({})
    expect(next.overrideMode).toBe('AUTO')
    expect(next.userSelectedVehicle).toBeNull()
    expect(next.calibrations.RAM_AV_CM01?.scale).toBe(1.12)
    expect(reset.activeProfile.id).toBe('RAM_AV_CM01')
    expect(viewFrom(manager).status).toBe('unmapped')
  })

  it('does not silently overwrite a remembered profile when FORCE mode is selected', () => {
    const runtime = verifiedRamAvCm01Runtime()
    const { manager, storage } = createHarness(runtime, {
      fingerprints: { [runtime.hardwareFingerprint]: 'GENERIC_PORTRAIT' },
    })
    manager.start()
    manager.setOverride('FORCE_RAM_HDMI')
    expect(storage.load().fingerprints[runtime.hardwareFingerprint]).toBe('GENERIC_PORTRAIT')
    manager.rememberFingerprint()
    expect(storage.load().fingerprints[runtime.hardwareFingerprint]).toBe('GENERIC_PORTRAIT')
    expect(viewFrom(manager).forcedWarning).toBe(
      'You are in forced mode. Remembering will store RAM_AV_CM01 for this fingerprint.',
    )
    expect(viewFrom(manager).headline).toBe('This display is remembered as GENERIC_PORTRAIT')
  })

  it('AUTO remember stores the current detected profile', () => {
    const runtime = verifiedRamAvCm01Runtime()
    const { manager, storage } = createHarness(runtime)
    const snapshot = manager.start()
    expect(snapshot.overrideMode).toBe('AUTO')
    manager.rememberFingerprint()
    expect(storage.load().fingerprints[runtime.hardwareFingerprint]).toBe(snapshot.detectedProfile.id)
    expect(storage.load().fingerprints[runtime.hardwareFingerprint]).toBe('RAM_AV_CM01')
  })
})

describe('storage migration', () => {
  it('rewrites v1 fingerprint keys and bumps the schema version', () => {
    const migrated = migratePersistedState({
      lastDetectedProfileId: 'GENERIC_PORTRAIT',
      overrideMode: 'FORCE_RAM_HDMI',
      fingerprints: {
        '1728x1117@1.8:1728x1079': 'GENERIC_PORTRAIT',
        '1728x1117@1.8': 'RAM_AV_CM01',
      },
      calibrations: { RAM_AV_CM01: { scale: 0.96 } },
    })

    expect(migrated.version).toBe(DISPLAY_STORAGE_VERSION)
    expect(migrated.fingerprints).toEqual({
      [computeDisplayFingerprint({ screenWidth: 1728, screenHeight: 1117, devicePixelRatio: 1.8 })]: 'RAM_AV_CM01',
    })
    expect(migrated.calibrations.RAM_AV_CM01?.scale).toBe(0.96)
    expect(migrated.overrideMode).toBe('FORCE_RAM_HDMI')
  })

  it('loads legacy localStorage key into v2 and discards unparseable fingerprint entries', () => {
    const memory = new Map<string, string>()
    const backend = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value)
      },
    }
    memory.set(
      'friends-drive-os.display.v1',
      JSON.stringify({
        fingerprints: {
          '1728x1117@1.8:1728x1079': 'GENERIC_PORTRAIT',
          'not-a-fingerprint': 'TESLA_MODEL_Y_LANDSCAPE',
        },
        overrideMode: 'AUTO',
        calibrations: { FORD_F250_12_LANDSCAPE: { touchTarget: 50 } },
      }),
    )

    const adapter = createLocalStorageAdapter(DISPLAY_STORAGE_KEY, backend)
    const loaded = adapter.load()
    expect(loaded.version).toBe(2)
    expect(loaded.fingerprints['1728x1117@1.8:landscape']).toBe('GENERIC_PORTRAIT')
    expect(loaded.fingerprints['not-a-fingerprint']).toBeUndefined()
    expect(loaded.calibrations.FORD_F250_12_LANDSCAPE?.touchTarget).toBe(50)
    expect(JSON.parse(memory.get(DISPLAY_STORAGE_KEY) ?? '{}').version).toBe(2)
  })

  it('migrateFingerprintMap keeps a specific vehicle over generic when keys collapse', () => {
    const next = migrateFingerprintMap({
      '1728x1117@1.8:1728x1079': 'GENERIC_PORTRAIT',
      '1728x1117@1.8': 'RAM_AV_CM01',
    })
    expect(next['1728x1117@1.8:landscape']).toBe('RAM_AV_CM01')
  })
})
