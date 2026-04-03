import type {Config} from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C6A75E',
          dark: '#A98C55',
          light: '#D4BA7A'
        },
        brand: {
          950: '#141414',
          900: '#1A1A1A',
          800: '#222222',
          700: '#2A2A2A'
        }
      },
      boxShadow: {
        glow: '0 20px 60px rgba(198,167,94,0.15)'
      },
      borderRadius: {
        hero: '2rem'
      }
    }
  },
  plugins: []
};

export default config;
