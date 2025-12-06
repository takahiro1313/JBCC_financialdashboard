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
        primary: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#868e96',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
        },
        accent: {
          DEFAULT: '#1a365d',
          light: '#2c5282',
          dark: '#0d1b2a',
        },
        chart: {
          bar: '#4a5568',
          barHover: '#2d3748',
          line: '#c53030',
          line2: '#2b6cb0',
        }
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'Hiragino Sans', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
export default config
