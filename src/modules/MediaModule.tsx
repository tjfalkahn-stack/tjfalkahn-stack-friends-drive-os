import { VEHICLE_STATE } from '../os/catalog'
import type { ResolvedLayout } from '../display/applyProfile'

export function MediaModule({ layout }: { layout: ResolvedLayout }) {
  const track = VEHICLE_STATE.nowPlaying

  if (layout === 'ram-portrait') {
    return (
      <div className="mod media-stack">
        <div className="album-block" />
        <h1>{track.title}</h1>
        <p>{track.artist}</p>
        <div className="meter">
          <b style={{ width: `${track.progress * 100}%` }} />
        </div>
        <div className="transport">
          <button type="button">Prev</button>
          <button type="button" className="primary">
            Pause
          </button>
          <button type="button">Next</button>
        </div>
        <ul className="queue">
          <li>Against the Wind</li>
          <li>Mainstreet</li>
          <li>Hollywood Nights</li>
        </ul>
      </div>
    )
  }

  if (layout === 'ram-hdmi-bridge') {
    return (
      <div className="mod media-hdmi">
        <section className="bridge-stage">
          <div className="bridge-safe album-wide" />
          <div>
            <span className="kicker">{track.source}</span>
            <h1>{track.title}</h1>
            <p>{track.artist}</p>
            <div className="transport">
              <button type="button">Prev</button>
              <button type="button" className="primary">
                Pause
              </button>
              <button type="button">Next</button>
            </div>
          </div>
        </section>
        <aside className="queue-side">
          <h2>Up next</h2>
          <ul className="queue">
            <li>Against the Wind</li>
            <li>Mainstreet</li>
            <li>Still the Same</li>
          </ul>
        </aside>
      </div>
    )
  }

  if (layout === 'ford-landscape') {
    return (
      <div className="mod media-ford">
        <div className="ford-media-row">
          <div className="album-block" />
          <div>
            <h1>{track.title}</h1>
            <p>{track.artist}</p>
            <div className="transport">
              <button type="button">Prev</button>
              <button type="button" className="primary">
                Pause
              </button>
              <button type="button">Next</button>
            </div>
          </div>
        </div>
        <div className="ford-source-strip">
          <span className="is-on">Cabin Mix</span>
          <span>USB</span>
          <span>Bluetooth</span>
          <span>Radio</span>
        </div>
      </div>
    )
  }

  if (layout === 'tesla-landscape') {
    return (
      <div className="mod media-tesla">
        <section className="tesla-viz media-viz">
          <div className="album-wide" />
        </section>
        <aside>
          <h1>{track.title}</h1>
          <p>{track.artist}</p>
          <div className="meter">
            <b style={{ width: `${track.progress * 100}%` }} />
          </div>
          <div className="transport">
            <button type="button">Prev</button>
            <button type="button" className="primary">
              Pause
            </button>
            <button type="button">Next</button>
          </div>
        </aside>
      </div>
    )
  }

  return (
    <div className="mod">
      <h1>{track.title}</h1>
      <p>{track.artist}</p>
      <div className="transport">
        <button type="button">Prev</button>
        <button type="button" className="primary">
          Pause
        </button>
        <button type="button">Next</button>
      </div>
    </div>
  )
}
