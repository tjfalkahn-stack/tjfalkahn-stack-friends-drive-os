import type { ResolvedLayout } from '../display/applyProfile'

export function DottyModule({ layout }: { layout: ResolvedLayout }) {
  if (layout === 'ram-portrait') {
    return (
      <div className="mod dotty-stack">
        <header>
          <h1>Dotty</h1>
          <p>Riding shotgun</p>
        </header>
        <div className="chat">
          <p className="them">Trailer lights look clean. Want a weigh-station reminder in 18 miles?</p>
          <p className="me">Yes. And keep the cabin mix low while we hitch-check.</p>
        </div>
        <form className="chat-input" onSubmit={(event) => event.preventDefault()}>
          <input defaultValue="Ask Dotty" aria-label="Ask Dotty" />
          <button type="submit" className="primary">
            Send
          </button>
        </form>
      </div>
    )
  }

  if (layout === 'tesla-landscape') {
    return (
      <div className="mod dotty-tesla">
        <section className="tesla-viz">
          <p className="viz-label">Dotty is watching the lane and the hitch.</p>
        </section>
        <aside className="chat">
          <p className="them">Sway is calm. I can dim the cabin and keep maps on the left.</p>
          <form className="chat-input" onSubmit={(event) => event.preventDefault()}>
            <input defaultValue="Keep maps left" aria-label="Ask Dotty" />
            <button type="submit" className="primary">
              Send
            </button>
          </form>
        </aside>
      </div>
    )
  }

  return (
    <div className={`mod dotty-wide ${layout}`}>
      <div className="chat">
        <p className="them">I can switch shells when another screen is connected. No reinstall.</p>
        <p className="me">Stay on Auto unless I force a layout in Settings.</p>
      </div>
      <form className="chat-input" onSubmit={(event) => event.preventDefault()}>
        <input defaultValue="Ask Dotty" aria-label="Ask Dotty" />
        <button type="submit" className="primary">
          Send
        </button>
      </form>
    </div>
  )
}
