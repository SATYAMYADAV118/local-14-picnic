module.exports = {
  content: [
    './assets/src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0B5CD6',
        accent: '#06B6D4',
        success: '#22C55E',
        warning: '#F59E0B',
        background: '#F6F8FB',
        card: '#FFFFFF'
      },
      borderRadius: {
        xl: '16px'
      },
      boxShadow: {
        soft: '0 20px 40px rgba(15, 23, 42, 0.08)'
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
