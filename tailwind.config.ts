import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'lq-primary': '#1B4332',
        'lq-primary-light': '#2D6A4F',
        'lq-secondary': '#52B788',
        'lq-accent': '#D4AF37',
        'lq-bg': '#F4F7F4',
        'lq-surface': '#FFFFFF',
        'lq-border': '#D1E4D8',
        'lq-text': '#1A2E1A',
        'lq-muted': '#5A7A62',
        'lq-success': '#40916C',
        'lq-warning': '#E9A012',
        'lq-danger': '#C0392B',
        'lq-info': '#2980B9',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
