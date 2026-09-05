import { computePhysicalMap } from './physicalMap'
import type { AppliedProfile, DisplayProfile, DisplayRuntime, LayoutId } from './types'

export type ResolvedLayout = AppliedProfile['resolvedLayout']

const LAYOUT_TOKENS: Record<
  ResolvedLayout,
  Omit<AppliedProfile, 'profile' | 'resolvedLayout' | 'uiScale' | 'safeArea' | 'touchTarget' | 'physicalMap'>
> = {
  'ram-portrait': {
    navPlacement: 'bottom',
    bottomRailHeight: 92,
    fontScale: 1.08,
    gridColumns: 2,
    heroProportion: '4 / 5',
    mediaLayout: 'ram-portrait-stack',
    browserLayout: 'ram-portrait-browser',
    cameraLayout: 'ram-portrait-stack',
    towLiveLayout: 'ram-portrait-tow',
  },
  'ram-hdmi-bridge': {
    navPlacement: 'left',
    bottomRailHeight: 64,
    fontScale: 0.98,
    gridColumns: 3,
    heroProportion: '1555 / 1081',
    mediaLayout: 'ram-hdmi-stage',
    browserLayout: 'ram-hdmi-browser',
    cameraLayout: 'ram-hdmi-quad',
    towLiveLayout: 'ram-hdmi-tow',
  },
  'ford-landscape': {
    navPlacement: 'bottom',
    bottomRailHeight: 76,
    fontScale: 1,
    gridColumns: 4,
    heroProportion: '16 / 9',
    mediaLayout: 'ford-strip',
    browserLayout: 'ford-tabs',
    cameraLayout: 'ford-pip',
    towLiveLayout: 'ford-gauges',
  },
  'tesla-landscape': {
    navPlacement: 'bottom-center',
    bottomRailHeight: 72,
    fontScale: 1.02,
    gridColumns: 3,
    heroProportion: '1.45 / 1',
    mediaLayout: 'tesla-cinema',
    browserLayout: 'tesla-overlay',
    cameraLayout: 'tesla-filmstrip',
    towLiveLayout: 'tesla-viz',
  },
  'generic-portrait': {
    navPlacement: 'bottom',
    bottomRailHeight: 80,
    fontScale: 1,
    gridColumns: 2,
    heroProportion: '3 / 4',
    mediaLayout: 'generic-portrait-media',
    browserLayout: 'generic-portrait-browser',
    cameraLayout: 'generic-portrait-cams',
    towLiveLayout: 'generic-portrait-tow',
  },
  'generic-landscape': {
    navPlacement: 'left',
    bottomRailHeight: 68,
    fontScale: 1,
    gridColumns: 3,
    heroProportion: '16 / 10',
    mediaLayout: 'generic-landscape-media',
    browserLayout: 'generic-landscape-browser',
    cameraLayout: 'generic-landscape-cams',
    towLiveLayout: 'generic-landscape-tow',
  },
}

export function resolveLayout(profile: DisplayProfile, runtime: DisplayRuntime): ResolvedLayout {
  if (profile.layout === 'ram-auto') {
    return runtime.orientation === 'portrait' ? 'ram-portrait' : 'ram-hdmi-bridge'
  }
  return profile.layout as ResolvedLayout
}

export function buildAppliedProfile(
  profile: DisplayProfile,
  runtime: DisplayRuntime,
  calibration?: { scale?: number; safeArea?: Partial<DisplayProfile['safeArea']>; touchTarget?: number },
): AppliedProfile {
  const resolvedLayout = resolveLayout(profile, runtime)
  const tokens = LAYOUT_TOKENS[resolvedLayout]
  const safeArea = {
    ...profile.safeArea,
    ...calibration?.safeArea,
  }
  const touchTarget = calibration?.touchTarget ?? profile.touchTarget
  const physicalMap = computePhysicalMap(resolvedLayout, runtime, safeArea, touchTarget)

  return {
    profile,
    resolvedLayout,
    uiScale: calibration?.scale ?? profile.uiScale,
    safeArea,
    touchTarget,
    physicalMap,
    ...tokens,
  }
}

export function layoutLabel(layout: LayoutId | ResolvedLayout): string {
  switch (layout) {
    case 'ram-auto':
      return 'RAM Auto'
    case 'ram-portrait':
      return 'RAM Portrait Cockpit'
    case 'ram-hdmi-bridge':
      return 'RAM HDMI Bridge'
    case 'ford-landscape':
      return 'Ford Landscape Shell'
    case 'tesla-landscape':
      return 'Tesla Landscape Shell'
    case 'generic-portrait':
      return 'Generic Portrait'
    case 'generic-landscape':
      return 'Generic Landscape'
    default:
      return layout
  }
}

export function applyProfileToDocument(applied: AppliedProfile, root: HTMLElement | null = typeof document === 'undefined' ? null : document.documentElement) {
  if (!root) return

  const { safeArea } = applied
  root.dataset.profile = applied.profile.id
  root.dataset.vehicle = applied.profile.vehicle
  root.dataset.layout = applied.resolvedLayout
  root.dataset.orientation = applied.profile.orientation
  root.dataset.nav = applied.navPlacement
  root.style.setProperty('--fd-safe-top', `${safeArea.top}px`)
  root.style.setProperty('--fd-safe-right', `${safeArea.right}px`)
  root.style.setProperty('--fd-safe-bottom', `${safeArea.bottom}px`)
  root.style.setProperty('--fd-safe-left', `${safeArea.left}px`)
  root.style.setProperty('--fd-touch', `${applied.touchTarget}px`)
  root.style.setProperty('--fd-ui-scale', String(applied.uiScale))
  root.style.setProperty('--fd-font-scale', String(applied.fontScale))
  root.style.setProperty('--fd-bottom-rail', `${applied.bottomRailHeight}px`)
  root.style.setProperty('--fd-grid-columns', String(applied.gridColumns))
  root.style.setProperty('--fd-hero', applied.heroProportion)
  root.style.setProperty('--fd-map-top', `${applied.physicalMap.topPct}%`)
  root.style.setProperty('--fd-map-right', `${applied.physicalMap.rightPct}%`)
  root.style.setProperty('--fd-map-bottom', `${applied.physicalMap.bottomPct}%`)
  root.style.setProperty('--fd-map-left', `${applied.physicalMap.leftPct}%`)
  root.dataset.mapCoverage = String(Math.round(applied.physicalMap.coverage * 100))
}
