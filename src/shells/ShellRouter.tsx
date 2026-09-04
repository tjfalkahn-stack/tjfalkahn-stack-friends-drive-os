import { useDisplay } from '../os/DisplayContext'
import { FordLandscapeShell } from './FordLandscapeShell'
import { GenericLandscapeShell, GenericPortraitShell } from './GenericShells'
import { RamHdmiBridgeShell } from './RamHdmiBridgeShell'
import { RamPortraitShell } from './RamPortraitShell'
import { TeslaLandscapeShell } from './TeslaLandscapeShell'

export function ShellRouter() {
  const { snapshot } = useDisplay()
  if (!snapshot) {
    return <div className="boot">Friends Drive OS</div>
  }

  switch (snapshot.activeLayout) {
    case 'ram-portrait':
      return <RamPortraitShell key="ram-portrait" />
    case 'ram-hdmi-bridge':
      return <RamHdmiBridgeShell key="ram-hdmi-bridge" />
    case 'ford-landscape':
      return <FordLandscapeShell key="ford-landscape" />
    case 'tesla-landscape':
      return <TeslaLandscapeShell key="tesla-landscape" />
    case 'generic-portrait':
      return <GenericPortraitShell key="generic-portrait" />
    case 'generic-landscape':
      return <GenericLandscapeShell key="generic-landscape" />
    default:
      return <GenericLandscapeShell key="generic-landscape-default" />
  }
}
