/**
 * Unimore Design System Tokens
 * Based on Unimore Trading visual identity
 */

export const designTokens = {
  // Brand Colors
  colors: {
    brand: {
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
    },
    // Semantic Colors
    semantic: {
      primary: '#056389',
      secondary: '#00253a',
      accent: '#0678a7',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#0678a7',
    },
    // Manufacturing Status Colors
    status: {
      idle: '#9ca3af',
      running: '#10b981',
      maintenance: '#f59e0b',
      error: '#ef4444',
      completed: '#22c55e',
      pending: '#056389',
      qualityCheck: '#0678a7',
    },
    // Priority Levels
    priority: {
      low: '#22c55e',
      medium: '#f59e0b',
      high: '#f97316',
      critical: '#ef4444',
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      primary: 'Poppins, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      secondary: 'Century Gothic, CenturyGothic, AppleGothic, sans-serif',
      mono: 'JetBrains Mono, Menlo, monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      body: '0.094em', // 1.5px at 16px base
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
  },
  
  // Spacing
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem',  // 64px
    '4xl': '6rem',  // 96px
    '5xl': '8rem',  // 128px
  },
  
  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    DEFAULT: '0.25rem', // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  // Shadows (using Unimore navy)
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 37, 58, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 37, 58, 0.1), 0 1px 2px 0 rgba(0, 37, 58, 0.06)',
    md: '0 4px 6px -1px rgba(0, 37, 58, 0.1), 0 2px 4px -1px rgba(0, 37, 58, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 37, 58, 0.1), 0 4px 6px -2px rgba(0, 37, 58, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 37, 58, 0.1), 0 10px 10px -5px rgba(0, 37, 58, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 37, 58, 0.25)',
    hover: '0 10px 20px rgba(5, 99, 137, 0.2)',
    inner: 'inset 0 2px 4px 0 rgba(0, 37, 58, 0.06)',
    none: 'none',
  },
  
  // Transitions
  transitions: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  // Z-Index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    notification: 1080,
  },
  
  // Breakpoints
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1920px',
  },
};

// CSS Custom Properties Generator
export const generateCSSVariables = () => {
  return `
    :root {
      /* Brand Colors */
      --color-navy: ${designTokens.colors.brand.navy.DEFAULT};
      --color-navy-dark: ${designTokens.colors.brand.navy.dark};
      --color-navy-light: ${designTokens.colors.brand.navy.light};
      --color-blue: ${designTokens.colors.brand.blue.DEFAULT};
      --color-blue-dark: ${designTokens.colors.brand.blue.dark};
      --color-blue-light: ${designTokens.colors.brand.blue.light};
      --color-blue-ice: ${designTokens.colors.brand.blue.ice};
      --color-white: ${designTokens.colors.brand.white.DEFAULT};
      --color-white-off: ${designTokens.colors.brand.white.off};
      
      /* Semantic Colors */
      --color-primary: ${designTokens.colors.semantic.primary};
      --color-secondary: ${designTokens.colors.semantic.secondary};
      --color-accent: ${designTokens.colors.semantic.accent};
      --color-success: ${designTokens.colors.semantic.success};
      --color-warning: ${designTokens.colors.semantic.warning};
      --color-error: ${designTokens.colors.semantic.error};
      --color-info: ${designTokens.colors.semantic.info};
      
      /* Typography */
      --font-primary: ${designTokens.typography.fontFamily.primary};
      --font-secondary: ${designTokens.typography.fontFamily.secondary};
      --font-mono: ${designTokens.typography.fontFamily.mono};
      
      /* Spacing */
      --spacing-xs: ${designTokens.spacing.xs};
      --spacing-sm: ${designTokens.spacing.sm};
      --spacing-md: ${designTokens.spacing.md};
      --spacing-lg: ${designTokens.spacing.lg};
      --spacing-xl: ${designTokens.spacing.xl};
      
      /* Border Radius */
      --radius-sm: ${designTokens.borderRadius.sm};
      --radius-md: ${designTokens.borderRadius.md};
      --radius-lg: ${designTokens.borderRadius.lg};
      --radius-xl: ${designTokens.borderRadius.xl};
      
      /* Transitions */
      --transition-fast: ${designTokens.transitions.duration.fast};
      --transition-normal: ${designTokens.transitions.duration.normal};
      --transition-slow: ${designTokens.transitions.duration.slow};
    }
  `;
};

export default designTokens;