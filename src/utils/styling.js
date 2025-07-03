// Professional VoIP Application Styling Utilities
// Consistent component styling without gradients

import { cn } from './ui';

// Button styling utilities
export const buttonStyles = {
  // Base button styles
  base: 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Size variants
  sizes: {
    xs: 'px-2.5 py-1.5 text-xs rounded-md min-h-[28px]',
    sm: 'px-3 py-2 text-sm rounded-md min-h-[32px]',
    md: 'px-4 py-2.5 text-sm rounded-lg min-h-[40px]',
    lg: 'px-6 py-3 text-base rounded-lg min-h-[44px]',
    xl: 'px-8 py-4 text-lg rounded-xl min-h-[52px]',
  },
  
  // Color variants
  variants: {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus:ring-primary-500/20 border border-primary-600 hover:border-primary-700',
    secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 active:bg-secondary-300 focus:ring-secondary-500/20 border border-secondary-200 hover:border-secondary-300',
    success: 'bg-success-600 text-white hover:bg-success-700 active:bg-success-800 focus:ring-success-500/20 border border-success-600 hover:border-success-700',
    warning: 'bg-warning-600 text-white hover:bg-warning-700 active:bg-warning-800 focus:ring-warning-500/20 border border-warning-600 hover:border-warning-700',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800 focus:ring-danger-500/20 border border-danger-600 hover:border-danger-700',
    outline: 'bg-transparent border-2 border-secondary-300 text-secondary-700 hover:bg-secondary-50 active:bg-secondary-100 focus:ring-secondary-500/20',
    ghost: 'bg-transparent text-secondary-700 hover:bg-secondary-100 active:bg-secondary-200 focus:ring-secondary-500/20',
  }
};

// Input styling utilities
export const inputStyles = {
  base: 'w-full px-4 py-3 border border-secondary-300 rounded-lg bg-white text-secondary-900 placeholder-secondary-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
  error: 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
  disabled: 'bg-secondary-50 text-secondary-400 cursor-not-allowed',
  dark: 'bg-secondary-800 border-secondary-600 text-white placeholder-secondary-400 focus:border-primary-500',
};

// Card styling utilities
export const cardStyles = {
  base: 'bg-white rounded-xl shadow-elegant border border-secondary-200 overflow-hidden',
  dark: 'bg-secondary-800 rounded-xl shadow-elegant-lg border border-secondary-700 overflow-hidden',
  interactive: 'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer',
  padding: {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  }
};

// Call status styling utilities
export const callStatusStyles = {
  incoming: 'bg-success-500 text-white',
  outgoing: 'bg-primary-500 text-white',
  connected: 'bg-success-600 text-white',
  ringing: 'bg-warning-500 text-white animate-pulse',
  ended: 'bg-secondary-500 text-white',
  missed: 'bg-danger-500 text-white',
  failed: 'bg-danger-600 text-white',
};

// Avatar styling utilities
export const avatarStyles = {
  sizes: {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
    '3xl': 'w-24 h-24 text-3xl',
  },
  base: 'inline-flex items-center justify-center rounded-full bg-primary-500 text-white font-semibold shadow-md',
};

// Badge styling utilities
export const badgeStyles = {
  base: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  variants: {
    primary: 'bg-primary-100 text-primary-800',
    secondary: 'bg-secondary-100 text-secondary-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    danger: 'bg-danger-100 text-danger-800',
  }
};

// Notification styling utilities
export const notificationStyles = {
  base: 'fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl border-l-4 max-w-sm',
  variants: {
    success: 'bg-success-50 border-success-500 text-success-800',
    warning: 'bg-warning-50 border-warning-500 text-warning-800',
    danger: 'bg-danger-50 border-danger-500 text-danger-800',
    info: 'bg-primary-50 border-primary-500 text-primary-800',
  }
};

// Loading spinner utilities
export const spinnerStyles = {
  base: 'animate-spin rounded-full border-2 border-transparent',
  sizes: {
    xs: 'w-3 h-3 border-t-secondary-400',
    sm: 'w-4 h-4 border-t-secondary-500',
    md: 'w-6 h-6 border-t-secondary-600',
    lg: 'w-8 h-8 border-t-secondary-700',
    xl: 'w-12 h-12 border-t-secondary-800',
  },
  variants: {
    primary: 'border-t-primary-600',
    white: 'border-t-white',
    success: 'border-t-success-600',
    warning: 'border-t-warning-600',
    danger: 'border-t-danger-600',
  }
};

// Responsive utilities
export const responsiveStyles = {
  // Mobile-first responsive padding
  padding: {
    page: 'px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8 lg:py-10',
    section: 'px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10',
    card: 'p-4 sm:p-6 md:p-8',
  },
  
  // Mobile-first responsive text
  text: {
    heading: 'text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight',
    subheading: 'text-base sm:text-lg md:text-xl font-semibold leading-tight',
    body: 'text-sm sm:text-base leading-relaxed',
    caption: 'text-xs sm:text-sm text-secondary-600',
  },
  
  // Mobile-first responsive spacing
  spacing: {
    section: 'space-y-4 sm:space-y-6 md:space-y-8',
    items: 'space-y-2 sm:space-y-3 md:space-y-4',
    inline: 'space-x-2 sm:space-x-3 md:space-x-4',
  }
};

// Touch target utilities for mobile
export const touchTargetStyles = {
  base: 'min-w-[44px] min-h-[44px] sm:min-w-[48px] sm:min-h-[48px]',
  large: 'min-w-[48px] min-h-[48px] sm:min-w-[52px] sm:min-h-[52px]',
};

// Animation utilities
export const animationStyles = {
  fadeIn: 'animate-[fadeIn_0.5s_ease-in-out]',
  fadeInUp: 'animate-[fadeInUp_0.6s_ease-out]',
  slideInRight: 'animate-[slideInRight_0.3s_ease-out]',
  slideInLeft: 'animate-[slideInLeft_0.3s_ease-out]',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  spin: 'animate-spin',
};

// Helper functions for building component styles
export const buildButtonClass = (variant = 'primary', size = 'md', className = '') => {
  return cn(
    buttonStyles.base,
    buttonStyles.sizes[size],
    buttonStyles.variants[variant],
    className
  );
};

export const buildInputClass = (error = false, disabled = false, dark = false, className = '') => {
  return cn(
    inputStyles.base,
    error && inputStyles.error,
    disabled && inputStyles.disabled,
    dark && inputStyles.dark,
    className
  );
};

export const buildCardClass = (dark = false, interactive = false, padding = 'md', className = '') => {
  return cn(
    dark ? cardStyles.dark : cardStyles.base,
    interactive && cardStyles.interactive,
    cardStyles.padding[padding],
    className
  );
};

export const buildAvatarClass = (size = 'md', className = '') => {
  return cn(
    avatarStyles.base,
    avatarStyles.sizes[size],
    className
  );
};

export const buildBadgeClass = (variant = 'primary', className = '') => {
  return cn(
    badgeStyles.base,
    badgeStyles.variants[variant],
    className
  );
};

export const buildNotificationClass = (variant = 'info', className = '') => {
  return cn(
    notificationStyles.base,
    notificationStyles.variants[variant],
    className
  );
};

export const buildSpinnerClass = (size = 'md', variant = 'primary', className = '') => {
  return cn(
    spinnerStyles.base,
    spinnerStyles.sizes[size],
    spinnerStyles.variants[variant],
    className
  );
};

// Export all utilities
export default {
  buttonStyles,
  inputStyles,
  cardStyles,
  callStatusStyles,
  avatarStyles,
  badgeStyles,
  notificationStyles,
  spinnerStyles,
  responsiveStyles,
  touchTargetStyles,
  animationStyles,
  buildButtonClass,
  buildInputClass,
  buildCardClass,
  buildAvatarClass,
  buildBadgeClass,
  buildNotificationClass,
  buildSpinnerClass,
};
