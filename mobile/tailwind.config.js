/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#00843d',
        'primary-dark': '#006830',
        'primary-light': '#e8f5ee',
        accent: '#00843d',
        brand: {
          green: '#00843d',
          dark: '#006830',
          light: '#e8f5ee',
          gold: '#f0a500',
        },
      },
    },
  },
  plugins: [],
};
