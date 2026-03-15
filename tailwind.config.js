/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'void': '#050505',
        'neon': '#00d4ff',
        'neon-dim': '#0099bb',
        'chrome': '#c0c0c0',
        'chrome-dark': '#808080',
        'panel': '#0a0a0f',
        'panel-border': '#1a1a2e',
        'panel-border-bright': '#00d4ff33',
        'status-ok': '#00ff88',
        'status-warn': '#ffaa00',
        'status-crit': '#ff3355',
        'status-idle': '#444466',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'monospace'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'neon': '0 0 10px #00d4ff, 0 0 20px #00d4ff44',
        'neon-sm': '0 0 5px #00d4ff, 0 0 10px #00d4ff33',
        'neon-lg': '0 0 20px #00d4ff, 0 0 40px #00d4ff44, 0 0 60px #00d4ff22',
        'panel': '0 0 0 1px #1a1a2e, 0 4px 24px #000000aa',
        'panel-active': '0 0 0 1px #00d4ff33, 0 4px 24px #00d4ff11',
      },
      backgroundImage: {
        'grid-hud': "linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)",
        'scanline': "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 212, 255, 0.015) 2px, rgba(0, 212, 255, 0.015) 4px)",
      },
      backgroundSize: {
        'grid-hud': '60px 60px',
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'scan': 'scan 4s linear infinite',
        'flicker': 'flicker 6s ease-in-out infinite',
        'energy': 'energy 1.5s ease-in-out infinite',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 5px #00d4ff, 0 0 10px #00d4ff33' },
          '50%': { boxShadow: '0 0 15px #00d4ff, 0 0 30px #00d4ff66, 0 0 45px #00d4ff22' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        flicker: {
          '0%, 90%, 100%': { opacity: '1' },
          '92%': { opacity: '0.85' },
          '94%': { opacity: '1' },
          '96%': { opacity: '0.9' },
        },
        energy: {
          '0%, 100%': { opacity: '0.6', transform: 'scaleX(1)' },
          '50%': { opacity: '1', transform: 'scaleX(1.02)' },
        },
      },
    },
  },
  plugins: [],
}
