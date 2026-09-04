import { useDisplay } from '../os/DisplayContext'
import { useOs } from '../os/OsContext'
import { DottyModule } from './DottyModule'
import { HomeModule } from './HomeModule'
import { MediaModule } from './MediaModule'
import { SettingsModule } from './SettingsModule'
import { TowLiveModule } from './TowLiveModule'
import { AppsModule, CamerasModule, VehicleModule } from './VehicleModule'
import { WebModule } from './WebModule'

export function ModuleViewport() {
  const { module } = useOs()
  const { snapshot } = useDisplay()
  const layout = snapshot?.applied.resolvedLayout ?? 'generic-landscape'

  switch (module) {
    case 'home':
      return <HomeModule layout={layout} />
    case 'media':
      return <MediaModule layout={layout} />
    case 'web':
      return <WebModule layout={layout} />
    case 'dotty':
      return <DottyModule layout={layout} />
    case 'towlive':
      return <TowLiveModule layout={layout} />
    case 'vehicle':
      return <VehicleModule layout={layout} />
    case 'cameras':
      return <CamerasModule layout={layout} />
    case 'apps':
      return <AppsModule layout={layout} />
    case 'settings':
      return <SettingsModule />
    default:
      return null
  }
}
