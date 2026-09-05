import { useDisplay } from '../os/DisplayContext'
import { useOs } from '../os/OsContext'
import { DottyModule } from './DottyModule'
import { HomeModule } from './HomeModule'
import { MediaModule } from './MediaModule'
import { SettingsModule } from './SettingsModule'
import { TowLiveModule } from './TowLiveModule'
import { AppsModule, CamerasModule, VehicleModule } from './VehicleModule'
import { WebModule } from './WebModule'
import { RamApps, RamDemo, RamHome, RamMedia, RamWeb } from '../ram/RamCockpit'
import { useEffect } from 'react'

export function ModuleViewport() {
  const { module } = useOs()
  const { snapshot } = useDisplay()
  const layout = snapshot?.applied.resolvedLayout ?? 'generic-landscape'

  const isRam = layout === 'ram-portrait' || layout === 'ram-hdmi-bridge'
  useEffect(() => {
    if (isRam) {
      const main = document.getElementById('ram-main')
      main?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      main?.focus({ preventScroll: true })
    }
  }, [module, isRam])

  // Keep the existing modules and non-RAM compositions intact.
  if (isRam) {
    switch (module) {
      case 'home': return <RamHome />
      case 'media': return <RamMedia />
      case 'web': return <RamWeb />
      case 'apps': return <RamApps />
      case 'dotty': return <RamDemo><DottyModule layout={layout} /></RamDemo>
      case 'towlive': return <RamDemo><TowLiveModule layout={layout} /></RamDemo>
      case 'vehicle': return <RamDemo><VehicleModule layout={layout} /></RamDemo>
      case 'cameras': return <RamDemo><CamerasModule layout={layout} /></RamDemo>
      case 'settings': return <SettingsModule />
    }
  }

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
