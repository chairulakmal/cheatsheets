/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./scripts/**/*.ts', './src/**/*.ts'],
  theme: { extend: {} },
  plugins: [require('@tailwindcss/typography')],
};
