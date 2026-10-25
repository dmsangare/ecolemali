/** @type {import("tailwindcss").Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // ─── shadcn existant (INCHANGÉ) ───────────────────────────
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ─── SIS-MALI (NOUVEAU — additif) ─────────────────────────
        sis: {
          brand: {
            DEFAULT: "hsl(var(--sis-brand))",
            foreground: "hsl(var(--sis-brand-foreground))",
            50:  "hsl(var(--sis-brand-50))",
            100: "hsl(var(--sis-brand-100))",
            200: "hsl(var(--sis-brand-200))",
            300: "hsl(var(--sis-brand-300))",
            400: "hsl(var(--sis-brand-400))",
            500: "hsl(var(--sis-brand-500))",
            600: "hsl(var(--sis-brand-600))",
            700: "hsl(var(--sis-brand-700))",
            800: "hsl(var(--sis-brand-800))",
            900: "hsl(var(--sis-brand-900))",
          },
          success: {
            DEFAULT: "hsl(var(--sis-success))",
            foreground: "hsl(var(--sis-success-foreground))",
            bg: "hsl(var(--sis-success-bg))",
            border: "hsl(var(--sis-success-border))",
          },
          warning: {
            DEFAULT: "hsl(var(--sis-warning))",
            foreground: "hsl(var(--sis-warning-foreground))",
            bg: "hsl(var(--sis-warning-bg))",
            border: "hsl(var(--sis-warning-border))",
          },
          danger: {
            DEFAULT: "hsl(var(--sis-danger))",
            foreground: "hsl(var(--sis-danger-foreground))",
            bg: "hsl(var(--sis-danger-bg))",
            border: "hsl(var(--sis-danger-border))",
          },
          info: {
            DEFAULT: "hsl(var(--sis-info))",
            foreground: "hsl(var(--sis-info-foreground))",
            bg: "hsl(var(--sis-info-bg))",
            border: "hsl(var(--sis-info-border))",
          },
          neutral: {
            0:   "hsl(var(--sis-neutral-0))",
            50:  "hsl(var(--sis-neutral-50))",
            100: "hsl(var(--sis-neutral-100))",
            200: "hsl(var(--sis-neutral-200))",
            300: "hsl(var(--sis-neutral-300))",
            400: "hsl(var(--sis-neutral-400))",
            500: "hsl(var(--sis-neutral-500))",
            600: "hsl(var(--sis-neutral-600))",
            700: "hsl(var(--sis-neutral-700))",
            800: "hsl(var(--sis-neutral-800))",
            900: "hsl(var(--sis-neutral-900))",
            950: "hsl(var(--sis-neutral-950))",
          },
        },
      },

      borderRadius: {
        // shadcn existant
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // SIS-MALI
        "sis-xs": "var(--sis-radius-xs)",
        "sis-sm": "var(--sis-radius-sm)",
        "sis":    "var(--sis-radius)",
        "sis-md": "var(--sis-radius-md)",
        "sis-lg": "var(--sis-radius-lg)",
        "sis-xl": "var(--sis-radius-xl)",
      },

      boxShadow: {
        "sis-xs": "var(--sis-shadow-xs)",
        "sis-sm": "var(--sis-shadow-sm)",
        "sis":    "var(--sis-shadow)",
        "sis-md": "var(--sis-shadow-md)",
        "sis-lg": "var(--sis-shadow-lg)",
      },

      fontFamily: {
        "sis-sans": "var(--sis-font-sans)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};