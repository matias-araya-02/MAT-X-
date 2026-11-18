import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7C3AED',
        secondary: '#A78BFA',
        accent: '#DDD6FE',
        background: '#FFFFFF',
        surface: '#F4F4F5',
        text: '#09090B',
        muted: '#71717A',
      },
      fontFamily: {
        sans: ['var(--font-jura)', 'sans-serif'],
        heading: ['var(--font-jura)', 'sans-serif'],
        body: ['var(--font-jura)', 'sans-serif'],
        mono: ['var(--font-jura)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
