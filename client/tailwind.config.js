/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Navy blue from the image (CMYK: C99, M75, Y51, K62)
        navy: {
          DEFAULT: '#0d2637',
          light: '#143344',
          dark: '#091a26',
        },
        // Brown color palette for text
        brown: {
          DEFAULT: '#8B4513',
          50: '#FDF8F3',
          100: '#F5E6D3',
          200: '#E6C9A8',
          300: '#D4A574',
          400: '#C4864A',
          500: '#8B4513',
          600: '#723A10',
          700: '#5A2E0D',
          800: '#42220A',
          900: '#2A1606',
        },
      },
    },
  },
  plugins: [],
}

