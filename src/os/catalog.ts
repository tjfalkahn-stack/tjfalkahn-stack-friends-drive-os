export type ModuleId =
  | 'home'
  | 'media'
  | 'web'
  | 'dotty'
  | 'towlive'
  | 'vehicle'
  | 'cameras'
  | 'apps'
  | 'settings'

export const MODULES: Array<{ id: ModuleId; label: string; hint: string }> = [
  { id: 'home', label: 'Home', hint: 'Cockpit' },
  { id: 'media', label: 'Media', hint: 'Cabin audio' },
  { id: 'web', label: 'Web', hint: 'Browser' },
  { id: 'dotty', label: 'Dotty', hint: 'Copilot' },
  { id: 'towlive', label: 'Tow Live', hint: 'Trailer' },
  { id: 'vehicle', label: 'Vehicle', hint: 'Truck' },
  { id: 'cameras', label: 'Cameras', hint: 'Sight' },
  { id: 'apps', label: 'Apps', hint: 'Grid' },
  { id: 'settings', label: 'Settings', hint: 'System' },
]

export const VEHICLE_STATE = {
  name: 'Friends Drive',
  gear: 'D',
  speed: 42,
  outdoorF: 67,
  rangeMi: 214,
  fuelPct: 0.62,
  tow: {
    connected: true,
    name: 'Frontier 20',
    brakeGain: 5.5,
    tonguePct: 12,
    sway: 'calm',
    lights: 'ok',
  },
  nowPlaying: {
    title: 'Night Moves',
    artist: 'Bob Seger',
    source: 'Cabin Mix',
    progress: 0.42,
  },
}
