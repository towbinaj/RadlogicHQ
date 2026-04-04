/**
 * Copy text to clipboard with fallback for older browsers.
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} true if successful
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback: textarea selection
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    // ignore
  }
  document.body.removeChild(textarea);
  return success;
}
