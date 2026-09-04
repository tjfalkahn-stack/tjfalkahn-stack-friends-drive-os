import { DISPLAY_STORAGE_KEY, type OverrideMode, type PersistedDisplayState, type ProfileCalibration } from './types'

const DEFAULT_STATE: PersistedDisplayState = {
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

export function createMemoryStorage(initial?: Partial<PersistedDisplayState>): DisplayStorage {
  let state: PersistedDisplayState = {
    ...DEFAULT_STATE,
    ...initial,
    calibrations: { ...DEFAULT_STATE.calibrations, ...initial?.calibrations },
    fingerprints: { ...DEFAULT_STATE.fingerprints, ...initial?.fingerprints },
  }

  return {
    load: () => ({
      ...state,
      calibrations: { ...state.calibrations },
      fingerprints: { ...state.fingerprints },
    }),
    save: (next) => {
      state = {
        ...next,
        calibrations: { ...next.calibrations },
        fingerprints: { ...next.fingerprints },
      }
    },
  }
}

export function createLocalStorageAdapter(
  key = DISPLAY_STORAGE_KEY,
  store?: Pick<Storage, 'getItem' | 'setItem'>,
): DisplayStorage {
  const backend = store ?? (typeof localStorage === 'undefined' ? null : localStorage)

  return {
    load() {
      if (!backend) return { ...DEFAULT_STATE, calibrations: {}, fingerprints: {} }
      try {
        const raw = backend.getItem(key)
        if (!raw) return { ...DEFAULT_STATE, calibrations: {}, fingerprints: {} }
        const parsed = JSON.parse(raw) as Partial<PersistedDisplayState>
        return {
          lastDetectedProfileId: parsed.lastDetectedProfileId ?? null,
          overrideMode: (parsed.overrideMode as OverrideMode) || 'AUTO',
          calibrations: parsed.calibrations ?? {},
          fingerprints: parsed.fingerprints ?? {},
          userSelectedVehicle: parsed.userSelectedVehicle ?? null,
        }
      } catch {
        return { ...DEFAULT_STATE, calibrations: {}, fingerprints: {} }
      }
    },
    save(state) {
      if (!backend) return
      backend.setItem(key, JSON.stringify(state))
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
