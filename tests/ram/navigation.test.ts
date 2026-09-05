import { describe, expect, it } from 'vitest'
import { INITIAL_NAVIGATION, navigationReducer } from '../../src/os/navigation'

describe('RAM in-app navigation', () => {
  it('keeps Back inert at Home', () => {
    expect(navigationReducer(INITIAL_NAVIGATION, { type: 'back' })).toBe(INITIAL_NAVIGATION)
  })
  it('opens modules and returns through the actual history', () => {
    const media = navigationReducer(INITIAL_NAVIGATION, { type: 'open', id: 'media' })
    const settings = navigationReducer(media, { type: 'open', id: 'settings' })
    expect(navigationReducer(settings, { type: 'back' })).toEqual(media)
    expect(navigationReducer(media, { type: 'back' })).toEqual(INITIAL_NAVIGATION)
  })
  it('does not duplicate a selected module and Home resets the history', () => {
    const media = navigationReducer(INITIAL_NAVIGATION, { type: 'open', id: 'media' })
    expect(navigationReducer(media, { type: 'open', id: 'media' })).toBe(media)
    expect(navigationReducer(media, { type: 'open', id: 'home' })).toBe(INITIAL_NAVIGATION)
  })
  it('bounds the history without losing the immediately previous view', () => {
    let state = INITIAL_NAVIGATION
    for (let i = 0; i < 100; i++) state = navigationReducer(state, { type: 'open', id: i % 2 ? 'web' : 'media' })
    expect(state.backStack).toHaveLength(20)
    expect(navigationReducer(state, { type: 'back' }).current).toBe('media')
  })
})
