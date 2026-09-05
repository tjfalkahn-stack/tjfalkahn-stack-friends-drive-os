/** Truthful result, with a cleanup-safe legacy fallback for restricted webviews. */
export async function writeClipboard(text: string): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await Promise.race([
        navigator.clipboard.writeText(text),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Clipboard timed out')), 1500) }),
      ])
      return true
    }
  } catch {
    // Continue to the legacy fallback. Never treat permission denial as success.
  } finally { if (timer !== undefined) clearTimeout(timer) }

  if (typeof document === 'undefined') return false
  const area = document.createElement('textarea')
  const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const selection = document.getSelection()
  const ranges: Range[] = []
  if (selection) for (let i = 0; i < selection.rangeCount; i++) ranges.push(selection.getRangeAt(i).cloneRange())
  try {
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.left = '-9999px'
    document.body.appendChild(area)
    area.select()
    return document.execCommand('copy') === true
  } catch {
    return false
  } finally {
    area.remove()
    focused?.focus({ preventScroll: true })
    if (selection) {
      selection.removeAllRanges()
      for (const range of ranges) selection.addRange(range)
    }
  }
}
