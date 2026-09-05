import { describe, expect, it } from 'vitest'
import { normalizeWebAddress } from '../../src/ram/webAddress'

describe('external browser addresses', () => {
  it.each([
    ['example.com', 'https://example.com/'],
    ['  https://example.com/path?q=test  ', 'https://example.com/path?q=test'],
    ['http://localhost:8080/', 'http://localhost:8080/'],
  ])('normalizes %s', (input, expected) => { expect(normalizeWebAddress(input)).toBe(expected) })
  it.each(['', ' ', 'not a URL', 'javascript:alert(1)', 'data:text/html,test', 'file:///etc/passwd', 'https://user:pass@example.com', 'https://', 'https:\\example.com', 'blob:https://example.com/id'])('rejects %s', input => {
    expect(normalizeWebAddress(input)).toBeNull()
  })
})
