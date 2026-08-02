/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'saffron':   '#E67E22',
        'maroon':    '#800020',
        'gold':      '#D4AF37',
        'cream':     '#FAF3E0',
        'warm-gray': '#6B6560',
      },
    },
  },
  plugins: [],
};
