import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiAlertTriangle as AlertTriangle, 
  FiInfo as Info, 
  FiX as X,
  FiChrome as Chrome,
  FiGlobe as Globe
} from 'react-icons/fi';
import { checkBrowserCompatibility } from '../utils/browserCompat';
import { cn } from '../utils/ui';

const BrowserCompatibilityAlert = ({ darkMode = false }) => {
  const [compatibility, setCompatibility] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      const compat = checkBrowserCompatibility();
      setCompatibility(compat);

      // Only show alert for critical issues or if user is on HTTP
      const dismissed = localStorage.getItem('browserCompatDismissed');
      const criticalIssues = compat.issues.filter(issue =>
        issue.includes('Not running in a browser environment') ||
        issue.includes('WebSocket is not supported')
      );

      if (!dismissed && (criticalIssues.length > 0 || (!compat.isSecureContext && compat.warnings.length > 0))) {
        setIsVisible(true);
      }
    } catch (error) {
      console.warn('[BrowserCompatibilityAlert] Error checking compatibility:', error);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('browserCompatDismissed', 'true');
  };

  const handleShowAgain = () => {
    localStorage.removeItem('browserCompatDismissed');
    const compat = checkBrowserCompatibility();
    setCompatibility(compat);
    if (compat.issues.length > 0 || compat.warnings.length > 0) {
      setIsVisible(true);
      setIsDismissed(false);
    }
  };

  if (!compatibility || isDismissed) {
    return null;
  }

  const hasIssues = compatibility.issues.length > 0;
  const hasWarnings = compatibility.warnings.length > 0;

  if (!hasIssues && !hasWarnings) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 z-50 max-w-2xl mx-auto"
          >
            <div className={cn(
              "rounded-lg shadow-lg border-2 p-4",
              hasIssues 
                ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                : "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
            )}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {hasIssues ? (
                    <AlertTriangle className={cn(
                      "w-6 h-6",
                      "text-red-600 dark:text-red-400"
                    )} />
                  ) : (
                    <Info className={cn(
                      "w-6 h-6",
                      "text-yellow-600 dark:text-yellow-400"
                    )} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "text-sm font-semibold mb-2",
                    hasIssues 
                      ? "text-red-800 dark:text-red-200"
                      : "text-yellow-800 dark:text-yellow-200"
                  )}>
                    {hasIssues ? 'Browser Compatibility Issues' : 'Browser Compatibility Warnings'}
                  </h3>
                  
                  {compatibility.issues.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-1">
                        Issues:
                      </p>
                      <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                        {compatibility.issues.map((issue, index) => (
                          <li key={index} className="flex items-start space-x-1">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {compatibility.warnings.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium mb-1">
                        Warnings:
                      </p>
                      <ul className="text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
                        {compatibility.warnings.map((warning, index) => (
                          <li key={index} className="flex items-start space-x-1">
                            <span className="text-yellow-500 mt-0.5">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {compatibility.recommendations.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Recommendations:
                      </p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {compatibility.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-1">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Quick action buttons for HTTP scenarios */}
                  {!compatibility.isSecureContext && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => window.open('chrome://flags/#unsafely-treat-insecure-origin-as-secure', '_blank')}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs rounded-md transition-colors"
                      >
                        <Chrome className="w-3 h-3" />
                        <span>Chrome Flags</span>
                      </button>
                      
                      <button
                        onClick={() => window.open('about:config', '_blank')}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs rounded-md transition-colors"
                      >
                        <Globe className="w-3 h-3" />
                        <span>Firefox Config</span>
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleDismiss}
                  className={cn(
                    "flex-shrink-0 p-1 rounded-md transition-colors",
                    hasIssues
                      ? "text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-800"
                      : "text-yellow-400 hover:text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-800"
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show again button when dismissed */}
      {isDismissed && (hasIssues || hasWarnings) && (
        <button
          onClick={handleShowAgain}
          className="fixed bottom-4 right-4 z-40 p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-lg transition-colors"
          title="Show browser compatibility info"
        >
          <Info className="w-4 h-4" />
        </button>
      )}
    </>
  );
};

export default BrowserCompatibilityAlert;
