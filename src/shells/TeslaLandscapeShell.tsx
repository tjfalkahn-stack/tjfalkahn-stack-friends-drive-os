import { NavButton } from '../os/chrome'
import { ModuleViewport } from '../modules/ModuleViewport'
import type { ModuleId } from '../os/catalog'

const TESLA_NAV: ModuleId[] = ['home', 'media', 'web', 'dotty', 'towlive', 'vehicle', 'cameras', 'apps', 'settings']

export function TeslaLandscapeShell() {
  return (
    <div className="shell tesla-landscape">
      <main className="shell-main">
        <ModuleViewport />
      </main>
      <nav className="tesla-dock" aria-label="Tesla">
        {TESLA_NAV.map((id) => (
          <NavButton key={id} id={id} compact />
        ))}
      </nav>
    </div>
  )
}
