import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "24px",
      screens: { sm: "100%", md: "768px", lg: "1024px", xl: "1120px" },
    },
    extend: {
      colors: {
        background: "#FFFFFF",
        foreground: "#111827",
        ink: "#111827",
        secondary: "#64748B",
        primary: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          light: "#EFF6FF",
        },
        success: {
          DEFAULT: "#16A34A",
          light: "#F0FDF4",
        },
        warning: {
          DEFAULT: "#EA580C",
          light: "#FFF7ED",
        },
        danger: {
          DEFAULT: "#DC2626",
          light: "#FEF2F2",
        },
        accent: {
          DEFAULT: "#7C3AED",
          light: "#F5F3FF",
        },
        muted: "#64748B",
        surface: "#F8FAFC",
        border: "#E2E8F0",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "IBM Plex Sans Arabic", "sans-serif"],
        body: ["var(--font-body)", "IBM Plex Sans Arabic", "sans-serif"],
      },
      borderRadius: {
        ck: "16px",
        btn: "16px",
      },
      maxWidth: { content: "1120px" },
    },
  },
  plugins: [],
};
export default config;
