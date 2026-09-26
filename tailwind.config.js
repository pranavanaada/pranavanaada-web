/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald: {
          950: '#081f1b',
          900: '#0b2e28',
          800: '#123832',
          700: '#1a4a40',
        },
        gold: {
          light: '#e8cd8a',
          DEFAULT: '#c9a24b',
          dark: '#a8823a',
        },
        cream: '#f4ede1',
      },
      fontFamily: {
        // Kannada fallbacks: Latin text keeps Cinzel/Outfit, Kannada glyphs use these
        heading: ['Cinzel', '"Baloo Tamma 2"', 'serif'],
        body: ['Outfit', '"Noto Sans Kannada"', 'sans-serif'],
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        shine: {
          from: { backgroundPosition: '0% center' },
          to: { backgroundPosition: '200% center' },
        },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        shine: 'shine 6s linear infinite',
      },
    },
  },
  plugins: [],
};
