export function Icon({ name }: { name: string }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M7 10.5V20h10v-9.5" />
        </svg>
      )
    case 'media':
      return (
        <svg {...common}>
          <circle cx="8" cy="16" r="2.4" />
          <circle cx="17" cy="14" r="2.4" />
          <path d="M10.4 16V8l8.6-2v8" />
        </svg>
      )
    case 'web':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M4 12h16M12 4c2.4 2.6 3.6 5.4 3.6 8s-1.2 5.4-3.6 8c-2.4-2.6-3.6-5.4-3.6-8s1.2-5.4 3.6-8Z" />
        </svg>
      )
    case 'dotty':
      return (
        <svg {...common}>
          <circle cx="8" cy="12" r="2.2" />
          <circle cx="16" cy="12" r="2.2" />
          <path d="M4 17c1.4-2 3.5-3 8-3s6.6 1 8 3" />
        </svg>
      )
    case 'towlive':
      return (
        <svg {...common}>
          <rect x="3" y="8" width="9" height="7" rx="1.2" />
          <path d="M12 11h4l3 3v1H12" />
          <circle cx="7" cy="16.5" r="1.3" />
          <circle cx="16.5" cy="16.5" r="1.3" />
        </svg>
      )
    case 'vehicle':
      return (
        <svg {...common}>
          <path d="M4 15h16v2.5H4z" />
          <path d="M5 15 7 9h10l2 6" />
          <circle cx="8" cy="17.5" r="1.4" />
          <circle cx="16" cy="17.5" r="1.4" />
        </svg>
      )
    case 'cameras':
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="12" rx="2" />
          <circle cx="12" cy="13" r="3.2" />
          <path d="M8 7 9.5 4.8h5L16 7" />
        </svg>
      )
    case 'apps':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="6" height="6" rx="1.2" />
          <rect x="14" y="4" width="6" height="6" rx="1.2" />
          <rect x="4" y="14" width="6" height="6" rx="1.2" />
          <rect x="14" y="14" width="6" height="6" rx="1.2" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 4v2.2M12 17.8V20M4 12h2.2M17.8 12H20M6.4 6.4l1.6 1.6M16 16l1.6 1.6M17.6 6.4 16 8M8 16l-1.6 1.6" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" />
        </svg>
      )
  }
}
