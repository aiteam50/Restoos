import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { brand: { DEFAULT: '#d42a2a', dark: '#a91f1f', light: '#fdecec' } },
    },
  },
  plugins: [],
} satisfies Config;
