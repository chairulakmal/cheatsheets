/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./scripts/**/*.ts', './src/**/*.ts'],
  theme: { extend: {} },
  plugins: [require('@tailwindcss/typography')],
};
