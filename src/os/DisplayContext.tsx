import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DisplayProfileManager,
  formatDisplayReport,
  type DetectionSnapshot,
  type OverrideMode,
  type ProfileCalibration,
} from '../display'

const manager = new DisplayProfileManager()

type DisplayContextValue = {
  snapshot: DetectionSnapshot | null
  setOverride: (mode: OverrideMode) => void
  setCalibration: (profileId: string, patch: ProfileCalibration) => void
  rememberDisplay: () => void
  copyReport: () => Promise<string>
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
        setSnapshot(manager.rememberFingerprint(current.detectedProfile.id))
      },
      copyReport: async () => {
        const current = manager.getSnapshot()
        if (!current) return ''
        const report = formatDisplayReport(current)
        try {
          await navigator.clipboard.writeText(report)
        } catch {
          const area = document.createElement('textarea')
          area.value = report
          document.body.appendChild(area)
          area.select()
          document.execCommand('copy')
          area.remove()
        }
        return report
      },
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
