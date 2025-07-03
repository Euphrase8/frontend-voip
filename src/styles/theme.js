// Professional VoIP Application Theme Configuration
// Consistent styling without gradients as per user preference

export const theme = {
  // Color Palette - Professional and Accessible
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    
    // Secondary/Neutral Colors
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    
    // Status Colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    
    danger: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    
    // VoIP Specific Colors
    call: {
      incoming: '#22c55e',
      outgoing: '#3b82f6',
      missed: '#ef4444',
      active: '#f59e0b',
      connected: '#10b981',
      ringing: '#f59e0b',
      ended: '#6b7280',
    }
  },
  
  // Typography Scale
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      'xs': ['0.75rem', { lineHeight: '1rem' }],
      'sm': ['0.875rem', { lineHeight: '1.25rem' }],
      'base': ['1rem', { lineHeight: '1.5rem' }],
      'lg': ['1.125rem', { lineHeight: '1.75rem' }],
      'xl': ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    }
  },
  
  // Spacing Scale
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },
  
  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    '4xl': '2rem',
    full: '9999px',
  },
  
  // Shadows - Professional without gradients
  boxShadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
    // Professional VoIP specific shadows
    elegant: '0 4px 20px 0 rgba(0, 0, 0, 0.1)',
    'elegant-lg': '0 10px 40px 0 rgba(0, 0, 0, 0.15)',
    'call-active': '0 0 20px rgba(34, 197, 94, 0.3)',
    'call-ringing': '0 0 20px rgba(245, 158, 11, 0.3)',
    'call-error': '0 0 20px rgba(239, 68, 68, 0.3)',
  },
  
  // Responsive Breakpoints
  screens: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Animation Durations
  transitionDuration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },
  
  // Z-Index Scale
  zIndex: {
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
    auto: 'auto',
    // VoIP specific z-indexes
    'incoming-call': '9999',
    'notification': '8888',
    'modal': '7777',
    'dropdown': '6666',
  }
};

// Component-specific theme configurations
export const componentThemes = {
  // Button variants
  button: {
    primary: {
      base: 'bg-primary-600 text-white border-primary-600',
      hover: 'hover:bg-primary-700 hover:border-primary-700',
      active: 'active:bg-primary-800 active:border-primary-800',
      disabled: 'disabled:bg-primary-300 disabled:border-primary-300 disabled:cursor-not-allowed',
      focus: 'focus:ring-4 focus:ring-primary-500/20',
    },
    secondary: {
      base: 'bg-secondary-100 text-secondary-900 border-secondary-200',
      hover: 'hover:bg-secondary-200 hover:border-secondary-300',
      active: 'active:bg-secondary-300 active:border-secondary-400',
      disabled: 'disabled:bg-secondary-50 disabled:text-secondary-400 disabled:cursor-not-allowed',
      focus: 'focus:ring-4 focus:ring-secondary-500/20',
    },
    success: {
      base: 'bg-success-600 text-white border-success-600',
      hover: 'hover:bg-success-700 hover:border-success-700',
      active: 'active:bg-success-800 active:border-success-800',
      disabled: 'disabled:bg-success-300 disabled:border-success-300 disabled:cursor-not-allowed',
      focus: 'focus:ring-4 focus:ring-success-500/20',
    },
    danger: {
      base: 'bg-danger-600 text-white border-danger-600',
      hover: 'hover:bg-danger-700 hover:border-danger-700',
      active: 'active:bg-danger-800 active:border-danger-800',
      disabled: 'disabled:bg-danger-300 disabled:border-danger-300 disabled:cursor-not-allowed',
      focus: 'focus:ring-4 focus:ring-danger-500/20',
    },
  },
  
  // Input variants
  input: {
    base: 'w-full px-4 py-3 border rounded-lg transition-all duration-200 bg-white',
    focus: 'focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 focus:outline-none',
    error: 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
    disabled: 'disabled:bg-secondary-50 disabled:text-secondary-400 disabled:cursor-not-allowed',
  },
  
  // Card variants
  card: {
    base: 'bg-white rounded-xl shadow-elegant border border-secondary-200 overflow-hidden',
    dark: 'bg-secondary-800 rounded-xl shadow-elegant-lg border border-secondary-700 overflow-hidden',
    interactive: 'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
  }
};

export default theme;
