// Theme registry for the settings appearance picker. The actual color values
// live as CSS variables in index.css (keyed by data-theme). Here we keep just
// the metadata + preview swatches shown in the picker.

export const DEFAULT_THEME = 'mono-dark'
export const THEME_KEY = 'krang:theme'

export const THEMES = [
  {
    id: 'mono-dark',
    name: 'Mono Dark',
    type: 'Dark',
    blurb: 'Black background, white text. The default.',
    swatch: { bg: '#000000', surface: '#121212', accent: '#ffffff', fg: '#ffffff' },
  },
  {
    id: 'mono-light',
    name: 'Mono Light',
    type: 'Light',
    blurb: 'White background, black text.',
    swatch: { bg: '#ffffff', surface: '#f5f5f5', accent: '#000000', fg: '#000000' },
  },
  {
    id: 'krang',
    name: 'Krang',
    type: 'Dark',
    blurb: 'Pure black and industrial red.',
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
