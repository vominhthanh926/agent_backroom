/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}', // Include all JS/TS/JSX/TSX files in src
    './public/**/*.{html}',       // Include any static HTML files
  ],
  theme: {
    extend: {
      fontFamily: {
        medieval: ['Cinzel', 'serif'],
      },
      colors: {
        parchment: '#f4f4f0',
        ink: '#2e2b26',
        scroll: '#fffdf5',
      },
    },
  },
  plugins: [],
};
