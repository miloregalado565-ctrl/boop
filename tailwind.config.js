/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'scanner-green': '#00d4a0',
        'scanner-red': '#ff4757',
        'scanner-cyan': '#00d2ff',
        'scanner-yellow': '#ffd700',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'price-up': 'priceUp 0.5s ease-out',
        'price-down': 'priceDown 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        priceUp: {
          '0%': { color: '#00d4a0', transform: 'scale(1.05)' },
          '100%': { color: 'inherit', transform: 'scale(1)' },
        },
        priceDown: {
          '0%': { color: '#ff4757', transform: 'scale(1.05)' },
          '100%': { color: 'inherit', transform: 'scale(1)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
