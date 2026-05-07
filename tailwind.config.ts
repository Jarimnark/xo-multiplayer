import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        x: '#00f5ff',
        o: '#ff6b35',
        surface: '#0d0d0f',
        card: '#151519',
        border: '#1f1f26',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-x': 'pulse-x 1.5s ease-in-out infinite',
        'pulse-o': 'pulse-o 1.5s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'blink': 'blink 1s step-end infinite',
        'win-flash': 'win-flash 0.5s ease-out',
      },
      keyframes: {
        'pulse-x': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 245, 255, 0)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(0, 245, 255, 0.4)' },
        },
        'pulse-o': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 107, 53, 0)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(255, 107, 53, 0.4)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'win-flash': {
          '0%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(255, 215, 0, 0.2)' },
          '100%': { backgroundColor: 'rgba(255, 215, 0, 0.08)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
