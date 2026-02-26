import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: "#D97757"
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        sans: ["Noto Sans SC", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
