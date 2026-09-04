import { Clock, NavButton, Wordmark } from '../os/chrome'
import { VEHICLE_STATE } from '../os/catalog'
import { ModuleViewport } from '../modules/ModuleViewport'
import type { ModuleId } from '../os/catalog'

const FORD_NAV: ModuleId[] = ['home', 'media', 'web', 'dotty', 'towlive', 'vehicle', 'cameras', 'apps', 'settings']

export function FordLandscapeShell() {
  return (
    <div className="shell ford-landscape">
      <header className="ford-top">
        <Wordmark kicker="F-250 landscape" />
        <div className="top-meta">
          <span>F-250</span>
          <span>{VEHICLE_STATE.gear}</span>
          <span>{VEHICLE_STATE.speed} mph</span>
          <Clock />
        </div>
      </header>
      <main className="shell-main">
        <ModuleViewport />
      </main>
      <nav className="bottom-rail ford-rail" aria-label="Ford">
        {FORD_NAV.map((id) => (
          <NavButton key={id} id={id} />
        ))}
      </nav>
    </div>
  )
}
