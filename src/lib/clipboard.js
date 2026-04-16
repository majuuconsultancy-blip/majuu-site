export async function copyTextToClipboard(value) {
  const text = String(value ?? '')

  if (!text) {
    return false
  }

  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall back to legacy copy path below.
    }
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    textarea.style.pointerEvents = 'none'
    document.body.appendChild(textarea)
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)
    const didCopy = document.execCommand('copy')
    document.body.removeChild(textarea)
    return didCopy
  } catch {
    return false
  }
}
