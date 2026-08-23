/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'saffron':      '#E67E22',
        'saffron-dark': '#CA6F1E',
        'maroon':       '#800020',
        'maroon-dark':  '#5C0016',
        'gold':         '#D4AF37',
        'cream':        '#FAF3E0',
        'forest':       '#1B5E20',
        'warm-gray':    '#6B6560',
        // legacy aliases used across admin pages
        'saffron-red':  '#E67E22',
        'indigo-brand': '#800020',
        'linen':        '#FAF3E0',
        'slate-warm':   '#6B6560',
      },
    },
  },
  plugins: [],
};
