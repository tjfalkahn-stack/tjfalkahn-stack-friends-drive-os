import { Clock, NavButton, Wordmark } from '../os/chrome'
import { VEHICLE_STATE } from '../os/catalog'
import { ModuleViewport } from '../modules/ModuleViewport'
import { useDisplay } from '../os/DisplayContext'
import type { ModuleId } from '../os/catalog'

const RAM_NAV: ModuleId[] = ['home', 'media', 'towlive', 'cameras', 'dotty', 'settings']

export function RamPortraitShell() {
  const { snapshot } = useDisplay()
  return (
    <div className="shell ram-portrait">
      <header className="shell-top">
        <Wordmark kicker="Portrait cockpit" />
        <div className="top-meta">
          <span>{VEHICLE_STATE.outdoorF}°</span>
          <span>{VEHICLE_STATE.gear}</span>
          <Clock />
        </div>
      </header>
      <main className="shell-main">
        <ModuleViewport />
      </main>
      <nav className="bottom-rail" aria-label="RAM portrait">
        {RAM_NAV.map((id) => (
          <NavButton key={id} id={id} />
        ))}
      </nav>
      <p className="shell-footnote">{snapshot?.detectedProfile.label}</p>
    </div>
  )
}
