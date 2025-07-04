import React from 'react';
import { cn } from '../utils/ui';
import { responsiveStyles } from '../utils/styling';

// Main responsive container component
export const ResponsiveContainer = ({ 
  children, 
  size = 'full', 
  padding = 'page',
  className = '',
  ...props 
}) => {
  return (
    <div 
      className={cn(
        responsiveStyles.container[size],
        responsiveStyles.padding[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Responsive grid component
export const ResponsiveGrid = ({ 
  children, 
  type = 'responsive', 
  spacing = 'grid',
  className = '',
  ...props 
}) => {
  return (
    <div 
      className={cn(
        responsiveStyles.grid[type],
        responsiveStyles.spacing[spacing],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Responsive card component
export const ResponsiveCard = ({ 
  children, 
  padding = 'card',
  interactive = false,
  dark = false,
  className = '',
  ...props 
}) => {
  return (
    <div 
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700',
        responsiveStyles.padding[padding],
        responsiveStyles.height.card,
        interactive && 'hover:shadow-lg transition-shadow duration-200 cursor-pointer',
        dark && 'bg-gray-800 border-gray-700',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Professional text component
export const ResponsiveText = ({
  children,
  variant = 'bodyMedium',
  className = '',
  as: Component = 'p',
  weight = 'normal',
  color = 'default',
  ...props
}) => {
  const weightClasses = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  const colorClasses = {
    default: '',
    muted: 'text-gray-600 dark:text-gray-400',
    primary: 'text-primary-600 dark:text-primary-400',
    secondary: 'text-secondary-600 dark:text-secondary-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
  };

  return (
    <Component
      className={cn(
        responsiveStyles.text[variant],
        weightClasses[weight],
        colorClasses[color],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

// Professional button component
export const ResponsiveButton = ({
  children,
  size = 'md',
  variant = 'primary',
  fullWidth = false,
  rounded = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

  const sizeClasses = {
    xs: 'px-2 py-1.5 text-xs h-8 sm:h-9',
    sm: 'px-3 py-2 text-sm h-9 sm:h-10 md:h-11',
    md: 'px-4 py-2.5 text-base h-10 sm:h-11 md:h-12',
    lg: 'px-6 py-3 text-lg h-12 sm:h-13 md:h-14',
    xl: 'px-8 py-4 text-xl h-14 sm:h-15 md:h-16',
  };

  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white focus:ring-primary-500 shadow-sm hover:shadow-md',
    secondary: 'bg-secondary-100 hover:bg-secondary-200 active:bg-secondary-300 text-secondary-900 focus:ring-secondary-500 border border-secondary-300',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500',
    ghost: 'text-primary-600 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white focus:ring-red-500 shadow-sm hover:shadow-md',
    success: 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white focus:ring-green-500 shadow-sm hover:shadow-md',
  };

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  return (
    <button
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        roundedClasses[rounded],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// Responsive flex container
export const ResponsiveFlex = ({ 
  children, 
  direction = 'row',
  align = 'center',
  justify = 'start',
  wrap = false,
  spacing = 'inline',
  className = '',
  ...props 
}) => {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'col-reverse': 'flex-col-reverse',
  };
  
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };
  
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };
  
  return (
    <div 
      className={cn(
        'flex',
        directionClasses[direction],
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        direction === 'row' ? responsiveStyles.spacing.inline : responsiveStyles.spacing.items,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Responsive page layout
export const ResponsivePageLayout = ({ 
  children, 
  title,
  subtitle,
  actions,
  sidebar,
  className = '',
  ...props 
}) => {
  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900', className)} {...props}>
      {/* Header */}
      {(title || subtitle || actions) && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <ResponsiveContainer padding="section">
            <ResponsiveFlex justify="between" align="center">
              <div>
                {title && (
                  <ResponsiveText variant="heading" as="h1">
                    {title}
                  </ResponsiveText>
                )}
                {subtitle && (
                  <ResponsiveText variant="caption" className="mt-1">
                    {subtitle}
                  </ResponsiveText>
                )}
              </div>
              {actions && (
                <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                  {actions}
                </div>
              )}
            </ResponsiveFlex>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* Main content */}
      <div className="flex-1">
        {sidebar ? (
          <ResponsiveFlex direction="row" align="start" className="min-h-screen">
            {/* Sidebar */}
            <div className="hidden lg:block lg:w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
              {sidebar}
            </div>
            
            {/* Content */}
            <div className="flex-1">
              <ResponsiveContainer>
                {children}
              </ResponsiveContainer>
            </div>
          </ResponsiveFlex>
        ) : (
          <ResponsiveContainer>
            {children}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// Export all components
export default {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveCard,
  ResponsiveText,
  ResponsiveButton,
  ResponsiveFlex,
  ResponsivePageLayout,
};
