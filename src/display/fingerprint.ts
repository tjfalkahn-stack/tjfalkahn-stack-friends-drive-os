import type { DisplayOrientation } from './types'

export type FingerprintInput = {
  screenWidth: number
  screenHeight: number
  devicePixelRatio: number
  orientation?: DisplayOrientation | null
}

/**
 * Authoritative runtime display fingerprint.
 * Uses screen geometry + DPR + screen orientation — not innerWidth, which
 * changes between windowed and fullscreen Chrome.
 */
export function computeDisplayFingerprint(input: FingerprintInput): string {
  const dpr = Math.round(input.devicePixelRatio * 100) / 100
  const orientation = input.orientation ?? screenOrientation(input.screenWidth, input.screenHeight)
  return `${input.screenWidth}x${input.screenHeight}@${dpr}:${orientation}`
}

export function screenOrientation(screenWidth: number, screenHeight: number): DisplayOrientation {
  return screenWidth >= screenHeight ? 'landscape' : 'portrait'
}

const FINGERPRINT_PATTERN = /^(\d+)x(\d+)@(\d+(?:\.\d+)?)(?::(.*))?$/

export function isCurrentFingerprintFormat(key: string): boolean {
  const match = key.match(FINGERPRINT_PATTERN)
  return Boolean(match && (match[4] === 'landscape' || match[4] === 'portrait'))
}

/** Rewrite v1 keys (`WxH@dpr` or `WxH@dpr:avail`) to the v2 screen fingerprint. */
export function migrateFingerprintKey(oldKey: string): string | null {
  const match = oldKey.match(FINGERPRINT_PATTERN)
  if (!match) return null
  const screenWidth = Number(match[1])
  const screenHeight = Number(match[2])
  const devicePixelRatio = Number(match[3])
  const suffix = match[4]
  const orientation: DisplayOrientation | undefined =
    suffix === 'landscape' || suffix === 'portrait' ? suffix : undefined
  return computeDisplayFingerprint({ screenWidth, screenHeight, devicePixelRatio, orientation })
}
