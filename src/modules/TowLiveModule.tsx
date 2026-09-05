import { VEHICLE_STATE } from '../os/catalog'
import type { ResolvedLayout } from '../display/applyProfile'

export function TowLiveModule({ layout }: { layout: ResolvedLayout }) {
  const tow = VEHICLE_STATE.tow

  const metrics = (
    <dl className="tow-metrics">
      <div>
        <dt>Brake gain</dt>
        <dd>{tow.brakeGain}</dd>
      </div>
      <div>
        <dt>Tongue</dt>
        <dd>{tow.tonguePct}%</dd>
      </div>
      <div>
        <dt>Sway</dt>
        <dd>{tow.sway}</dd>
      </div>
      <div>
        <dt>Lights</dt>
        <dd>{tow.lights}</dd>
      </div>
    </dl>
  )

  if (layout === 'ram-portrait') {
    return (
      <div className="mod tow-portrait">
        <div className="trailer-diagram is-vertical">
          <b className="truck" />
          <b className="hitch" />
          <b className="trailer" />
        </div>
        <h1>{tow.name}</h1>
        {metrics}
      </div>
    )
  }

  if (layout === 'ram-hdmi-bridge') {
    return (
      <div className="mod tow-hdmi">
        <div className="bridge-stage">
          <div className="trailer-diagram is-horizontal bridge-safe">
            <b className="truck" />
            <b className="hitch" />
            <b className="trailer" />
          </div>
        </div>
        <aside>
          <h1>Tow Live</h1>
          <p>HDMI composition keeps the trailer diagram in the 12.4 mapping band.</p>
          {metrics}
        </aside>
      </div>
    )
  }

  if (layout === 'ford-landscape') {
    return (
      <div className="mod tow-ford">
        <h1>Pro Trailer</h1>
        {metrics}
        <div className="ford-source-strip">
          <span className="is-on">Brake</span>
          <span>Lights</span>
          <span>Sway</span>
          <span>Camera</span>
        </div>
      </div>
    )
  }

  if (layout === 'tesla-landscape') {
    return (
      <div className="mod tow-tesla">
        <section className="tesla-viz">
          <div className="viz-truck" />
          <div className="viz-trailer" />
          <span className="viz-label">{tow.name}</span>
        </section>
        <aside>{metrics}</aside>
      </div>
    )
  }

  return (
    <div className="mod">
      <h1>Tow Live</h1>
      {metrics}
    </div>
  )
}
