import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DisplayProfileManager,
  formatDisplayReport,
  type DetectionSnapshot,
  type OverrideMode,
  type ProfileCalibration,
} from '../display'

const manager = new DisplayProfileManager()

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await Promise.race([
        navigator.clipboard.writeText(text),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error('clipboard timeout')), 400)
        }),
      ])
      return true
    }
  } catch {
    // fall through to execCommand
  }

  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.left = '-9999px'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
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
      copyReport: async () => {
        const current = manager.getSnapshot()
        if (!current) return ''
        const report = formatDisplayReport(current)
        const copied = await writeClipboard(report)
        if (!copied) {
          console.warn('Friends Drive OS could not write the clipboard; report is still available to copy manually.')
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
