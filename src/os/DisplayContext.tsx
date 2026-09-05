import { writeClipboard } from './clipboard'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DisplayProfileManager,
  formatDisplayReport,
  type DetectionSnapshot,
  type OverrideMode,
  type ProfileCalibration,
} from '../display'

const manager = new DisplayProfileManager()

export type CopyReportResult = { report: string; copied: boolean }

async function copyCurrentReport(): Promise<CopyReportResult> {
  const current = manager.getSnapshot()
  if (!current) return { report: '', copied: false }
  const report = formatDisplayReport(current)
  return { report, copied: await writeClipboard(report) }
}

type DisplayContextValue = {
  snapshot: DetectionSnapshot | null
  setOverride: (mode: OverrideMode) => void
  setCalibration: (profileId: string, patch: ProfileCalibration) => void
  rememberDisplay: () => void
  updateRememberedDisplay: () => void
  forgetRememberedDisplay: () => void
  resetDisplayMemory: (options?: { resetOverride?: boolean }) => void
  copyReport: () => Promise<string>
  copyReportWithStatus: () => Promise<CopyReportResult>
}

const DisplayContext = createContext<DisplayContextValue | null>(null)

export function DisplayProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<DetectionSnapshot | null>(null)

  useEffect(() => {
    const unsubscribe = manager.subscribe((event) => setSnapshot(event.snapshot))
    manager.start()
    return () => {
      unsubscribe()
      manager.stop()
    }
  }, [])

  const value = useMemo<DisplayContextValue>(
    () => ({
      snapshot,
      setOverride: (mode) => {
        setSnapshot(manager.setOverride(mode))
      },
      setCalibration: (profileId, patch) => {
        setSnapshot(manager.setCalibration(profileId, patch))
      },
      rememberDisplay: () => {
        const current = manager.getSnapshot()
        if (!current) return
        const profileId =
          current.overrideMode === 'AUTO' ? current.detectedProfile.id : current.activeProfile.id
        setSnapshot(manager.rememberFingerprint(profileId))
      },
      updateRememberedDisplay: () => {
        const current = manager.getSnapshot()
        if (!current) return
        const profileId =
          current.overrideMode === 'AUTO' ? current.detectedProfile.id : current.activeProfile.id
        setSnapshot(manager.rememberFingerprint(profileId, current.runtime.hardwareFingerprint, { overwrite: true }))
      },
      forgetRememberedDisplay: () => {
        setSnapshot(manager.forgetFingerprint())
      },
      resetDisplayMemory: (options) => {
        setSnapshot(manager.resetDisplayMemory(options))
      },
      // Preserve the original string-returning method for any existing callers.
      copyReport: async () => (await copyCurrentReport()).report,
      copyReportWithStatus: copyCurrentReport,
    }),
    [snapshot],
  )

  return <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>
}

export function useDisplay() {
  const value = useContext(DisplayContext)
  if (!value) throw new Error('useDisplay must be used within DisplayProvider')
  return value
}

export function getDisplayManager() {
  return manager
}
