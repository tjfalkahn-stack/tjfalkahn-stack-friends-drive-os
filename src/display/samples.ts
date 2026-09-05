import type { DisplayRuntime } from './types'
import { runtimeFromPartial } from './runtime'

/**
 * Verified MacBook → HDMI → AV-CM01 → RAM 1500 Laramie 12.4 Uconnect
 * browser geometry. This is NOT the RAM LCD native panel resolution.
 */
export const VERIFIED_RAM_AV_CM01_SAMPLE = {
  innerWidth: 1555,
  innerHeight: 1081,
  outerWidth: 1400,
  outerHeight: 1060,
  screenWidth: 1728,
  screenHeight: 1117,
  availWidth: 1728,
  availHeight: 1079,
  devicePixelRatio: 1.7999999523162842,
  orientationType: 'landscape-primary' as const,
  fullscreen: false,
}

export const VERIFIED_RAM_AV_CM01_ASPECT =
  VERIFIED_RAM_AV_CM01_SAMPLE.innerWidth / VERIFIED_RAM_AV_CM01_SAMPLE.innerHeight

export function verifiedRamAvCm01Runtime(overrides: Partial<DisplayRuntime> = {}): DisplayRuntime {
  return runtimeFromPartial({
    ...VERIFIED_RAM_AV_CM01_SAMPLE,
    aspectRatio: VERIFIED_RAM_AV_CM01_ASPECT,
    orientation: 'landscape',
    ...overrides,
  })
}
