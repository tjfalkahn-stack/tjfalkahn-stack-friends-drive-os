import { layoutLabel } from './applyProfile'
import type { DetectionSnapshot } from './types'

export function formatDisplayReport(snapshot: DetectionSnapshot): string {
  const { runtime, detectedProfile, detectedConfidence, activeProfile, applied, overrideMode } = snapshot
  return [
    'Friends Drive OS Display Report',
    `Profile: ${detectedProfile.id}`,
    `Confidence: ${Math.round(detectedConfidence)}%`,
    '',
    `innerWidth: ${runtime.innerWidth}`,
    `innerHeight: ${runtime.innerHeight}`,
    `outerWidth: ${runtime.outerWidth}`,
    `outerHeight: ${runtime.outerHeight}`,
    '',
    `screenWidth: ${runtime.screenWidth}`,
    `screenHeight: ${runtime.screenHeight}`,
    `availWidth: ${runtime.availWidth}`,
    `availHeight: ${runtime.availHeight}`,
    '',
    `devicePixelRatio: ${runtime.devicePixelRatio}`,
    `aspectRatio: ${runtime.aspectRatio.toFixed(4)}`,
    `orientation: ${runtime.orientationType ?? runtime.orientation}`,
    `fullscreen: ${runtime.fullscreen}`,
    '',
    `ActiveProfile: ${activeProfile.id}`,
    `ActiveLayout: ${layoutLabel(applied.resolvedLayout)}`,
    `Mode: ${overrideMode}`,
  ].join('\n')
}
