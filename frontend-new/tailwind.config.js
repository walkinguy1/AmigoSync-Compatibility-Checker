/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream:   "#F5F0E8",
        parchment: "#EDE7D9",
        warm:    "#D9CFC0",
        ink:     "#2C2416",
        inksoft: "#5C4F3A",
        inkfade: "#9C8E7A",
        accent:  "#8B5E3C",
        accentlt:"#C4956A",
        rose:    "#C0544A",
        sage:    "#5C7A5A",
        gold:    "#A07830",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        ui:      ["'Plus Jakarta Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};