import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      colors: {
        background: '#F7F5F0',
        surface: '#FFFEFA',
        sidebar: '#F1EFE8',
        border: '#E5E1D8',
        'text-primary': '#25251F',
        'text-secondary': '#77766E',
        'text-muted': '#A09D92',
        olive: {
          DEFAULT: '#68745D',
          soft: '#E8EBE1',
          dark: '#515B48',
        },
        status: {
          success: '#64816A',
          warning: '#B78A4A',
          danger: '#B56E63',
          info: '#71869A',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', '"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', '"DM Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
