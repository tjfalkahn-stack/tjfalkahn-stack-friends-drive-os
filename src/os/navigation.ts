import type { ModuleId } from './catalog'

export type NavigationState = { current: ModuleId; backStack: ModuleId[] }
export type NavigationAction = { type: 'open'; id: ModuleId } | { type: 'back' }
export const INITIAL_NAVIGATION: NavigationState = { current: 'home', backStack: [] }

/** In-app history only. Home is a predictable exit, not an external browser back. */
export function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  if (action.type === 'back') {
    const previous = state.backStack[state.backStack.length - 1]
    return previous ? { current: previous, backStack: state.backStack.slice(0, -1) } : state
  }
  if (action.id === state.current) return state
  if (action.id === 'home') return INITIAL_NAVIGATION
  return { current: action.id, backStack: [...state.backStack.slice(-19), state.current] }
}
