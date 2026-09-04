import { VEHICLE_STATE } from '../os/catalog'
import type { ResolvedLayout } from '../display/applyProfile'

export function VehicleModule({ layout }: { layout: ResolvedLayout }) {
  const v = VEHICLE_STATE
  return (
    <div className={`mod vehicle ${layout}`}>
      <header>
        <h1>{layout.startsWith('tesla') ? 'Model Y' : layout.startsWith('ford') ? 'F-250' : layout.startsWith('ram') ? 'RAM' : 'Vehicle'}</h1>
        <p>
          {v.gear} · {v.speed} mph · {Math.round(v.fuelPct * 100)}%
        </p>
      </header>
      <div className="vehicle-tiles">
        <article>
          <span className="kicker">Range</span>
          <strong>{v.rangeMi} mi</strong>
        </article>
        <article>
          <span className="kicker">Outside</span>
          <strong>{v.outdoorF}°</strong>
        </article>
        <article>
          <span className="kicker">Tow</span>
          <strong>{v.tow.connected ? 'Linked' : 'Open'}</strong>
        </article>
      </div>
    </div>
  )
}

export function CamerasModule({ layout }: { layout: ResolvedLayout }) {
  const cams = ['Rear', 'Hitch', 'Trailer', 'Blind']

  if (layout === 'ram-portrait') {
    return (
      <div className="mod cams-stack">
        {cams.map((cam) => (
          <div key={cam} className="cam-tile">
            {cam}
          </div>
        ))}
      </div>
    )
  }

  if (layout === 'ram-hdmi-bridge') {
    return (
      <div className="mod cams-quad">
        {cams.map((cam) => (
          <div key={cam} className="cam-tile">
            {cam}
          </div>
        ))}
      </div>
    )
  }

  if (layout === 'ford-landscape') {
    return (
      <div className="mod cams-ford">
        <div className="cam-tile is-hero">Rear</div>
        <div className="cam-col">
          <div className="cam-tile">Hitch</div>
          <div className="cam-tile">Trailer</div>
          <div className="cam-tile">Blind</div>
        </div>
      </div>
    )
  }

  if (layout === 'tesla-landscape') {
    return (
      <div className="mod cams-tesla">
        <div className="cam-tile is-hero">Rear cinema</div>
        <div className="filmstrip">
          {cams.slice(1).map((cam) => (
            <div key={cam} className="cam-tile">
              {cam}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mod cams-generic">
      {cams.map((cam) => (
        <div key={cam} className="cam-tile">
          {cam}
        </div>
      ))}
    </div>
  )
}

export function AppsModule({ layout }: { layout: ResolvedLayout }) {
  const apps = ['Maps', 'Fuel', 'Trail', 'Weather', 'Garage', 'Phone']
  return (
    <div className={`mod apps-grid cols-${layout.includes('portrait') ? '2' : '3'}`}>
      {apps.map((app) => (
        <button key={app} type="button">
          {app}
        </button>
      ))}
    </div>
  )
}
