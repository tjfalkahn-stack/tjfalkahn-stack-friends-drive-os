/** Accept ordinary web addresses, never executable, local-file, or credential URLs. */
export function normalizeWebAddress(input: string): string | null {
  const value = input.trim()
  if (!value || /[\s\\]/.test(value)) return null
  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(value)
  try {
    const url = new URL(hasScheme ? value : `https://${value}`)
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return null
    return url.href
  } catch {
    return null
  }
}
