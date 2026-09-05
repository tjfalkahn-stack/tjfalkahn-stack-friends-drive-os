// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { DisplayProfileManager } from '../../src/display/DisplayProfileManager'
import { applyProfileToDocument } from '../../src/display/applyProfile'
import { createMemoryStorage, migratePersistedState } from '../../src/display/storage'
import { verifiedRamAvCm01Runtime } from '../../src/display/samples'
import type { DisplayEnvironment } from '../../src/display/DisplayProfileManager'

describe('extended RAM control calibration', () => {
  it('carries 96px through manager, persistence, CSS, profile switching and reset', () => {
    const runtime = verifiedRamAvCm01Runtime()
    const storage = createMemoryStorage()
    const environment: DisplayEnvironment = {
      collectRuntime: () => runtime,
      collectIdentity: state => ({ fingerprintProfileId: state.fingerprints[runtime.hardwareFingerprint] ?? null }),
      addEventListener: () => undefined, removeEventListener: () => undefined,
      applyToDocument: applied => applyProfileToDocument(applied),
    }
    const manager = new DisplayProfileManager({ storage, environment })
    manager.start()
    const calibrated = manager.setCalibration('RAM_AV_CM01', { touchTarget: 96, safeArea: { left: 30, right: 32, top: 24, bottom: 26 } })
    expect(calibrated.applied.touchTarget).toBe(96)
    expect(document.documentElement.style.getPropertyValue('--fd-touch')).toBe('96px')
    expect(calibrated.applied.safeArea).toEqual({ left: 30, right: 32, top: 24, bottom: 26 })
    manager.setOverride('FORCE_FORD')
    expect(manager.getSnapshot()?.applied.touchTarget).not.toBe(96)
    manager.setOverride('FORCE_RAM_HDMI')
    expect(manager.getSnapshot()?.applied.touchTarget).toBe(96)
    manager.rememberFingerprint()
    manager.resetDisplayMemory({ resetOverride: true })
    expect(storage.load().fingerprints).toEqual({})
    expect(storage.load().calibrations.RAM_AV_CM01?.touchTarget).toBe(96)
    manager.stop()
    const reloaded = new DisplayProfileManager({ storage, environment })
    expect(reloaded.start().applied.touchTarget).toBe(96)
    reloaded.stop()
  })
  it('does not discard older saved touch calibration during migration', () => {
    const state = migratePersistedState({ version: 1, calibrations: { RAM_AV_CM01: { touchTarget: 72 }, RAM_12_4_PORTRAIT: { touchTarget: 40 } } })
    expect(state.calibrations.RAM_AV_CM01?.touchTarget).toBe(72)
    expect(state.calibrations.RAM_12_4_PORTRAIT?.touchTarget).toBe(40)
  })
})
