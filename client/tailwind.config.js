/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2D6A4F",
        secondary: "#E76F51",
        accent: "#F4A261",
        dark: "#1A1A2E",
        muted: "#6B7280",
        light: "#FAFAFA",
        card: "#FFFFFF",
      }
    },
  },
  plugins: [],
}
