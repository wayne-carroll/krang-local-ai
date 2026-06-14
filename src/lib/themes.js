// Theme registry for the settings appearance picker. The actual color values
// live as CSS variables in index.css (keyed by data-theme). Here we keep just
// the metadata + preview swatches shown in the picker.

export const DEFAULT_THEME = 'krang'
export const THEME_KEY = 'krang:theme'

export const THEMES = [
  {
    id: 'krang',
    name: 'Krang',
    type: 'Dark',
    blurb: 'Pure black & industrial red. The default.',
    swatch: { bg: '#131313', surface: '#1b1b1b', accent: '#E30613', fg: '#ffffff' },
  },
  {
    id: 'carbon',
    name: 'Carbon',
    type: 'Dark',
    blurb: 'Cool slate with electric blue.',
    swatch: { bg: '#0d1117', surface: '#161b22', accent: '#1f6feb', fg: '#f6f8fa' },
  },
  {
    id: 'paper',
    name: 'Paper',
    type: 'Light',
    blurb: 'Warm light with the brand red.',
    swatch: { bg: '#f7f6f3', surface: '#ffffff', accent: '#D10510', fg: '#171717' },
  },
  {
    id: 'arctic',
    name: 'Arctic',
    type: 'Light',
    blurb: 'Crisp cool light with blue.',
    swatch: { bg: '#eff2f6', surface: '#ffffff', accent: '#2563eb', fg: '#0f172a' },
  },
]

/** Apply a theme id to <html> and persist it. */
export function applyTheme(id) {
  document.documentElement.setAttribute('data-theme', id)
  try {
    localStorage.setItem(THEME_KEY, id)
  } catch {
    // ignore storage failures
  }
}

/** Read the saved theme id (or the default). */
export function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}
