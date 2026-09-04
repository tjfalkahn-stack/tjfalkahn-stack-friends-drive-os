import type { PersistedDisplayState } from './types'

export function fingerprintProfileId(
  fingerprint: string | null | undefined,
  stored?: PersistedDisplayState | null,
): string | null {
  if (!fingerprint || !stored) return null
  return stored.fingerprints[fingerprint] ?? null
}
