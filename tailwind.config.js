/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.tsx',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        'scan-line': {
          '0%': { transform: 'translateY(0px)' },
          // Scan the full height of its container.
          '100%': { transform: 'translateY(calc(100% - 2px))' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'scan-line': 'scan-line 1.5s linear infinite alternate',
        'fade-in-down': 'fade-in-down 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};
