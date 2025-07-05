import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/ui';

const MetricsChart = ({
  data = [],
  title,
  color = 'bg-primary-500',
  darkMode,
  height = 100,
  showGrid = true,
  showValues = false,
  unit = '%'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={cn(
        'p-4 rounded-lg border',
        darkMode
          ? 'bg-secondary-700 border-secondary-600'
          : 'bg-secondary-50 border-secondary-200'
      )}>
        <h4 className={cn(
          'text-sm font-medium mb-3',
          darkMode ? 'text-white' : 'text-secondary-900'
        )}>
          {title}
        </h4>
        <div className={cn(
          'flex items-center justify-center h-24',
          darkMode ? 'text-secondary-400' : 'text-secondary-500'
        )}>
          <span className="text-sm">No data available</span>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 100);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;
  
  const currentValue = data[data.length - 1]?.value || 0;
  const previousValue = data[data.length - 2]?.value || 0;
  const trend = currentValue - previousValue;

  const getColorClass = (value) => {
    if (value >= 90) return 'text-danger-500';
    if (value >= 75) return 'text-warning-500';
    if (value >= 50) return 'text-primary-500';
    return 'text-success-500';
  };

  const getBarColor = (value) => {
    if (value >= 90) return 'bg-danger-500';
    if (value >= 75) return 'bg-warning-500';
    if (value >= 50) return 'bg-primary-500';
    return 'bg-success-500';
  };

  const getTrendIcon = () => {
    if (trend > 0) return '↗';
    if (trend < 0) return '↘';
    return '→';
  };

  const getTrendColor = () => {
    if (trend > 0) return 'text-danger-500';
    if (trend < 0) return 'text-success-500';
    return 'text-secondary-500';
  };

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      darkMode
        ? 'bg-secondary-700 border-secondary-600'
        : 'bg-secondary-50 border-secondary-200'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className={cn(
          'text-sm font-medium',
          darkMode ? 'text-white' : 'text-secondary-900'
        )}>
          {title}
        </h4>
        <div className="flex items-center space-x-2">
          <span className={cn(
            'text-lg font-bold',
            getColorClass(currentValue)
          )}>
            {Math.round(currentValue)}{unit}
          </span>
          {trend !== 0 && (
            <span className={cn(
              'text-xs font-medium',
              getTrendColor()
            )}>
              {getTrendIcon()} {Math.abs(trend).toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: `${height}px` }}>
        {/* Grid lines */}
        {showGrid && (
          <div className="absolute inset-0">
            {[25, 50, 75].map(percentage => (
              <div
                key={percentage}
                className={cn(
                  'absolute w-full border-t border-dashed',
                  darkMode ? 'border-secondary-600' : 'border-secondary-300'
                )}
                style={{ top: `${100 - percentage}%` }}
              />
            ))}
          </div>
        )}

        {/* Chart bars */}
        <div className="flex items-end justify-between h-full space-x-1">
          {data.slice(-20).map((point, index) => {
            const heightPercentage = ((point.value - minValue) / range) * 100;
            const isLast = index === data.slice(-20).length - 1;
            
            return (
              <motion.div
                key={point.timestamp || index}
                initial={{ height: 0 }}
                animate={{ height: `${heightPercentage}%` }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                className={cn(
                  'flex-1 rounded-t transition-all duration-200 hover:opacity-80 cursor-pointer',
                  getBarColor(point.value),
                  isLast ? 'opacity-100' : 'opacity-70'
                )}
                style={{
                  minHeight: '2px',
                  maxWidth: '20px'
                }}
                title={`${Math.round(point.value)}${unit} at ${new Date(point.timestamp).toLocaleTimeString()}`}
              />
            );
          })}
        </div>

        {/* Value labels */}
        {showValues && (
          <div className="absolute inset-0 flex items-end justify-between">
            {data.slice(-20).map((point, index) => {
              if (index % 4 !== 0) return null; // Show every 4th value
              
              return (
                <div
                  key={point.timestamp || index}
                  className={cn(
                    'text-xs font-medium transform -translate-x-1/2',
                    darkMode ? 'text-secondary-300' : 'text-secondary-600'
                  )}
                  style={{ marginBottom: `${((point.value - minValue) / range) * 100}%` }}
                >
                  {Math.round(point.value)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Time labels */}
      <div className="flex justify-between mt-2">
        <span className={cn(
          'text-xs',
          darkMode ? 'text-secondary-400' : 'text-secondary-500'
        )}>
          {data.length > 0 ? new Date(data[0].timestamp).toLocaleTimeString() : ''}
        </span>
        <span className={cn(
          'text-xs',
          darkMode ? 'text-secondary-400' : 'text-secondary-500'
        )}>
          Now
        </span>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-secondary-200 dark:border-secondary-600">
        <div className="text-center">
          <div className={cn(
            'text-xs font-medium',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            {Math.round(Math.min(...data.map(d => d.value)))}{unit}
          </div>
          <div className={cn(
            'text-xs',
            darkMode ? 'text-secondary-400' : 'text-secondary-500'
          )}>
            Min
          </div>
        </div>
        <div className="text-center">
          <div className={cn(
            'text-xs font-medium',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            {Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length)}{unit}
          </div>
          <div className={cn(
            'text-xs',
            darkMode ? 'text-secondary-400' : 'text-secondary-500'
          )}>
            Avg
          </div>
        </div>
        <div className="text-center">
          <div className={cn(
            'text-xs font-medium',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            {Math.round(Math.max(...data.map(d => d.value)))}{unit}
          </div>
          <div className={cn(
            'text-xs',
            darkMode ? 'text-secondary-400' : 'text-secondary-500'
          )}>
            Max
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsChart;
