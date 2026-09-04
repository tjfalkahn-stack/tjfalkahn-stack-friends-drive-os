import { GENERIC_PROFILE_IDS } from './profiles'
import { CONFIDENCE_THRESHOLD } from './types'
import type {
  DisplayProfile,
  DisplayRuntime,
  IdentitySignals,
  ProfileScore,
  ProfileScoreBreakdown,
} from './types'

const HDMI_SIZES: Array<[number, number]> = [
  [1920, 1080],
  [1280, 720],
  [1600, 900],
  [1366, 768],
  [1024, 576],
]

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Score a numeric value against an optional inclusive range.
 * Values inside the range score 1, with a gentle boost toward the preferred
 * center. Values outside fall off smoothly instead of using a brittle equality.
 */
export function rangeScore(
  value: number,
  min?: number,
  max?: number,
  preferred?: number,
): number {
  if (min == null && max == null && preferred == null) return 0.5

  const low = min ?? (preferred != null ? preferred * 0.7 : value)
  const high = max ?? (preferred != null ? preferred * 1.3 : value)
  const span = Math.max(high - low, 1)

  if (value >= low && value <= high) {
    const center = preferred ?? (low + high) / 2
    const closeness = 1 - Math.min(1, Math.abs(value - center) / span)
    return 0.78 + closeness * 0.22
  }

  const distance = value < low ? low - value : value - high
  return clamp(1 - distance / (span * 0.4), 0, 0.34)
}

function orientationScore(runtime: DisplayRuntime, profile: DisplayProfile): number {
  if (profile.orientationMode === 'either') {
    return 16
  }

  const type = runtime.orientationType?.toLowerCase() ?? ''
  const typeMatches =
    (profile.orientation === 'portrait' && type.includes('portrait')) ||
    (profile.orientation === 'landscape' && type.includes('landscape'))

  if (runtime.orientation === profile.orientation) {
    return typeMatches ? 24 : 22
  }

  if (typeMatches) return 8
  return -36
}

function bridgeScore(runtime: DisplayRuntime, profile: DisplayProfile): number {
  const hints = profile.bridgeHints
  if (!hints) return 0
  let score = 0

  if (hints.hdmiLike) {
    if (runtime.aspectRatio >= 1.72 && runtime.aspectRatio <= 1.82) score += 8
    const hdmiSize = HDMI_SIZES.some(
      ([width, height]) =>
        Math.abs(runtime.innerWidth - width) <= 48 && Math.abs(runtime.innerHeight - height) <= 48,
    )
    if (hdmiSize) score += 5
  }

  if (hints.portraitPanelTarget === 'ram-12-4') {
    score += 2
  }

  return score
}

function identityScore(profile: DisplayProfile, identity?: IdentitySignals | null): number {
  if (!identity) return 0
  let score = 0
  const vehicle = identity.vehicle?.toLowerCase() || identity.userSelectedVehicle?.toLowerCase()
  if (vehicle && vehicle === profile.vehicle) score += 12
  if (vehicle && vehicle !== profile.vehicle && profile.vehicle !== 'generic') score -= 18

  const adapter = identity.adapter?.toLowerCase()
  if (adapter && profile.adapterIds?.some((id) => id.toLowerCase() === adapter)) score += 16

  const host = identity.hostApp?.toLowerCase()
  if (host && profile.hostIds?.some((id) => id.toLowerCase() === host)) score += 10

  const hint = identity.profileHint?.toLowerCase()
  if (hint && (hint === profile.id.toLowerCase() || hint === profile.layout)) score += 20

  if (identity.fingerprintProfileId && identity.fingerprintProfileId === profile.id) score += 18

  return score
}

export function scoreProfile(
  runtime: DisplayRuntime,
  profile: DisplayProfile,
  identity?: IdentitySignals | null,
): ProfileScore {
  const breakdown: ProfileScoreBreakdown = {
    orientation: orientationScore(runtime, profile),
    width: rangeScore(runtime.innerWidth, profile.minWidth, profile.maxWidth, profile.preferredWidth) * 18,
    height: rangeScore(runtime.innerHeight, profile.minHeight, profile.maxHeight, profile.preferredHeight) * 16,
    aspect: rangeScore(runtime.aspectRatio, profile.minAspect, profile.maxAspect, profile.preferredAspect) * 20,
    devicePixelRatio:
      profile.targetDevicePixelRatio == null
        ? 0
        : (1 - Math.min(1, Math.abs(runtime.devicePixelRatio - profile.targetDevicePixelRatio) / 1.5)) * 6,
    bridge: bridgeScore(runtime, profile),
    identity: identityScore(profile, identity),
  }

  const raw =
    breakdown.orientation +
    breakdown.width +
    breakdown.height +
    breakdown.aspect +
    breakdown.devicePixelRatio +
    breakdown.bridge +
    breakdown.identity

  const specificity = profile.specificity ?? 1
  const score = clamp(raw * specificity, 0, 100)

  return { profile, score, breakdown }
}

export function matchDisplayProfile(
  runtime: DisplayRuntime,
  profiles: DisplayProfile[],
  identity?: IdentitySignals | null,
  confidenceThreshold = CONFIDENCE_THRESHOLD,
): {
  winner: DisplayProfile
  confidence: number
  scores: ProfileScore[]
  usedFallback: boolean
} {
  const scores = profiles
    .map((profile) => scoreProfile(runtime, profile, identity))
    .sort((a, b) => b.score - a.score || a.profile.id.localeCompare(b.profile.id))

  const specific = scores.filter((item) => !GENERIC_PROFILE_IDS.has(item.profile.id))
  const bestSpecific = specific[0]
  const genericId = runtime.orientation === 'portrait' ? 'GENERIC_PORTRAIT' : 'GENERIC_LANDSCAPE'
  const generic = scores.find((item) => item.profile.id === genericId) ?? scores.find((item) => GENERIC_PROFILE_IDS.has(item.profile.id))

  if (bestSpecific && bestSpecific.score >= confidenceThreshold) {
    return {
      winner: bestSpecific.profile,
      confidence: Math.round(bestSpecific.score),
      scores,
      usedFallback: false,
    }
  }

  const fallback = generic?.profile ?? bestSpecific?.profile ?? profiles[0]
  if (!fallback) {
    throw new Error('No display profiles registered')
  }

  return {
    winner: fallback,
    confidence: Math.round(bestSpecific?.score ?? generic?.score ?? 0),
    scores,
    usedFallback: true,
  }
}
