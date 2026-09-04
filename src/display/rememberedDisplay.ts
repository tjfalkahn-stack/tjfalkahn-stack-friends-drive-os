import { getProfileById } from './profiles'
import type { DisplayProfile, OverrideMode } from './types'

export type RememberedDisplayStatus = 'unmapped' | 'matched' | 'stale'

export type RememberedDisplayView = {
  currentFingerprint: string
  currentDetectedProfile: DisplayProfile
  currentActiveProfile: DisplayProfile
  currentlyRememberedProfileForFingerprint: string | null
  currentlyRememberedProfile: DisplayProfile | null
  status: RememberedDisplayStatus
  headline: string
  forcedWarning: string | null
  differsFromActive: boolean
  rememberTargetId: string
  rememberTargetLabel: string
}

export function rememberTargetId(overrideMode: OverrideMode, detected: DisplayProfile, active: DisplayProfile): string {
  return overrideMode === 'AUTO' ? detected.id : active.id
}

export function describeRememberedDisplay(input: {
  currentFingerprint: string
  currentDetectedProfile: DisplayProfile
  currentActiveProfile: DisplayProfile
  currentlyRememberedProfileForFingerprint: string | null
  overrideMode: OverrideMode
}): RememberedDisplayView {
  const { currentFingerprint, currentDetectedProfile, currentActiveProfile, currentlyRememberedProfileForFingerprint, overrideMode } =
    input
  const remembered = currentlyRememberedProfileForFingerprint
    ? getProfileById(currentlyRememberedProfileForFingerprint) ?? null
    : null
  const targetId = rememberTargetId(overrideMode, currentDetectedProfile, currentActiveProfile)
  const target = getProfileById(targetId) ?? currentActiveProfile
  const status: RememberedDisplayStatus = currentlyRememberedProfileForFingerprint
    ? currentlyRememberedProfileForFingerprint === currentActiveProfile.id
      ? 'matched'
      : 'stale'
    : 'unmapped'

  const headline =
    status === 'unmapped'
      ? `Remember this display as ${target.label}`
      : status === 'matched'
        ? `Remembered as ${remembered?.label ?? currentlyRememberedProfileForFingerprint}`
        : `This display is remembered as ${currentlyRememberedProfileForFingerprint}`

  const forcedWarning =
    overrideMode !== 'AUTO'
      ? `You are in forced mode. Remembering will store ${target.id} for this fingerprint.`
      : null

  return {
    currentFingerprint,
    currentDetectedProfile,
    currentActiveProfile,
    currentlyRememberedProfileForFingerprint,
    currentlyRememberedProfile: remembered,
    status,
    headline,
    forcedWarning,
    differsFromActive: Boolean(
      currentlyRememberedProfileForFingerprint && currentlyRememberedProfileForFingerprint !== currentActiveProfile.id,
    ),
    rememberTargetId: target.id,
    rememberTargetLabel: target.label,
  }
}
