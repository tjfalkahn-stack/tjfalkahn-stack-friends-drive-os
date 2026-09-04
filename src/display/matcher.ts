import { GENERIC_PROFILE_IDS } from './profiles'
import { CONFIDENCE_THRESHOLD } from './types'
import type {
  DisplayProfile,
  DisplayRuntime,
  IdentitySignals,
  ProfileScore,
  ProfileScoreBreakdown,
} from './types'

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

function hasScreenRanges(profile: DisplayProfile): boolean {
  return profile.minScreenWidth != null || profile.maxScreenWidth != null || profile.preferredScreenWidth != null
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

function dprScore(runtime: DisplayRuntime, profile: DisplayProfile): number {
  if (
    profile.targetDevicePixelRatio == null &&
    profile.minDevicePixelRatio == null &&
    profile.maxDevicePixelRatio == null
  ) {
    return 0
  }

  return (
    rangeScore(
      runtime.devicePixelRatio,
      profile.minDevicePixelRatio,
      profile.maxDevicePixelRatio,
      profile.targetDevicePixelRatio,
    ) * 8
  )
}

function screenScore(runtime: DisplayRuntime, profile: DisplayProfile): number {
  if (!hasScreenRanges(profile)) return 0

  return (
    rangeScore(
      runtime.screenWidth,
      profile.minScreenWidth,
      profile.maxScreenWidth,
      profile.preferredScreenWidth,
    ) *
      10 +
    rangeScore(
      runtime.screenHeight,
      profile.minScreenHeight,
      profile.maxScreenHeight,
      profile.preferredScreenHeight,
    ) *
      8
  )
}

function screenFit(runtime: DisplayRuntime, profile: DisplayProfile): number {
  if (!hasScreenRanges(profile)) return 1
  return (
    (rangeScore(
      runtime.screenWidth,
      profile.minScreenWidth,
      profile.maxScreenWidth,
      profile.preferredScreenWidth,
    ) +
      rangeScore(
        runtime.screenHeight,
        profile.minScreenHeight,
        profile.maxScreenHeight,
        profile.preferredScreenHeight,
      )) /
    2
  )
}

function bridgeScore(runtime: DisplayRuntime, profile: DisplayProfile): number {
  const hints = profile.bridgeHints
  if (!hints) return 0
  let score = 0

  if (hints.portraitPanelTarget === 'ram-12-4') {
    score += 2
  }

  if (hints.hdmiLike) {
    const type = runtime.orientationType?.toLowerCase() ?? ''
    if (type.includes('landscape')) score += 4
    if (screenFit(runtime, profile) >= 0.78) score += 6
    if (runtime.fullscreen && screenFit(runtime, profile) >= 0.78 && runtime.orientation === 'landscape') {
      score += 4
    }
  }

  return score
}

function identityGeometryCompatible(runtime: DisplayRuntime): boolean {
  return runtime.orientation === 'landscape' && runtime.aspectRatio >= 1.2 && runtime.aspectRatio <= 1.85
}

function identityScore(
  profile: DisplayProfile,
  runtime: DisplayRuntime,
  identity?: IdentitySignals | null,
): number {
  if (!identity) return 0
  let score = 0
  const vehicle = identity.vehicle?.toLowerCase() || identity.userSelectedVehicle?.toLowerCase()
  if (vehicle && vehicle === profile.vehicle) score += 12
  if (vehicle && vehicle !== profile.vehicle && profile.vehicle !== 'generic') score -= 18

  const adapter = identity.adapter?.toLowerCase()
  if (adapter && profile.adapterIds?.some((id) => id.toLowerCase() === adapter)) {
    score += identityGeometryCompatible(runtime) ? 20 : 4
  }

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
    devicePixelRatio: dprScore(runtime, profile),
    screen: screenScore(runtime, profile),
    bridge: bridgeScore(runtime, profile),
    identity: identityScore(profile, runtime, identity),
  }

  const raw =
    breakdown.orientation +
    breakdown.width +
    breakdown.height +
    breakdown.aspect +
    breakdown.devicePixelRatio +
    breakdown.screen +
    breakdown.bridge +
    breakdown.identity

  const specificity = profile.specificity ?? 1
  let score = clamp(raw * specificity, 0, 100)

  if (hasScreenRanges(profile) && screenFit(runtime, profile) < 0.55) {
    score = clamp(score * 0.5, 0, 100)
  }

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
