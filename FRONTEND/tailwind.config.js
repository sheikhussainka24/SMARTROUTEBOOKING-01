/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
        script: ['Dancing Script', 'Caveat', 'cursive'],
      },
      colors: {
        plum: {
          900: '#24152D',
          600: '#6E5D73',
        },
        brandPink: {
          DEFAULT: '#C13D78',
          light: '#FFF1F6',
          border: '#E7A0BF',
        },
      },
      borderWidth: {
        '1.5': '1.5px',
      },
    },
  },
  plugins: [],
};
