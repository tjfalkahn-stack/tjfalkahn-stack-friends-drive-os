import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useOs } from '../os/OsContext'
import { Icon } from '../os/Icon'
import { MODULES, type ModuleId } from '../os/catalog'
import { normalizeWebAddress } from './webAddress'
import './ram.css'

const SECONDARY: ModuleId[] = ['media', 'web', 'apps']
const DEMO_MODULES: ModuleId[] = ['dotty', 'towlive', 'cameras', 'vehicle']
const EXTERNAL_SERVICES = [
  { label: 'YouTube', href: 'https://www.youtube.com/' },
  { label: 'Netflix', href: 'https://www.netflix.com/' },
  { label: 'Hulu', href: 'https://www.hulu.com/' },
]

export function RamBack() {
  const { goBack, canGoBack } = useOs()
  return <button type="button" className="ram-back" onClick={goBack} disabled={!canGoBack}>
    <span aria-hidden="true">←</span><span>Back</span>
  </button>
}

function RamNavButton({ id }: { id: ModuleId }) {
  const { module, setModule } = useOs()
  const active = module === id || (id === 'apps' && DEMO_MODULES.includes(module))
  const label = id === 'web' ? 'Web' : id === 'apps' ? 'All apps' : MODULES.find(item => item.id === id)?.label
  return <button type="button" className={`ram-nav-button ${active ? 'is-active' : ''}`}
    data-nav-id={id} aria-current={active ? 'page' : undefined} onClick={() => setModule(id)}>
    <span aria-hidden="true"><Icon name={id} /></span><span>{label}</span>
  </button>
}

export function RamNavigation({ portrait = false }: { portrait?: boolean }) {
  return <nav className={`ram-nav ${portrait ? 'ram-nav-bottom' : 'ram-nav-side'}`} aria-label="RAM main navigation">
    <RamNavButton id="home" />
    <div className="ram-nav-secondary">{SECONDARY.map(id => <RamNavButton key={id} id={id} />)}</div>
    <RamNavButton id="settings" />
  </nav>
}

export function RamHeader({ portrait = false }: { portrait?: boolean }) {
  const [now, setNow] = useState(() => new Date())
  const [fullscreen, setFullscreen] = useState(() => Boolean(document.fullscreenElement))
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => { window.clearInterval(timer); document.removeEventListener('fullscreenchange', onFullscreen) }
  }, [])
  async function toggleFullscreen() {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen()
      else setMessage('Fullscreen is unavailable here. Use your browser’s fullscreen command.')
    } catch {
      setMessage('Fullscreen was not allowed. Use your browser’s fullscreen command.')
    } finally { setBusy(false) }
  }
  return <header className="ram-header">
    {portrait ? <RamBack /> : null}
    <div className="ram-edition"><span className="ram-eyebrow">Friends Drive OS</span><strong>RAM <span>1500 · LARAMIE</span></strong></div>
    <div className="ram-header-tools">
      <time className="ram-time" dateTime={now.toISOString()}>{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>
      <button type="button" className="ram-fullscreen" onClick={() => void toggleFullscreen()} disabled={busy}
        aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} aria-pressed={fullscreen}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /></svg><span>{fullscreen ? 'Exit full' : 'Full screen'}</span>
      </button>
    </div>
    {message ? <p className="ram-status" role="status">{message}</p> : null}
  </header>
}

function Shortcut({ id, title, detail }: { id: ModuleId; title: string; detail: string }) {
  const { setModule } = useOs()
  return <button type="button" className="ram-shortcut" onClick={() => setModule(id)}>
    <span className="ram-shortcut-icon" aria-hidden="true"><Icon name={id} /></span>
    <span className="ram-shortcut-copy"><strong>{title}</strong><span>{detail}</span></span>
    <span className="ram-arrow" aria-hidden="true">↗</span>
  </button>
}

export function RamHome() {
  const { setModule } = useOs()
  return <div className="ram-home">
    <section className="ram-hero">
      <div className="ram-hero-top"><span className="ram-eyebrow">The Laramie cockpit</span><span className="ram-series">01 / RAM</span></div>
      <div className="ram-hero-copy"><p className="ram-overline">Welcome aboard.</p><h1>Your truck.<br /><span>Your space.</span></h1>
        <p>Media, the web, and your essentials.<br />Right where they belong.</p>
        <button type="button" className="ram-primary" onClick={() => setModule('media')}><Icon name="media" /><span>Open media</span><span aria-hidden="true">↗</span></button>
      </div>
      <div className="ram-hero-bottom"><span>FRIENDS DRIVE</span><span>PERSONAL COCKPIT</span></div>
    </section>
    <section className="ram-home-shortcuts" aria-label="Cockpit shortcuts">
      <div className="ram-section-label"><span className="ram-eyebrow">Make it yours</span><span>Quick access</span></div>
      <Shortcut id="web" title="Open the web" detail="Your sites. Your browser." />
      <Shortcut id="settings" title="Dial in your display" detail="Screen fit and larger controls." />
      <Shortcut id="apps" title="All your essentials" detail="Every module, in one place." />
      <div className="ram-home-note"><span className="ram-note-rule" aria-hidden="true" /><p>Built around your RAM.<br /><span>OEM controls stay with Uconnect.</span></p></div>
    </section>
  </div>
}

export function RamApps() {
  return <div className="ram-view"><div className="ram-page-heading"><span className="ram-eyebrow">Your cockpit</span><h1>All apps</h1><p>Launch a module. Preview-only integrations are labeled below.</p></div>
    <div className="ram-app-list">{MODULES.filter(item => !['home', 'apps'].includes(item.id)).map(item =>
      <Shortcut key={item.id} id={item.id} title={item.label} detail={DEMO_MODULES.includes(item.id) ? 'Demo only · integration not connected' : item.id === 'media' ? 'Local playback and external streaming links' : item.id === 'web' ? 'Open websites in an external browser tab' : 'Display, calibration and diagnostics'} />
    )}</div>
  </div>
}

export function RamDemo({ children }: { children: ReactNode }) {
  return <div className="ram-demo-view"><div className="ram-demo-notice" role="note"><strong>DEMO ONLY · Not connected</strong><span>Sample content, not live vehicle data. Camera feeds, OEM controls, and assistant actions are unavailable.</span></div>
    <fieldset className="ram-demo-content" disabled><legend>Existing module preview</legend>{children}</fieldset>
  </div>
}

export function RamMedia() {
  const inputRef = useRef<HTMLInputElement>(null)
  const playerRef = useRef<HTMLVideoElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [src, setSrc] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    if (!file) { setSrc(''); return }
    const objectUrl = URL.createObjectURL(file)
    setSrc(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])
  return <div className="ram-view">
    <div className="ram-page-heading"><span className="ram-eyebrow">Cabin entertainment</span><h1>Set the mood.</h1><p>Your media. No pretend connections.</p></div>
    <div className="ram-media-layout"><section className="ram-surface ram-local-media">
      <div className="ram-section-label"><h2>On this device</h2><span className="ram-badge">In-app playback</span></div>
      {src ? <video key={src} ref={playerRef} className="ram-player" src={src} controls playsInline preload="metadata" aria-label={file?.name ?? 'Local media player'}
        onError={() => setError('This file could not play. Try another file or a format supported by this browser.')} />
        : <div className="ram-media-empty"><span className="ram-media-symbol" aria-hidden="true"><Icon name="media" /></span><h2>Bring your own soundtrack.</h2><p>Choose an audio or video file from your Mac.</p></div>}
      <input ref={inputRef} className="ram-file-input" type="file" accept="audio/*,video/*" aria-label="Choose local media file"
        onChange={event => { const selected = event.target.files?.[0]; if (selected) { playerRef.current?.pause(); setError(''); setFile(selected) } event.target.value = '' }} />
      <div className="ram-media-actions"><button type="button" className="ram-primary" onClick={() => inputRef.current?.click()}>{file ? 'Choose another file' : 'Choose a file'}</button>
        {file ? <button type="button" onClick={() => { playerRef.current?.pause(); setFile(null); setError('') }}>Clear file</button> : null}</div>
      {file ? <p className="ram-file-name">{file.name}</p> : null}
      {error ? <p className="ram-error" role="alert">{error}</p> : null}
      <p className="ram-fine">Files stay on this device. Playback stops when you leave this view. Video use and hardware testing are for parked use.</p>
    </section><aside className="ram-surface ram-services"><span className="ram-eyebrow">Streaming services</span><h2>Open your favorites.</h2><p>These links open an external browser tab, not an embedded player.</p>
      {EXTERNAL_SERVICES.map(service => <a className="ram-service-link" key={service.label} href={service.href} target="_blank" rel="noopener noreferrer"><strong>{service.label}</strong><span>External tab ↗</span></a>)}
      <p className="ram-fine">Sign-in, subscriptions, DRM and playback support depend on the service and browser. No universal streaming compatibility is claimed.</p>
    </aside></div>
  </div>
}

export function RamWeb() {
  const [address, setAddress] = useState('')
  const [requested, setRequested] = useState<string | null>(null)
  const [error, setError] = useState('')
  const bookmarks = [{ label: 'Google Maps', href: 'https://maps.google.com/' }, { label: 'Weather', href: 'https://www.weather.gov/' }, { label: 'YouTube', href: 'https://www.youtube.com/' }]
  return <div className="ram-view">
    <div className="ram-page-heading"><span className="ram-eyebrow">The web, within reach</span><h1>Where to?</h1><p>Open websites in your host browser. Your cockpit stays here.</p></div>
    <section className="ram-surface ram-web-launcher"><div className="ram-section-label"><h2>Website address</h2><span className="ram-badge">External browser</span></div>
      <form className="ram-address-bar" onSubmit={event => {
        event.preventDefault()
        const href = normalizeWebAddress(address)
        if (!href) { setError('Enter a valid http or https website address, without spaces or sign-in credentials.'); setRequested(null); return }
        setError(''); setRequested(href)
        // Do not interpret a null WindowProxy as failure: noopener can cause that result.
        try { window.open(href, '_blank', 'noopener,noreferrer') } catch { /* direct link below remains usable */ }
      }}>
        <label htmlFor="ram-web-address">Enter a website</label><div><input id="ram-web-address" value={address} onChange={event => setAddress(event.target.value)}
          placeholder="example.com" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-describedby="ram-web-help" />
          <button type="submit" className="ram-primary">Open site <span aria-hidden="true">↗</span></button></div>
      </form>
      <p id="ram-web-help" className="ram-fine">Opens outside this application. No site protections are bypassed.</p>
      {error ? <p className="ram-error" role="alert">{error}</p> : null}
      {requested ? <p className="ram-status" role="status">Requested in an external tab. No tab appeared? <a href={requested} target="_blank" rel="noopener noreferrer">Open this site directly ↗</a></p> : null}
    </section>
    <section className="ram-bookmarks" aria-label="Web shortcuts">{bookmarks.map(item => <a className="ram-service-link" href={item.href} key={item.label} target="_blank" rel="noopener noreferrer"><strong>{item.label}</strong><span>External tab ↗</span></a>)}</section>
    <div className="ram-web-note"><Icon name="web" /><p><strong>A launcher, not a full embedded browser.</strong><span>Some sites prohibit embedding. This view makes no claim to display every website or protected stream inside the cockpit.</span></p></div>
  </div>
}
