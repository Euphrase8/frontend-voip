// Toast Utilities
// Enhanced toast functionality with additional methods for react-hot-toast

import toast from 'react-hot-toast';

// Add missing methods to toast object
const enhanceToast = () => {
  // Add warning method if it doesn't exist
  if (!toast.warning) {
    toast.warning = (message, options = {}) => {
      return toast(message, {
        icon: '⚠️',
        style: {
          borderLeft: '4px solid #f59e0b',
          background: '#fef3c7',
          color: '#92400e',
          ...options.style
        },
        duration: 4000,
        ...options
      });
    };
  }

  // Add info method if it doesn't exist
  if (!toast.info) {
    toast.info = (message, options = {}) => {
      return toast(message, {
        icon: 'ℹ️',
        style: {
          borderLeft: '4px solid #3b82f6',
          background: '#dbeafe',
          color: '#1e40af',
          ...options.style
        },
        duration: 4000,
        ...options
      });
    };
  }

  // Add custom method for system health warnings
  if (!toast.healthWarning) {
    toast.healthWarning = (message, options = {}) => {
      return toast(message, {
        icon: '🏥',
        style: {
          borderLeft: '4px solid #f59e0b',
          background: '#fef3c7',
          color: '#92400e',
          ...options.style
        },
        duration: 6000,
        ...options
      });
    };
  }

  // Add custom method for call notifications
  if (!toast.call) {
    toast.call = (message, options = {}) => {
      return toast(message, {
        icon: '📞',
        style: {
          borderLeft: '4px solid #10b981',
          background: '#d1fae5',
          color: '#065f46',
          ...options.style
        },
        duration: 5000,
        ...options
      });
    };
  }

  // Add custom method for microphone issues
  if (!toast.microphone) {
    toast.microphone = (message, options = {}) => {
      return toast(message, {
        icon: '🎤',
        style: {
          borderLeft: '4px solid #ef4444',
          background: '#fee2e2',
          color: '#991b1b',
          ...options.style
        },
        duration: 5000,
        ...options
      });
    };
  }

  // Add custom method for network issues
  if (!toast.network) {
    toast.network = (message, options = {}) => {
      return toast(message, {
        icon: '🌐',
        style: {
          borderLeft: '4px solid #f59e0b',
          background: '#fef3c7',
          color: '#92400e',
          ...options.style
        },
        duration: 5000,
        ...options
      });
    };
  }

  return toast;
};

// Enhanced toast with all methods
const enhancedToast = enhanceToast();

// Predefined toast configurations
export const toastConfig = {
  success: {
    icon: '✅',
    style: {
      borderLeft: '4px solid #10b981',
      background: '#d1fae5',
      color: '#065f46'
    },
    duration: 3000
  },
  error: {
    icon: '❌',
    style: {
      borderLeft: '4px solid #ef4444',
      background: '#fee2e2',
      color: '#991b1b'
    },
    duration: 5000
  },
  warning: {
    icon: '⚠️',
    style: {
      borderLeft: '4px solid #f59e0b',
      background: '#fef3c7',
      color: '#92400e'
    },
    duration: 4000
  },
  info: {
    icon: 'ℹ️',
    style: {
      borderLeft: '4px solid #3b82f6',
      background: '#dbeafe',
      color: '#1e40af'
    },
    duration: 4000
  }
};

// Utility functions for common toast patterns
export const showToast = {
  success: (message, options = {}) => enhancedToast.success(message, { ...toastConfig.success, ...options }),
  error: (message, options = {}) => enhancedToast.error(message, { ...toastConfig.error, ...options }),
  warning: (message, options = {}) => enhancedToast.warning(message, { ...toastConfig.warning, ...options }),
  info: (message, options = {}) => enhancedToast.info(message, { ...toastConfig.info, ...options }),
  call: (message, options = {}) => enhancedToast.call(message, options),
  microphone: (message, options = {}) => enhancedToast.microphone(message, options),
  network: (message, options = {}) => enhancedToast.network(message, options),
  healthWarning: (message, options = {}) => enhancedToast.healthWarning(message, options)
};

// System health specific toasts
export const healthToast = {
  cpuHigh: (usage) => showToast.healthWarning(`⚠️ High CPU usage: ${usage}%`),
  memoryHigh: (usage) => showToast.healthWarning(`⚠️ High memory usage: ${usage}%`),
  diskHigh: (usage) => showToast.healthWarning(`⚠️ High disk usage: ${usage}%`),
  serviceDown: (service) => showToast.error(`❌ ${service} service is down`),
  serviceUnhealthy: (service) => showToast.warning(`⚠️ ${service} service is unhealthy`),
  systemHealthy: () => showToast.success('✅ All systems are healthy'),
  updateFailed: (error) => showToast.error(`Failed to update system health: ${error}`)
};

// Call related toasts
export const callToast = {
  connected: (extension) => showToast.call(`📞 Connected to ${extension}`),
  disconnected: () => showToast.info('📞 Call ended'),
  failed: (error) => showToast.error(`❌ Call failed: ${error}`),
  incoming: (caller) => showToast.call(`📞 Incoming call from ${caller}`),
  microphoneIssue: () => showToast.microphone('🎤 Microphone access required'),
  networkIssue: () => showToast.network('🌐 Network connection issue')
};

// Initialize enhanced toast on import
enhanceToast();

export default enhancedToast;
