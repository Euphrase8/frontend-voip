// Understanding Logger Service
// Tracks user interactions, AI responses, and comprehension metrics

import notificationService from './notificationService';

class UnderstandingLogger {
  constructor() {
    this.isEnabled = true;
    this.debugMode = process.env.NODE_ENV === 'development';
    this.currentContext = {};
    this.interactionSequence = [];
  }

  // Enable/disable understanding logging
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  // Set current context for all logs
  setContext(context) {
    this.currentContext = { ...this.currentContext, ...context };
  }

  // Clear current context
  clearContext() {
    this.currentContext = {};
  }

  // Log user interactions
  logUserInteraction(action, details = {}) {
    if (!this.isEnabled) return;

    const logData = {
      action,
      details: {
        ...details,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        ...this.currentContext
      }
    };

    this.interactionSequence.push({
      type: 'user_interaction',
      ...logData,
      sequenceId: this.interactionSequence.length
    });

    if (this.debugMode) {
      console.log('[Understanding] User Interaction:', logData);
    }

    return notificationService.logUserAction(action, logData.details);
  }

  // Log AI responses and decisions
  logAIResponse(response, confidence = null, reasoning = null) {
    if (!this.isEnabled) return;

    const logData = {
      response,
      confidence,
      reasoning,
      details: {
        timestamp: new Date().toISOString(),
        context: this.currentContext
      }
    };

    this.interactionSequence.push({
      type: 'ai_response',
      ...logData,
      sequenceId: this.interactionSequence.length
    });

    if (this.debugMode) {
      console.log('[Understanding] AI Response:', logData);
    }

    return notificationService.logAIResponse(response, confidence, logData.details);
  }

  // Log comprehension events
  logComprehension(level, event, details = {}) {
    if (!this.isEnabled) return;

    const logData = {
      level, // 'high', 'medium', 'low', 'failed'
      event,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        context: this.currentContext
      }
    };

    this.interactionSequence.push({
      type: 'comprehension',
      ...logData,
      sequenceId: this.interactionSequence.length
    });

    if (this.debugMode) {
      console.log('[Understanding] Comprehension:', logData);
    }

    return notificationService.logComprehension(`${level}: ${event}`, logData.details);
  }

  // Log error recovery attempts
  logErrorRecovery(error, recoveryAction, success = false, details = {}) {
    if (!this.isEnabled) return;

    const logData = {
      error,
      recoveryAction,
      success,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        context: this.currentContext
      }
    };

    this.interactionSequence.push({
      type: 'error_recovery',
      ...logData,
      sequenceId: this.interactionSequence.length
    });

    if (this.debugMode) {
      console.log('[Understanding] Error Recovery:', logData);
    }

    return notificationService.logErrorRecovery(error, recoveryAction, logData.details);
  }

  // Log learning insights
  logLearning(insight, confidence = null, source = 'user_behavior', details = {}) {
    if (!this.isEnabled) return;

    const logData = {
      insight,
      confidence,
      source, // 'user_behavior', 'pattern_recognition', 'feedback', 'analytics'
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        context: this.currentContext
      }
    };

    this.interactionSequence.push({
      type: 'learning',
      ...logData,
      sequenceId: this.interactionSequence.length
    });

    if (this.debugMode) {
      console.log('[Understanding] Learning:', logData);
    }

    return notificationService.logLearning(insight, confidence, logData.details);
  }

  // Log feature usage patterns
  logFeatureUsage(feature, usage, effectiveness = null) {
    return this.logUserInteraction('feature_usage', {
      feature,
      usage,
      effectiveness,
      category: 'feature_analytics'
    });
  }

  // Log user satisfaction/feedback
  logUserFeedback(rating, feedback, category = 'general') {
    return this.logUserInteraction('user_feedback', {
      rating,
      feedback,
      category,
      sentiment: this.analyzeSentiment(feedback)
    });
  }

  // Simple sentiment analysis
  analyzeSentiment(text) {
    if (!text) return 'neutral';
    
    const positiveWords = ['good', 'great', 'excellent', 'love', 'like', 'amazing', 'perfect', 'helpful'];
    const negativeWords = ['bad', 'terrible', 'hate', 'dislike', 'awful', 'horrible', 'useless', 'broken'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Get interaction sequence
  getInteractionSequence() {
    return this.interactionSequence;
  }

  // Clear interaction sequence
  clearInteractionSequence() {
    this.interactionSequence = [];
  }

  // Get understanding metrics
  getMetrics() {
    const sequence = this.interactionSequence;
    const total = sequence.length;
    
    if (total === 0) {
      return {
        totalInteractions: 0,
        userInteractions: 0,
        aiResponses: 0,
        comprehensionEvents: 0,
        errorRecoveries: 0,
        learningEvents: 0,
        averageConfidence: 0,
        successRate: 0
      };
    }

    const userInteractions = sequence.filter(s => s.type === 'user_interaction').length;
    const aiResponses = sequence.filter(s => s.type === 'ai_response').length;
    const comprehensionEvents = sequence.filter(s => s.type === 'comprehension').length;
    const errorRecoveries = sequence.filter(s => s.type === 'error_recovery').length;
    const learningEvents = sequence.filter(s => s.type === 'learning').length;
    
    const confidenceValues = sequence
      .filter(s => s.confidence !== null && s.confidence !== undefined)
      .map(s => s.confidence);
    
    const averageConfidence = confidenceValues.length > 0 
      ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length 
      : 0;

    const successfulRecoveries = sequence
      .filter(s => s.type === 'error_recovery' && s.success === true).length;
    
    const successRate = errorRecoveries > 0 ? successfulRecoveries / errorRecoveries : 1;

    return {
      totalInteractions: total,
      userInteractions,
      aiResponses,
      comprehensionEvents,
      errorRecoveries,
      learningEvents,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      successRate: Math.round(successRate * 100) / 100
    };
  }
}

// Create singleton instance
const understandingLogger = new UnderstandingLogger();

export default understandingLogger;
