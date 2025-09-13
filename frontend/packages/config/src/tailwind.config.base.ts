import type { Config } from 'tailwindcss'

/**
 * Base Tailwind configuration shared across all apps
 * Based on Unimore Trading design system
 */
export const baseConfig: Partial<Config> = {
  theme: {
    extend: {
      fontFamily: {
        // Primary fonts from Unimore design
        poppins: ['Poppins', 'sans-serif'],
        century: ['Century Gothic', 'CenturyGothic', 'AppleGothic', 'sans-serif'],
        sans: ['Poppins', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      colors: {
        // Unimore Trading Brand Colors
        unimore: {
          navy: {
            DEFAULT: '#00253a',
            dark: '#001829',
            light: '#003d5c',
          },
          blue: {
            DEFAULT: '#056389',
            dark: '#044e6b',
            light: '#0678a7',
            ice: '#e6f4f9',
          },
          white: {
            DEFAULT: '#ffffff',
            off: '#F5FBFE',
          },
          gray: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827',
          },
        },
        // Manufacturing status colors (aligned with Unimore palette)
        status: {
          idle: '#9ca3af',
          running: '#10b981',
          maintenance: '#f59e0b',
          error: '#ef4444',
          completed: '#22c55e',
          pending: '#056389',
          'quality-check': '#0678a7',
        },
        // Priority levels
        priority: {
          low: '#22c55e',
          medium: '#f59e0b',
          high: '#f97316',
          critical: '#ef4444',
        },
        // Production metrics (using Unimore colors)
        metrics: {
          oee: '#056389',
          availability: '#10b981',
          performance: '#f59e0b',
          quality: '#0678a7',
        },
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.025em' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0.025em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
        'body': '0.094em', // 1.5px at 16px base (Unimore body text spacing)
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 37, 58, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 37, 58, 0.1), 0 1px 2px 0 rgba(0, 37, 58, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 37, 58, 0.1), 0 2px 4px -1px rgba(0, 37, 58, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 37, 58, 0.1), 0 4px 6px -2px rgba(0, 37, 58, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 37, 58, 0.1), 0 10px 10px -5px rgba(0, 37, 58, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 37, 58, 0.25)',
        'hover': '0 10px 20px rgba(0, 99, 137, 0.2)', // Unimore blue shadow for hover
        'inner': 'inset 0 2px 4px 0 rgba(0, 37, 58, 0.06)',
        'none': 'none',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'hover-lift': 'hoverLift 0.3s ease-in-out',
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
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        hoverLift: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
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
      backgroundImage: {
        'gradient-unimore': 'linear-gradient(135deg, #00253a 0%, #056389 100%)',
        'gradient-blue': 'linear-gradient(135deg, #056389 0%, #0678a7 100%)',
        'gradient-navy': 'linear-gradient(135deg, #001829 0%, #00253a 100%)',
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
 * Manufacturing admin portal theme - Unimore Design System
 */
export const adminThemes = [
  {
    unimore: {
      "primary": "#056389",
      "primary-focus": "#044e6b",
      "primary-content": "#ffffff",
      "secondary": "#00253a",
      "secondary-focus": "#001829",
      "secondary-content": "#ffffff",
      "accent": "#0678a7",
      "accent-focus": "#056389",
      "accent-content": "#ffffff",
      "neutral": "#374151",
      "neutral-focus": "#1f2937",
      "neutral-content": "#ffffff",
      "base-100": "#ffffff",
      "base-200": "#F5FBFE",
      "base-300": "#e6f4f9",
      "base-content": "#00253a",
      "info": "#0678a7",
      "info-content": "#ffffff",
      "success": "#10b981",
      "success-content": "#ffffff",
      "warning": "#f59e0b",
      "warning-content": "#ffffff",
      "error": "#ef4444",
      "error-content": "#ffffff",
      // Custom properties for Unimore
      "--rounded-box": "0.5rem",
      "--rounded-btn": "0.375rem",
      "--rounded-badge": "0.25rem",
      "--animation-btn": "0.3s",
      "--animation-input": "0.2s",
      "--btn-text-case": "none",
      "--btn-focus-scale": "0.98",
      "--border-btn": "2px",
      "--tab-border": "2px",
      "--tab-radius": "0.375rem",
    },
  },
  {
    'unimore-dark': {
      "primary": "#0678a7",
      "primary-focus": "#056389",
      "primary-content": "#ffffff",
      "secondary": "#003d5c",
      "secondary-focus": "#00253a",
      "secondary-content": "#ffffff",
      "accent": "#3b82f6",
      "accent-focus": "#2563eb",
      "accent-content": "#ffffff",
      "neutral": "#1f2937",
      "neutral-focus": "#111827",
      "neutral-content": "#d1d5db",
      "base-100": "#111827",
      "base-200": "#1f2937",
      "base-300": "#374151",
      "base-content": "#e5e7eb",
      "info": "#3b82f6",
      "info-content": "#ffffff",
      "success": "#10b981",
      "success-content": "#ffffff",
      "warning": "#f59e0b",
      "warning-content": "#ffffff",
      "error": "#ef4444",
      "error-content": "#ffffff",
      // Custom properties for dark theme
      "--rounded-box": "0.5rem",
      "--rounded-btn": "0.375rem",
      "--rounded-badge": "0.25rem",
      "--animation-btn": "0.3s",
      "--animation-input": "0.2s",
      "--btn-text-case": "none",
      "--btn-focus-scale": "0.98",
      "--border-btn": "2px",
      "--tab-border": "2px",
      "--tab-radius": "0.375rem",
    },
  },
]

/**
 * Manufacturing user portal theme - Unimore Design System
 */
export const userThemes = [
  {
    'unimore-user': {
      "primary": "#056389",
      "primary-focus": "#044e6b",
      "primary-content": "#ffffff",
      "secondary": "#00253a",
      "secondary-focus": "#001829",
      "secondary-content": "#ffffff",
      "accent": "#0678a7",
      "accent-focus": "#056389",
      "accent-content": "#ffffff",
      "neutral": "#374151",
      "neutral-focus": "#1f2937",
      "neutral-content": "#ffffff",
      "base-100": "#ffffff",
      "base-200": "#F5FBFE",
      "base-300": "#e6f4f9",
      "base-content": "#00253a",
      "info": "#0678a7",
      "info-content": "#ffffff",
      "success": "#10b981",
      "success-content": "#ffffff",
      "warning": "#f59e0b",
      "warning-content": "#ffffff",
      "error": "#ef4444",
      "error-content": "#ffffff",
      // Custom properties
      "--rounded-box": "0.5rem",
      "--rounded-btn": "0.375rem",
      "--rounded-badge": "0.25rem",
      "--animation-btn": "0.3s",
      "--animation-input": "0.2s",
      "--btn-text-case": "none",
      "--btn-focus-scale": "0.98",
      "--border-btn": "2px",
      "--tab-border": "2px",
      "--tab-radius": "0.375rem",
    },
  },
  {
    'unimore-user-dark': {
      "primary": "#0678a7",
      "primary-focus": "#056389",
      "primary-content": "#ffffff",
      "secondary": "#003d5c",
      "secondary-focus": "#00253a",
      "secondary-content": "#ffffff",
      "accent": "#3b82f6",
      "accent-focus": "#2563eb",
      "accent-content": "#ffffff",
      "neutral": "#1f2937",
      "neutral-focus": "#111827",
      "neutral-content": "#d1d5db",
      "base-100": "#111827",
      "base-200": "#1f2937",
      "base-300": "#374151",
      "base-content": "#e5e7eb",
      "info": "#3b82f6",
      "info-content": "#ffffff",
      "success": "#10b981",
      "success-content": "#ffffff",
      "warning": "#f59e0b",
      "warning-content": "#ffffff",
      "error": "#ef4444",
      "error-content": "#ffffff",
      // Custom properties
      "--rounded-box": "0.5rem",
      "--rounded-btn": "0.375rem",
      "--rounded-badge": "0.25rem",
      "--animation-btn": "0.3s",
      "--animation-input": "0.2s",
      "--btn-text-case": "none",
      "--btn-focus-scale": "0.98",
      "--border-btn": "2px",
      "--tab-border": "2px",
      "--tab-radius": "0.375rem",
    },
  },
]