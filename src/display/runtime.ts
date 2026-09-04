import type { DisplayOrientation, DisplayRuntime } from './types'

export function orientationFromAspect(aspectRatio: number): DisplayOrientation {
  return aspectRatio >= 1 ? 'landscape' : 'portrait'
}

export function computeHardwareFingerprint(input: {
  screenWidth: number
  screenHeight: number
  availWidth: number
  availHeight: number
  devicePixelRatio: number
}): string {
  const dpr = Math.round(input.devicePixelRatio * 100) / 100
  return `${input.screenWidth}x${input.screenHeight}@${dpr}`
}

export function isFullscreen(doc?: Document | null): boolean {
  if (!doc) return false
  const anyDoc = doc as Document & {
    webkitFullscreenElement?: Element | null
    fullscreenElement?: Element | null
  }
  return Boolean(anyDoc.fullscreenElement || anyDoc.webkitFullscreenElement)
}

export function collectDisplayRuntime(
  win: Pick<Window, 'innerWidth' | 'innerHeight' | 'outerWidth' | 'outerHeight' | 'devicePixelRatio' | 'screen' | 'document'> = window,
): DisplayRuntime {
  const innerWidth = win.innerWidth || 1
  const innerHeight = win.innerHeight || 1
  const screenObj = win.screen
  const orientationType =
    (screenObj as Screen & { orientation?: { type?: string } }).orientation?.type ?? null
  const aspectRatio = innerWidth / innerHeight

  return {
    innerWidth,
    innerHeight,
    outerWidth: win.outerWidth || innerWidth,
    outerHeight: win.outerHeight || innerHeight,
    devicePixelRatio: win.devicePixelRatio || 1,
    screenWidth: screenObj?.width || innerWidth,
    screenHeight: screenObj?.height || innerHeight,
    availWidth: screenObj?.availWidth || innerWidth,
    availHeight: screenObj?.availHeight || innerHeight,
    orientationType,
    aspectRatio,
    orientation: orientationFromAspect(aspectRatio),
    fullscreen: isFullscreen(win.document ?? null),
    hardwareFingerprint: computeHardwareFingerprint({
      screenWidth: screenObj?.width || innerWidth,
      screenHeight: screenObj?.height || innerHeight,
      availWidth: screenObj?.availWidth || innerWidth,
      availHeight: screenObj?.availHeight || innerHeight,
      devicePixelRatio: win.devicePixelRatio || 1,
    }),
  }
}

export function runtimeFromPartial(partial: Partial<DisplayRuntime> & Pick<DisplayRuntime, 'innerWidth' | 'innerHeight'>): DisplayRuntime {
  const innerWidth = partial.innerWidth
  const innerHeight = partial.innerHeight
  const aspectRatio = innerWidth / innerHeight
  const screenWidth = partial.screenWidth ?? innerWidth
  const screenHeight = partial.screenHeight ?? innerHeight
  const availWidth = partial.availWidth ?? screenWidth
  const availHeight = partial.availHeight ?? screenHeight
  const devicePixelRatio = partial.devicePixelRatio ?? 1

  return {
    innerWidth,
    innerHeight,
    outerWidth: partial.outerWidth ?? innerWidth,
    outerHeight: partial.outerHeight ?? innerHeight,
    devicePixelRatio,
    screenWidth,
    screenHeight,
    availWidth,
    availHeight,
    orientationType: partial.orientationType ?? null,
    aspectRatio,
    orientation: partial.orientation ?? orientationFromAspect(aspectRatio),
    fullscreen: partial.fullscreen ?? false,
    hardwareFingerprint:
      partial.hardwareFingerprint ??
      computeHardwareFingerprint({
        screenWidth,
        screenHeight,
        availWidth,
        availHeight,
        devicePixelRatio,
      }),
  }
}
