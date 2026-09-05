import { ModuleViewport } from '../modules/ModuleViewport'
import { RamBack, RamHeader, RamNavigation } from '../ram/RamCockpit'

export function RamHdmiBridgeShell() {
  return (
    <div className="shell ram-hdmi">
      <aside className="ram-rail">
        <div className="ram-monogram" aria-label="Friends Drive">FD<span>DRIVE OS</span></div>
        <RamNavigation />
        <RamBack />
      </aside>
      <div className="hdmi-canvas">
        <RamHeader />
        {/* Keep the computed --fd-map-* padding. The old outline was diagnostic only. */}
        <main className="shell-main" id="ram-main" tabIndex={-1}>
          <ModuleViewport />
        </main>
      </div>
    </div>
  )
}
