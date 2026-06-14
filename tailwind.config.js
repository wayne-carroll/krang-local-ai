/** @type {import('tailwindcss').Config} */
export default {
  // Dark mode is the only mode; hard-enabled on <html> in index.html.
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // "Kinetic Archive" type system: Space Grotesk for display/labels,
        // Inter for body. Token names are kept (`mono` -> Space Grotesk) so
        // existing label classes pick up the editorial face automatically.
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Space Grotesk"', '"SF Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Accent (themeable). Names kept so existing classes keep working.
        krang: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          bright: 'rgb(var(--accent-strong) / <alpha-value>)',
          deep: 'rgb(var(--accent-strong) / <alpha-value>)',
          dim: 'rgb(var(--accent) / <alpha-value>)',
        },
        // Surface ramp -> theme variables (Krang names retained).
        void: {
          DEFAULT: 'rgb(var(--bg-deep) / <alpha-value>)',
          950: 'rgb(var(--bg-deep) / <alpha-value>)',
          900: 'rgb(var(--bg) / <alpha-value>)',
          850: 'rgb(var(--surface) / <alpha-value>)',
          800: 'rgb(var(--surface-2) / <alpha-value>)',
          700: 'rgb(var(--border) / <alpha-value>)',
          600: 'rgb(var(--border-2) / <alpha-value>)',
        },
        // Semantic foreground / line tokens (theme-aware).
        fg: 'rgb(var(--fg) / <alpha-value>)',
        'fg-soft': 'rgb(var(--fg-soft) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        faint: 'rgb(var(--faint) / <alpha-value>)',
        line: 'rgb(var(--border) / <alpha-value>)',
        'line-2': 'rgb(var(--border-2) / <alpha-value>)',
        'accent-contrast': 'rgb(var(--accent-contrast) / <alpha-value>)',
      },
      // Sharp, near-square corners (their radius is a flat 2px everywhere).
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '2px',
        md: '2px',
        lg: '2px',
        xl: '3px',
        '2xl': '4px',
        '3xl': '6px',
        full: '9999px',
      },
      boxShadow: {
        // Flat, dark elevation — no ambient neon. Only a faint red lift exists
        // on primary hover, applied inline where needed.
        glow: '0 12px 30px rgba(0,0,0,0.5)',
        'glow-sm': '0 4px 12px rgba(0,0,0,0.4)',
        'glow-lg': '0 24px 60px rgba(0,0,0,0.6)',
        hud: 'inset 0 0 0 1px rgb(var(--border) / 0.6)',
      },
      keyframes: {
        risefade: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        // Subtle entrance only. The old neon motion tokens are neutralized so
        // any lingering classes are inert.
        risefade: 'risefade 0.25s cubic-bezier(0.25,0.46,0.45,0.94) both',
        gridpan: 'none',
        pulseglow: 'none',
        scan: 'none',
        flicker: 'none',
      },
    },
  },
  plugins: [],
}
