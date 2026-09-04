import { NavButton, Wordmark } from '../os/chrome'
import { ModuleViewport } from '../modules/ModuleViewport'
import { useDisplay } from '../os/DisplayContext'
import type { ModuleId } from '../os/catalog'

const RAIL: ModuleId[] = ['home', 'media', 'web', 'dotty', 'towlive', 'cameras', 'vehicle', 'apps', 'settings']

export function RamHdmiBridgeShell() {
  const { snapshot } = useDisplay()
  return (
    <div className="shell ram-hdmi">
      <aside className="left-rail" aria-label="RAM HDMI">
        <Wordmark kicker="HDMI bridge" />
        {RAIL.map((id) => (
          <NavButton key={id} id={id} compact />
        ))}
      </aside>
      <div className="hdmi-canvas">
        <div className="physical-map" aria-hidden>
          <span>12.4 mapping</span>
        </div>
        <main className="shell-main">
          <ModuleViewport />
        </main>
      </div>
      <p className="shell-footnote">
        {snapshot?.detectedProfile.label} · composition for the physical RAM 12.4 panel, not a squeezed portrait UI
      </p>
    </div>
  )
}
