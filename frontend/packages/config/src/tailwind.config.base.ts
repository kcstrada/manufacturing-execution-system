import type { Config } from 'tailwindcss'

/**
 * Base Tailwind configuration shared across all apps
 */
export const baseConfig: Partial<Config> = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Manufacturing status colors
        status: {
          idle: '#94a3b8',
          running: '#10b981',
          maintenance: '#f59e0b',
          error: '#ef4444',
          completed: '#22c55e',
          pending: '#3b82f6',
          'quality-check': '#a855f7',
        },
        // Priority levels
        priority: {
          low: '#22c55e',
          medium: '#f59e0b',
          high: '#f97316',
          critical: '#ef4444',
        },
        // Production metrics
        metrics: {
          oee: '#3b82f6',
          availability: '#10b981',
          performance: '#f59e0b',
          quality: '#a855f7',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
}

/**
 * DaisyUI base configuration
 */
export const daisyUIConfig = {
  base: true,
  styled: true,
  utils: true,
  prefix: "",
  logs: false,
  themeRoot: ":root",
}

/**
 * Manufacturing admin portal theme
 */
export const adminThemes = [
  {
    light: {
      "primary": "#0066cc",
      "primary-focus": "#0052a3",
      "primary-content": "#ffffff",
      "secondary": "#6c5ce7",
      "secondary-focus": "#5642d9",
      "secondary-content": "#ffffff",
      "accent": "#00b894",
      "accent-focus": "#009a7a",
      "accent-content": "#ffffff",
      "neutral": "#3d4451",
      "neutral-focus": "#2a2e37",
      "neutral-content": "#ffffff",
      "base-100": "#ffffff",
      "base-200": "#f9fafb",
      "base-300": "#d1d5db",
      "base-content": "#1f2937",
      "info": "#3ABFF8",
      "success": "#36D399",
      "warning": "#FBBD23",
      "error": "#F87272",
    },
  },
  {
    dark: {
      "primary": "#4A9EFF",
      "primary-focus": "#2B7FE0",
      "primary-content": "#ffffff",
      "secondary": "#9333ea",
      "secondary-focus": "#7e22ce",
      "secondary-content": "#ffffff",
      "accent": "#10b981",
      "accent-focus": "#059669",
      "accent-content": "#ffffff",
      "neutral": "#2a323c",
      "neutral-focus": "#242b33",
      "neutral-content": "#a6adba",
      "base-100": "#1d232a",
      "base-200": "#191e24",
      "base-300": "#15191e",
      "base-content": "#a6adba",
      "info": "#3ABFF8",
      "success": "#36D399",
      "warning": "#FBBD23",
      "error": "#F87272",
    },
  },
  "corporate",
  "business",
]

/**
 * Manufacturing user portal theme
 */
export const userThemes = [
  {
    light: {
      "primary": "#00b894",
      "primary-focus": "#009a7a",
      "primary-content": "#ffffff",
      "secondary": "#0066cc",
      "secondary-focus": "#0052a3",
      "secondary-content": "#ffffff",
      "accent": "#fdcb6e",
      "accent-focus": "#fcb93a",
      "accent-content": "#1f2937",
      "neutral": "#3d4451",
      "neutral-focus": "#2a2e37",
      "neutral-content": "#ffffff",
      "base-100": "#ffffff",
      "base-200": "#f9fafb",
      "base-300": "#d1d5db",
      "base-content": "#1f2937",
      "info": "#3ABFF8",
      "success": "#36D399",
      "warning": "#FBBD23",
      "error": "#F87272",
    },
  },
  {
    dark: {
      "primary": "#10b981",
      "primary-focus": "#059669",
      "primary-content": "#ffffff",
      "secondary": "#4A9EFF",
      "secondary-focus": "#2B7FE0",
      "secondary-content": "#ffffff",
      "accent": "#fbbf24",
      "accent-focus": "#f59e0b",
      "accent-content": "#1f2937",
      "neutral": "#2a323c",
      "neutral-focus": "#242b33",
      "neutral-content": "#a6adba",
      "base-100": "#1d232a",
      "base-200": "#191e24",
      "base-300": "#15191e",
      "base-content": "#a6adba",
      "info": "#3ABFF8",
      "success": "#36D399",
      "warning": "#FBBD23",
      "error": "#F87272",
    },
  },
  "emerald",
  "lofi",
]