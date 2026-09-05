import { ModuleViewport } from '../modules/ModuleViewport'
import { RamHeader, RamNavigation } from '../ram/RamCockpit'

export function RamPortraitShell() {
  return (
    <div className="shell ram-portrait">
      <RamHeader portrait />
      <main className="shell-main" id="ram-main" tabIndex={-1}>
        <ModuleViewport />
      </main>
      <RamNavigation portrait />
    </div>
  )
}
