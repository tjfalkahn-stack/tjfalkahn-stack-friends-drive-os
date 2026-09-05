import { Clock, NavButton, Wordmark } from '../os/chrome'
import { ModuleViewport } from '../modules/ModuleViewport'
import type { ModuleId } from '../os/catalog'

const NAV: ModuleId[] = ['home', 'media', 'web', 'dotty', 'towlive', 'cameras', 'settings']

export function GenericPortraitShell() {
  return (
    <div className="shell generic-portrait">
      <header className="shell-top">
        <Wordmark kicker="Generic portrait" />
        <Clock />
      </header>
      <main className="shell-main">
        <ModuleViewport />
      </main>
      <nav className="bottom-rail" aria-label="Generic portrait">
        {NAV.map((id) => (
          <NavButton key={id} id={id} />
        ))}
      </nav>
    </div>
  )
}

export function GenericLandscapeShell() {
  return (
    <div className="shell generic-landscape">
      <aside className="left-rail" aria-label="Generic landscape">
        <Wordmark kicker="Generic landscape" />
        {NAV.map((id) => (
          <NavButton key={id} id={id} compact />
        ))}
      </aside>
      <main className="shell-main">
        <ModuleViewport />
      </main>
    </div>
  )
}
