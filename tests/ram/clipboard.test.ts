// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { writeClipboard } from '../../src/os/clipboard'
const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
const exec = Object.getOwnPropertyDescriptor(document, 'execCommand')
function restore(object: object, key: string, original: PropertyDescriptor | undefined) {
  if (original) Object.defineProperty(object, key, original)
  else Reflect.deleteProperty(object, key)
}
afterEach(() => { restore(navigator, 'clipboard', clipboard); restore(document, 'execCommand', exec); document.body.innerHTML = ''; vi.useRealTimers() })
function configure(writeText: ((text: string) => Promise<void>) | undefined, fallback: () => boolean) {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: writeText ? { writeText } : undefined })
  Object.defineProperty(document, 'execCommand', { configurable: true, value: fallback })
}
describe('truthful report copying', () => {
  it('waits for the clipboard result before claiming success', async () => {
    let finish!: () => void
    configure(() => new Promise<void>(resolve => { finish = resolve }), () => false)
    let done = false
    const pending = writeClipboard('report').then(result => { done = true; return result })
    await Promise.resolve()
    expect(done).toBe(false)
    finish()
    expect(await pending).toBe(true)
  })
  it('returns false when permission and the fallback both fail', async () => {
    configure(async () => { throw new Error('denied') }, () => false)
    expect(await writeClipboard('report')).toBe(false)
    expect(document.querySelector('textarea')).toBeNull()
  })
  it('uses a successful fallback and restores focus without leaving a textarea', async () => {
    const button = document.createElement('button'); document.body.appendChild(button); button.focus()
    configure(undefined, () => true)
    expect(await writeClipboard('report')).toBe(true)
    expect(document.activeElement).toBe(button)
    expect(document.querySelector('textarea')).toBeNull()
  })
  it('cleans up after a fallback exception', async () => {
    configure(undefined, () => { throw new Error('unsupported') })
    expect(await writeClipboard('report')).toBe(false)
    expect(document.querySelector('textarea')).toBeNull()
  })
  it('times out a pending API call without reporting false success', async () => {
    vi.useFakeTimers()
    configure(() => new Promise<void>(() => {}), () => false)
    const pending = writeClipboard('report')
    await vi.advanceTimersByTimeAsync(1501)
    expect(await pending).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })
})
