import type { AppliedProfile, DisplayRuntime, PhysicalMapInsets, SafeArea } from './types'

export type { PhysicalMapInsets }

const EMPTY_MAP: PhysicalMapInsets = {
  topPct: 0,
  rightPct: 0,
  bottomPct: 0,
  leftPct: 0,
  coverage: 1,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * HDMI-bridge mapping insets for the physical RAM 12.4 panel.
 *
 * The browser canvas is landscape (verified ~1555×1081). The truck panel is
 * portrait. This frame is the largest safe rectangle in the HDMI canvas —
 * not a squeezed portrait layout and not a letterboxed 70% column.
 */
export function computePhysicalMap(
  layout: AppliedProfile['resolvedLayout'],
  runtime: DisplayRuntime,
  safeArea: SafeArea,
  touchTarget: number,
): PhysicalMapInsets {
  if (layout !== 'ram-hdmi-bridge') return EMPTY_MAP

  const padX = Math.max(safeArea.left, safeArea.right, touchTarget * 0.16)
  const padY = Math.max(safeArea.top, safeArea.bottom, 10)
  const xPct = clamp((padX / Math.max(runtime.innerWidth, 1)) * 100, 2, 4.5)
  const yPct = clamp((padY / Math.max(runtime.innerHeight, 1)) * 100, 1.6, 3.6)
  const coverage = ((100 - xPct * 2) / 100) * ((100 - yPct * 2) / 100)

  return {
    topPct: yPct,
    rightPct: xPct,
    bottomPct: yPct,
    leftPct: xPct,
    coverage,
  }
}
