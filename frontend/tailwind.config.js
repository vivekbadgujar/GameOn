/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        'primary-bg': '#10101a',
        'secondary-bg': '#181828',
        'card-bg': 'rgba(24,24,40,0.85)',
        'glass': 'rgba(24,24,40,0.6)',
        'accent-blue': '#00eaff',
        'accent-green': '#00ffb2',
        'accent-purple': '#a259ff',
        'accent-pink': '#ff4ecd',
        'accent-orange': '#ffb86c',
        'accent-red': '#ff4e6b',
        'text-primary': '#f3f3fa',
        'text-secondary': '#b0b0c3',
        'text-muted': '#6c6c8a',
        'border': '#23233a',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'Outfit', 'Space Grotesk', 'sans-serif'],
        display: ['Space Grotesk', 'Outfit', 'Poppins', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        neon: '0 0 16px 2px #00eaff, 0 0 32px 4px #a259ff',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
      },
      borderRadius: {
        glass: '1.5rem',
        card: '1.25rem',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};

