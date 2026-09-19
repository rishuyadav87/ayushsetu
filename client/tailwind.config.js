/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: "#2563EB", // Blue-600 (vibrant, modern)
        primaryHover: "#1D4ED8",
        secondary: "#3B82F6",
        accent: "#60A5FA",
        dark: "#0F172A", // Slate-900
        muted: "#64748B",
        light: "#F8FAFC", // Slate-50
        card: "#FFFFFF",
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(37, 99, 235, 0.2)',
      }
    },
  },
  plugins: [],
}
