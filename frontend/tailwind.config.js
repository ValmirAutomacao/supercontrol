/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "inverse-surface": "#fafafa",
        "secondary-fixed-dim": "#71717a",
        "secondary": "#71717a",
        "surface-bright": "#18181b",
        "outline": "#52525b",
        "on-background": "#fafafa",
        "surface-tint": "#a78bfa",
        "surface-variant": "#18181b",
        "inverse-on-surface": "#09090b",
        "on-secondary-fixed": "#18181b",
        "secondary-fixed": "#a1a1aa",
        "primary": "#a78bfa",
        "surface-container-highest": "#1e1e22",
        "primary-container": "#7c3aed",
        "on-primary-fixed-variant": "#5b21b6",
        "on-error": "#1a0000",
        "on-surface-variant": "#a1a1aa",
        "on-surface": "#fafafa",
        "on-primary-fixed": "#2e1065",
        "on-error-container": "#fca5a5",
        "on-primary-container": "#ede9fe",
        "surface-container-lowest": "#09090b",
        "surface-container-low": "#0f0f12",
        "on-tertiary-fixed": "#003318",
        "background": "#09090b",
        "surface-dim": "#0c0c0f",
        "on-secondary-container": "#a1a1aa",
        "primary-fixed": "#ede9fe",
        "tertiary-fixed": "#bbf7d0",
        "outline-variant": "#27272a",
        "on-tertiary-container": "#bbf7d0",
        "on-primary": "#0a0012",
        "on-secondary": "#09090b",
        "inverse-primary": "#5b21b6",
        "surface-container-high": "#18181b",
        "surface": "#0c0c0f",
        "primary-fixed-dim": "#c4b5fd",
        "surface-container": "#121215",
        "tertiary-container": "#065f46",
        "tertiary": "#34d399",
        "on-tertiary-fixed-variant": "#047857",
        "on-tertiary": "#001a12",
        "tertiary-fixed-dim": "#6ee7b7",
        "secondary-container": "#27272a",
        "error-container": "#3b1111",
        "on-secondary-fixed-variant": "#3f3f46",
        "error": "#ef4444"
      },
      fontFamily: {
        "headline": ["Geist", "sans-serif"],
        "body": ["Geist", "sans-serif"],
        "label": ["Geist", "sans-serif"]
      },
      borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out forwards"
      }
    },
  },
  plugins: [],
}
