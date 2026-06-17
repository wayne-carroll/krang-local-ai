// Saving AI output to disk. Two levels, transparently:
//   1. Download — a normal browser download. Works everywhere, no permissions.
//   2. Working folder — if the user has granted a directory via the File System
//      Access API, writes land straight in that folder with no save dialog.
//
// The chosen directory handle is kept here as a module-level singleton (not
// React state) so deeply-nested components like CodeBlock can call saveText()
// without prop-drilling. It is session-only — re-granted after a reload, since
// persisting handles would require IndexedDB.

let dirHandle = null

/** Whether this browser supports picking a working folder (Chromium-based). */
export function supportsWorkingFolder() {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

/** The connected working folder's name, or null if none. */
export function getWorkingFolderName() {
  return dirHandle ? dirHandle.name : null
}

/** Prompt the user to grant a read/write working folder. Returns its name. */
export async function pickWorkingFolder() {
  // eslint-disable-next-line no-undef
  const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
  dirHandle = handle
  return handle.name
}

/** Forget the working folder (subsequent saves fall back to downloads). */
export function clearWorkingFolder() {
  dirHandle = null
}

// Ensure we still hold readwrite permission on the folder (it can lapse).
async function ensurePermission(handle) {
  const opts = { mode: 'readwrite' }
  if ((await handle.queryPermission(opts)) === 'granted') return true
  return (await handle.requestPermission(opts)) === 'granted'
}

/** Trigger a plain browser download of `text` as `filename`. */
export function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Save text as `filename`. Writes into the working folder if one is connected
 * (and permission holds); otherwise falls back to a download.
 *
 * @returns {Promise<'folder'|'download'>} where the file ended up.
 */
export async function saveText(filename, text, mime = 'text/plain') {
  if (dirHandle && (await ensurePermission(dirHandle).catch(() => false))) {
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(text)
    await writable.close()
    return 'folder'
  }
  downloadText(filename, text, mime)
  return 'download'
}
