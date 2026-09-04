import type { IdentitySignals, PersistedDisplayState } from './types'

export function collectIdentitySignals(
  search: string = typeof window === 'undefined' ? '' : window.location.search,
  stored?: PersistedDisplayState | null,
): IdentitySignals {
  const params = new URLSearchParams(search.startsWith('?') ? search : search ? `?${search}` : '')
  const vehicle = params.get('vehicle') || stored?.userSelectedVehicle || null
  const adapter = params.get('adapter')
  const hostApp = params.get('host') || params.get('hostApp')
  const profileHint = params.get('profile') || params.get('layout')
  const fingerprint = stored?.lastDetectedProfileId
    ? Object.entries(stored.fingerprints).find(([, profileId]) => profileId === stored.lastDetectedProfileId)?.[0]
    : null

  return {
    vehicle,
    adapter,
    hostApp,
    profileHint,
    userSelectedVehicle: stored?.userSelectedVehicle ?? null,
    hardwareFingerprint: fingerprint ?? null,
    fingerprintProfileId: null,
    queryParam: search || null,
  }
}

export function fingerprintProfileId(
  fingerprint: string | null | undefined,
  stored?: PersistedDisplayState | null,
): string | null {
  if (!fingerprint || !stored) return null
  return stored.fingerprints[fingerprint] ?? null
}

export function withFingerprintMatch(
  identity: IdentitySignals,
  fingerprint: string,
  stored?: PersistedDisplayState | null,
): IdentitySignals {
  return {
    ...identity,
    hardwareFingerprint: fingerprint,
    fingerprintProfileId: fingerprintProfileId(fingerprint, stored),
  }
}
