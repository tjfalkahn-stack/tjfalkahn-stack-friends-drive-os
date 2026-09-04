export type DisplayOrientation = 'portrait' | 'landscape'

export type LayoutId =
  | 'ram-auto'
  | 'ram-portrait'
  | 'ram-hdmi-bridge'
  | 'ford-landscape'
  | 'tesla-landscape'
  | 'generic-portrait'
  | 'generic-landscape'

export type VehicleId = 'ram' | 'ford' | 'tesla' | 'generic'

export type OverrideMode =
  | 'AUTO'
  | 'FORCE_RAM_PORTRAIT'
  | 'FORCE_RAM_HDMI'
  | 'FORCE_FORD'
  | 'FORCE_TESLA'
  | 'GENERIC'

export type SafeArea = {
  top: number
  right: number
  bottom: number
  left: number
}

export type DisplayProfile = {
  id: string
  vehicle: VehicleId
  label: string
  orientation: DisplayOrientation
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  minAspect?: number
  maxAspect?: number
  targetDevicePixelRatio?: number
  minDevicePixelRatio?: number
  maxDevicePixelRatio?: number
  minScreenWidth?: number
  maxScreenWidth?: number
  preferredScreenWidth?: number
  minScreenHeight?: number
  maxScreenHeight?: number
  preferredScreenHeight?: number
  layout: LayoutId
  safeArea: SafeArea
  touchTarget: number
  uiScale: number
  /**
   * Optional matcher hints. These never identify a vehicle by a single
   * exact pixel size — they only shape score-based confidence.
   */
  preferredWidth?: number
  preferredHeight?: number
  preferredAspect?: number
  /** Lower than 1 keeps family/fallback profiles from beating specific matches. */
  specificity?: number
  orientationMode?: 'fixed' | 'either'
  adapterIds?: string[]
  hostIds?: string[]
  bridgeHints?: {
    hdmiLike?: boolean
    portraitPanelTarget?: 'ram-12-4'
    typicalAspects?: number[]
  }
}

export type DisplayRuntime = {
  innerWidth: number
  innerHeight: number
  outerWidth: number
  outerHeight: number
  devicePixelRatio: number
  screenWidth: number
  screenHeight: number
  availWidth: number
  availHeight: number
  orientationType: string | null
  aspectRatio: number
  orientation: DisplayOrientation
  fullscreen: boolean
  hardwareFingerprint: string
}

export type IdentitySignals = {
  vehicle?: string | null
  adapter?: string | null
  hostApp?: string | null
  profileHint?: string | null
  userSelectedVehicle?: string | null
  hardwareFingerprint?: string | null
  fingerprintProfileId?: string | null
  queryParam?: string | null
}

export type ProfileScoreBreakdown = {
  orientation: number
  width: number
  height: number
  aspect: number
  devicePixelRatio: number
  screen: number
  bridge: number
  identity: number
}

export type PhysicalMapInsets = {
  topPct: number
  rightPct: number
  bottomPct: number
  leftPct: number
  coverage: number
}

export type ProfileScore = {
  profile: DisplayProfile
  score: number
  breakdown: ProfileScoreBreakdown
}

export type ProfileCalibration = {
  scale?: number
  safeArea?: Partial<SafeArea>
  touchTarget?: number
}

export type PersistedDisplayState = {
  version: number
  lastDetectedProfileId: string | null
  overrideMode: OverrideMode
  calibrations: Record<string, ProfileCalibration>
  fingerprints: Record<string, string>
  userSelectedVehicle?: string | null
}

export type AppliedProfile = {
  profile: DisplayProfile
  resolvedLayout: Exclude<LayoutId, 'ram-auto'>
  uiScale: number
  safeArea: SafeArea
  touchTarget: number
  navPlacement: 'bottom' | 'left' | 'bottom-center' | 'top'
  bottomRailHeight: number
  fontScale: number
  gridColumns: number
  heroProportion: string
  mediaLayout: string
  browserLayout: string
  cameraLayout: string
  towLiveLayout: string
  physicalMap: PhysicalMapInsets
}

export type DetectionSnapshot = {
  runtime: DisplayRuntime
  identity: IdentitySignals
  scores: ProfileScore[]
  detectedProfile: DisplayProfile
  detectedConfidence: number
  activeProfile: DisplayProfile
  activeLayout: AppliedProfile['resolvedLayout']
  applied: AppliedProfile
  overrideMode: OverrideMode
  source: 'auto' | 'override' | 'identity'
  layoutChanged: boolean
  generation: number
}

export type DisplayManagerEvent = {
  reason: 'startup' | 'geometry' | 'override' | 'calibration' | 'identity' | 'manual'
  snapshot: DetectionSnapshot
}

export const CONFIDENCE_THRESHOLD = 64

export const DISPLAY_STORAGE_VERSION = 2
export const DISPLAY_STORAGE_KEY = 'friends-drive-os.display.v2'
export const DISPLAY_STORAGE_LEGACY_KEYS = ['friends-drive-os.display.v1'] as const

export const OVERRIDE_OPTIONS: Array<{ mode: OverrideMode; label: string }> = [
  { mode: 'AUTO', label: 'AUTO' },
  { mode: 'FORCE_RAM_PORTRAIT', label: 'FORCE RAM PORTRAIT' },
  { mode: 'FORCE_RAM_HDMI', label: 'FORCE RAM HDMI' },
  { mode: 'FORCE_FORD', label: 'FORCE FORD' },
  { mode: 'FORCE_TESLA', label: 'FORCE TESLA' },
  { mode: 'GENERIC', label: 'GENERIC' },
]
