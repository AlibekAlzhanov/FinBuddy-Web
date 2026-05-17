export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#121826',
        muted: '#64748B',
        line: '#E5EAF1',
        soft: '#F6F8FB',
        primary: '#2F6BFF',
        dark: '#111827',
      },
      boxShadow: {
        soft: '0 18px 45px rgba(15, 23, 42, 0.08)',
        elevated: '0 24px 70px rgba(15, 23, 42, 0.14)',
      },
      borderRadius: {
        '2xl': '24px',
        '3xl': '32px',
      },
    },
  },
  plugins: [],
};
