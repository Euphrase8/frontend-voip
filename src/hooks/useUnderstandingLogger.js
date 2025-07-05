// React Hook for Understanding Logger Integration
// Automatically tracks user interactions and provides logging utilities

import { useEffect, useCallback, useRef } from 'react';
import understandingLogger from '../utils/understandingLogger';

export const useUnderstandingLogger = (context = {}) => {
  const contextRef = useRef(context);
  const interactionStartTime = useRef(null);

  // Update context when it changes
  useEffect(() => {
    contextRef.current = context;
    understandingLogger.setContext(context);
  }, [context]);

  // Log page/component mount
  useEffect(() => {
    if (context.page || context.component) {
      understandingLogger.logUserInteraction('page_view', {
        page: context.page,
        component: context.component,
        timestamp: new Date().toISOString(),
        ...context
      });
    }

    return () => {
      // Log page/component unmount
      if (context.page || context.component) {
        understandingLogger.logUserInteraction('page_leave', {
          page: context.page,
          component: context.component,
          timestamp: new Date().toISOString(),
          duration: interactionStartTime.current 
            ? Date.now() - interactionStartTime.current 
            : null,
          ...context
        });
      }
    };
  }, [context.page, context.component]);

  // Track interaction start time
  useEffect(() => {
    interactionStartTime.current = Date.now();
  }, []);

  // Logging functions
  const logUserAction = useCallback((action, details = {}) => {
    return understandingLogger.logUserInteraction(action, {
      ...details,
      ...contextRef.current
    });
  }, []);

  const logAIResponse = useCallback((response, confidence = null, reasoning = null) => {
    return understandingLogger.logAIResponse(response, confidence, reasoning);
  }, []);

  const logComprehension = useCallback((level, event, details = {}) => {
    return understandingLogger.logComprehension(level, event, {
      ...details,
      ...contextRef.current
    });
  }, []);

  const logError = useCallback((error, recoveryAction = null, success = false, details = {}) => {
    return understandingLogger.logErrorRecovery(error, recoveryAction, success, {
      ...details,
      ...contextRef.current
    });
  }, []);

  const logLearning = useCallback((insight, confidence = null, source = 'user_behavior', details = {}) => {
    return understandingLogger.logLearning(insight, confidence, source, {
      ...details,
      ...contextRef.current
    });
  }, []);

  const logFeatureUsage = useCallback((feature, usage, effectiveness = null) => {
    return understandingLogger.logFeatureUsage(feature, usage, effectiveness);
  }, []);

  const logFeedback = useCallback((rating, feedback, category = 'general') => {
    return understandingLogger.logUserFeedback(rating, feedback, category);
  }, []);

  // Auto-track common interactions
  const trackClick = useCallback((element, details = {}) => {
    return logUserAction('click', {
      element,
      timestamp: Date.now(),
      ...details
    });
  }, [logUserAction]);

  const trackNavigation = useCallback((from, to, method = 'unknown') => {
    return logUserAction('navigation', {
      from,
      to,
      method,
      timestamp: Date.now()
    });
  }, [logUserAction]);

  const trackSearch = useCallback((query, resultsCount = null, selectedResult = null) => {
    return logUserAction('search', {
      query,
      resultsCount,
      selectedResult,
      timestamp: Date.now()
    });
  }, [logUserAction]);

  const trackFormSubmission = useCallback((formType, success = true, errors = null) => {
    return logUserAction('form_submission', {
      formType,
      success,
      errors,
      timestamp: Date.now()
    });
  }, [logUserAction]);

  const trackCallAction = useCallback((action, targetExtension = null, duration = null) => {
    return logUserAction('call_action', {
      action, // 'initiate', 'answer', 'hangup', 'hold', 'transfer'
      targetExtension,
      duration,
      timestamp: Date.now()
    });
  }, [logUserAction]);

  // Performance tracking
  const trackPerformance = useCallback((metric, value, context = {}) => {
    return logUserAction('performance_metric', {
      metric,
      value,
      context,
      timestamp: Date.now()
    });
  }, [logUserAction]);

  // Error tracking
  const trackError = useCallback((error, context = {}, recovered = false) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : null;
    
    return logError(errorMessage, recovered ? 'user_recovered' : 'unresolved', recovered, {
      errorStack,
      context,
      timestamp: Date.now()
    });
  }, [logError]);

  return {
    // Basic logging functions
    logUserAction,
    logAIResponse,
    logComprehension,
    logError,
    logLearning,
    logFeatureUsage,
    logFeedback,
    
    // Convenience tracking functions
    trackClick,
    trackNavigation,
    trackSearch,
    trackFormSubmission,
    trackCallAction,
    trackPerformance,
    trackError,
    
    // Utility functions
    setContext: understandingLogger.setContext.bind(understandingLogger),
    clearContext: understandingLogger.clearContext.bind(understandingLogger),
    getMetrics: understandingLogger.getMetrics.bind(understandingLogger)
  };
};

// Higher-order component for automatic page tracking
export const withUnderstandingLogger = (WrappedComponent, pageContext = {}) => {
  return function UnderstandingLoggerWrapper(props) {
    const logger = useUnderstandingLogger(pageContext);
    
    return (
      <WrappedComponent 
        {...props} 
        understandingLogger={logger}
      />
    );
  };
};

// Hook for tracking specific interactions with automatic cleanup
export const useInteractionTracker = (interactionType, autoTrack = true) => {
  const logger = useUnderstandingLogger();
  const startTime = useRef(null);

  const startTracking = useCallback((details = {}) => {
    startTime.current = Date.now();
    if (autoTrack) {
      logger.logUserAction(`${interactionType}_start`, {
        ...details,
        timestamp: startTime.current
      });
    }
  }, [logger, interactionType, autoTrack]);

  const endTracking = useCallback((details = {}) => {
    const endTime = Date.now();
    const duration = startTime.current ? endTime - startTime.current : null;
    
    if (autoTrack) {
      logger.logUserAction(`${interactionType}_end`, {
        ...details,
        duration,
        timestamp: endTime
      });
    }
    
    startTime.current = null;
    return duration;
  }, [logger, interactionType, autoTrack]);

  return {
    startTracking,
    endTracking,
    isTracking: startTime.current !== null,
    ...logger
  };
};

export default useUnderstandingLogger;
