import { VEHICLE_STATE } from '../os/catalog'
import { useOs } from '../os/OsContext'
import type { ResolvedLayout } from '../display/applyProfile'

export function HomeModule({ layout }: { layout: ResolvedLayout }) {
  const { setModule } = useOs()
  const { nowPlaying, tow, speed, gear } = VEHICLE_STATE

  if (layout === 'ram-portrait') {
    return (
      <div className="mod ram-portrait-home">
        <section className="hero-card">
          <span className="kicker">Now</span>
          <h1>
            {speed} <small>mph</small>
          </h1>
          <p>
            Gear {gear} · {tow.name} in tow
          </p>
        </section>
        <section className="stack-card">
          <span className="kicker">Playing</span>
          <strong>{nowPlaying.title}</strong>
          <em>{nowPlaying.artist}</em>
          <div className="meter">
            <b style={{ width: `${nowPlaying.progress * 100}%` }} />
          </div>
        </section>
        <div className="quick-grid">
          <button type="button" onClick={() => setModule('towlive')}>
            Tow Live
          </button>
          <button type="button" onClick={() => setModule('cameras')}>
            Trailer cam
          </button>
          <button type="button" onClick={() => setModule('media')}>
            Cabin mix
          </button>
          <button type="button" onClick={() => setModule('dotty')}>
            Ask Dotty
          </button>
        </div>
      </div>
    )
  }

  if (layout === 'ram-hdmi-bridge') {
    return (
      <div className="mod ram-hdmi-home">
        <section className="bridge-stage">
          <div className="bridge-safe">
            <span className="kicker">Physical 12.4 map</span>
            <h1>Highway 16 North</h1>
            <p>Keep the driving picture in the center column. Side rails stay secondary after the HDMI bridge.</p>
            <div className="bridge-metrics">
              <span>{speed} mph</span>
              <span>Gain {tow.brakeGain}</span>
              <span>{tow.sway}</span>
            </div>
          </div>
        </section>
        <aside className="bridge-side">
          <article>
            <span className="kicker">Cabin</span>
            <strong>{nowPlaying.title}</strong>
            <em>{nowPlaying.artist}</em>
          </article>
          <article>
            <span className="kicker">Trailer</span>
            <strong>{tow.name}</strong>
            <em>Lights {tow.lights}</em>
          </article>
        </aside>
      </div>
    )
  }

  if (layout === 'ford-landscape') {
    return (
      <div className="mod ford-home">
        <article className="ford-hero">
          <span className="kicker">F-Series shell</span>
          <h1>Ready to tow</h1>
          <p>
            {speed} mph · {tow.name} · brake gain {tow.brakeGain}
          </p>
        </article>
        <div className="ford-cards">
          <button type="button" onClick={() => setModule('towlive')}>
            Trailer
          </button>
          <button type="button" onClick={() => setModule('media')}>
            Audio
          </button>
          <button type="button" onClick={() => setModule('vehicle')}>
            Truck
          </button>
          <button type="button" onClick={() => setModule('cameras')}>
            Cameras
          </button>
        </div>
      </div>
    )
  }

  if (layout === 'tesla-landscape') {
    return (
      <div className="mod tesla-home">
        <section className="tesla-viz">
          <div className="viz-road" />
          <div className="viz-truck" />
          <div className="viz-trailer" />
          <span className="viz-label">Cabin visualization</span>
        </section>
        <aside className="tesla-cards">
          <article>
            <span className="kicker">Speed</span>
            <strong>{speed}</strong>
          </article>
          <article>
            <span className="kicker">Now</span>
            <strong>{nowPlaying.title}</strong>
            <em>{nowPlaying.artist}</em>
          </article>
          <article>
            <span className="kicker">Tow</span>
            <strong>{tow.connected ? 'Linked' : 'Open'}</strong>
            <em>{tow.name}</em>
          </article>
        </aside>
      </div>
    )
  }

  return (
    <div className={`mod generic-home ${layout}`}>
      <section className="hero-card">
        <span className="kicker">Friends Drive</span>
        <h1>Cockpit</h1>
        <p>Display profile is generic until the screen is recognized.</p>
      </section>
      <div className="quick-grid">
        <button type="button" onClick={() => setModule('media')}>
          Media
        </button>
        <button type="button" onClick={() => setModule('web')}>
          Web
        </button>
        <button type="button" onClick={() => setModule('dotty')}>
          Dotty
        </button>
        <button type="button" onClick={() => setModule('towlive')}>
          Tow Live
        </button>
      </div>
    </div>
  )
}
