/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Helvetica', 'Arial', 'sans-serif'],
        title: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Helvetica', 'Arial', 'sans-serif'],
        accent: ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        gray: {
          750: '#2c2c2c',
        },
        background: {
          light: '#ffffff',
          dark: '#191919',
        },
        notion: {
          default: '#37352f',
          gray: '#9b9a97',
          brown: '#64473a',
          orange: '#d9730d',
          yellow: '#dfab01',
          green: '#0f7b6c',
          blue: '#0b6e99',
          purple: '#6940a5',
          pink: '#ad1a72',
          red: '#e03e3e',
        },
        mood: {
          joyful: '#FFD166',   // Yellow
          peaceful: '#06D6A0',  // Green
          sad: '#118AB2',      // Blue
          angry: '#EF476F',    // Red
          anxious: '#073B4C',  // Dark blue
        }
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
