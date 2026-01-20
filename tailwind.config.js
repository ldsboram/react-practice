/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        font1: ['Roboto', 'sans-serif'],
        font2: ['Open Sans', 'sans-serif'],
        font3: ['Lato', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fill: theme => theme('colors'),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
