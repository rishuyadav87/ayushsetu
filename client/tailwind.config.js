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
        primary: "#4F46E5", // Indigo-600 (Premium Stripe-like blue)
        primaryHover: "#4338CA", // Indigo-700
        secondary: "#6366F1", // Indigo-500
        accent: "#818CF8", // Indigo-400
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
