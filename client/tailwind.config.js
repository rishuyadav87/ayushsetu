/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1E40AF",
        secondary: "#3B82F6",
        accent: "#60A5FA",
        dark: "#1E293B",
        muted: "#64748B",
        light: "#FAFAFA",
        card: "#FFFFFF",
      }
    },
  },
  plugins: [],
}
