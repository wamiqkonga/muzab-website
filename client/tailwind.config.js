/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // New Muzab saffron brand palette
        'saffron':      '#E67E22',  // primary — deep saffron orange
        'saffron-dark': '#CA6F1E',  // hover state
        'maroon':       '#800020',  // secondary — rich burgundy
        'maroon-dark':  '#5C0016',  // hover state
        'gold':         '#D4AF37',  // accent — luxury gold
        'cream':        '#FAF3E0',  // background
        'forest':       '#1B5E20',  // optional nature accent
        'warm-gray':    '#6B6560',  // body text / secondary
        // keep legacy aliases so existing components don't break
        'saffron-red':  '#E67E22',
        'indigo-brand': '#800020',
        'linen':        '#FAF3E0',
        'slate-warm':   '#6B6560',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 16px 0 rgba(0,0,0,0.07)',
        'card': '0 4px 24px 0 rgba(0,0,0,0.09)',
      },
    },
  },
  plugins: [],
};
