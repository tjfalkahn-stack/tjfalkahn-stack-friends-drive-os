import { Icon } from './Icon'
import { useOs } from './OsContext'
import type { ModuleId } from './catalog'

export function NavButton({ id, compact = false }: { id: ModuleId; compact?: boolean }) {
  const { module, setModule, modules } = useOs()
  const item = modules.find((entry) => entry.id === id)
  if (!item) return null
  return (
    <button
      type="button"
      className={`nav-btn ${module === id ? 'is-active' : ''} ${compact ? 'is-compact' : ''}`}
      onClick={() => setModule(id)}
      aria-current={module === id}
    >
      <Icon name={id} />
      <span>{item.label}</span>
    </button>
  )
}

export function Wordmark({ kicker }: { kicker?: string }) {
  return (
    <div className="wordmark">
      <span className="wordmark-mark" aria-hidden>
        FD
      </span>
      <div>
        <strong>Friends Drive OS</strong>
        {kicker ? <em>{kicker}</em> : null}
      </div>
    </div>
  )
}

export function Clock() {
  const now = new Date()
  const hh = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return <span className="clock">{hh}</span>
}
