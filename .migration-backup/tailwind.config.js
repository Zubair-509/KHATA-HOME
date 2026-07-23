/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          900: 'var(--color-primary-900)',
          700: 'var(--color-primary-700)',
          500: 'var(--color-primary-500)',
          300: 'var(--color-primary-300)',
          100: 'var(--color-primary-100)',
          50: 'var(--color-primary-50)',
        },
        inflow: {
          text: 'var(--color-inflow-text)',
          bg: 'var(--color-inflow-bg)',
          border: 'var(--color-inflow-border)',
        },
        outflow: {
          text: 'var(--color-outflow-text)',
          bg: 'var(--color-outflow-bg)',
          border: 'var(--color-outflow-border)',
        },
        pending: {
          text: 'var(--color-pending-text)',
          bg: 'var(--color-pending-bg)',
          border: 'var(--color-pending-border)',
        },
        neutral: {
          900: 'var(--color-neutral-900)',
          700: 'var(--color-neutral-700)',
          500: 'var(--color-neutral-500)',
          300: 'var(--color-neutral-300)',
          100: 'var(--color-neutral-100)',
          50: 'var(--color-neutral-50)',
        },
        bg: {
          base: 'var(--color-bg-base)',
          card: 'var(--color-bg-card)',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        display: ['var(--text-display)', { lineHeight: '1.1', fontWeight: '700' }],
        'title-xl': ['var(--text-title-xl)', { lineHeight: '1.2', fontWeight: '700' }],
        'title-lg': ['var(--text-title-lg)', { fontWeight: '600' }],
        'title-md': ['var(--text-title-md)', { fontWeight: '600' }],
        'body-lg': ['var(--text-body-lg)', { fontWeight: '400' }],
        'body-md': ['var(--text-body-md)', { fontWeight: '400' }],
        'body-sm': ['var(--text-body-sm)', { fontWeight: '400' }],
        label: ['var(--text-label)', { fontWeight: '600' }],
        'mono-lg': ['var(--text-mono-lg)', { fontWeight: '500' }],
        'mono-md': ['var(--text-mono-md)', { fontWeight: '500' }],
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '400ms',
      },
    },
  },
  plugins: [],
}
