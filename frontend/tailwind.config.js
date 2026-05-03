/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        adivi: {
          green: "#1ed760",
          mint: "#7CFFB2",
          ink: "#020617",
          panel: "#0b1220"
        }
      },
      boxShadow: {
        glow: "0 0 34px rgba(30, 215, 96, 0.28)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
