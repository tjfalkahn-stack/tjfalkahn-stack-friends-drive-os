import { useState } from 'react'
import type { ResolvedLayout } from '../display/applyProfile'

const START = 'https://friendsdrive.local/maps'

export function WebModule({ layout }: { layout: ResolvedLayout }) {
  const [url, setUrl] = useState(START)

  const chrome = (
    <form
      className="web-bar"
      onSubmit={(event) => {
        event.preventDefault()
      }}
    >
      <input value={url} onChange={(event) => setUrl(event.target.value)} aria-label="Address" />
      <button type="submit">Go</button>
    </form>
  )

  if (layout === 'ram-portrait') {
    return (
      <div className="mod web-portrait">
        {chrome}
        <div className="web-bookmarks">
          <button type="button">Weather</button>
          <button type="button">Trail reports</button>
          <button type="button">Fuel</button>
        </div>
        <div className="web-page">
          <h1>Maps</h1>
          <p>Large-thumb bookmarks sit above the page so they stay reachable on a tall RAM cockpit.</p>
        </div>
      </div>
    )
  }

  if (layout === 'ram-hdmi-bridge') {
    return (
      <div className="mod web-hdmi">
        <aside className="web-side">
          <button type="button">Maps</button>
          <button type="button">Weather</button>
          <button type="button">Fuel</button>
          <button type="button">Trail</button>
        </aside>
        <div className="web-main">
          {chrome}
          <div className="web-page bridge-safe">
            <h1>Bridge browser</h1>
            <p>The page stays in the center mapping column so HDMI letterboxing does not hide the address bar.</p>
          </div>
        </div>
      </div>
    )
  }

  if (layout === 'ford-landscape') {
    return (
      <div className="mod web-ford">
        <div className="ford-tabs">
          <span className="is-on">Maps</span>
          <span>Weather</span>
          <span>Search</span>
        </div>
        {chrome}
        <div className="web-page">
          <h1>Ford browser</h1>
          <p>Tabs across the top, wide content below — a landscape truck shell, not a squeezed RAM page.</p>
        </div>
      </div>
    )
  }

  if (layout === 'tesla-landscape') {
    return (
      <div className="mod web-tesla">
        <div className="web-page tesla-page">
          {chrome}
          <h1>Wide browser</h1>
          <p>Address overlay on a cinematic page. Tesla shell never loads RAM chrome.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mod">
      {chrome}
      <div className="web-page">
        <h1>Web</h1>
        <p>Generic browser layout.</p>
      </div>
    </div>
  )
}
