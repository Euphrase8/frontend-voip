// Browser compatibility utilities for VoIP application
// Handles HTTP/HTTPS scenarios and provides fallbacks

export const checkBrowserCompatibility = () => {
  const issues = [];
  const warnings = [];
  const recommendations = [];

  // Check WebRTC support
  if (!window.RTCPeerConnection) {
    issues.push('WebRTC is not supported in this browser');
    recommendations.push('Please use a modern browser like Chrome, Firefox, Safari, or Edge');
  }

  // Check WebSocket support
  if (!window.WebSocket) {
    issues.push('WebSocket is not supported in this browser');
    recommendations.push('Please use a modern browser that supports WebSocket');
  }

  // Check getUserMedia support
  const hasModernGetUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  const hasLegacyGetUserMedia = navigator.getUserMedia || 
                               navigator.webkitGetUserMedia || 
                               navigator.mozGetUserMedia || 
                               navigator.msGetUserMedia;

  if (!hasModernGetUserMedia && !hasLegacyGetUserMedia) {
    issues.push('Microphone access is not supported in this browser');
    recommendations.push('Please use a modern browser that supports microphone access');
  }

  // Check secure context
  const isSecureContext = window.isSecureContext || 
                         window.location.protocol === 'https:' || 
                         window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.startsWith('192.168.') ||
                         window.location.hostname.startsWith('10.') ||
                         window.location.hostname.startsWith('172.');

  if (!isSecureContext) {
    warnings.push('Running on HTTP may limit microphone access');
    recommendations.push('For best experience, use HTTPS or access via localhost/IP address');
  }

  // Browser-specific recommendations
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('chrome')) {
    if (!isSecureContext) {
      recommendations.push('Chrome: Use --unsafely-treat-insecure-origin-as-secure flag for HTTP testing');
      recommendations.push('Chrome: Enable "Insecure origins treated as secure" in chrome://flags/');
    }
  } else if (userAgent.includes('firefox')) {
    if (!isSecureContext) {
      recommendations.push('Firefox: Set media.devices.insecure.enabled to true in about:config for HTTP testing');
    }
  } else if (userAgent.includes('safari')) {
    if (!isSecureContext) {
      warnings.push('Safari has strict HTTPS requirements for microphone access');
    }
  }

  return {
    supported: issues.length === 0,
    issues,
    warnings,
    recommendations,
    isSecureContext,
    hasModernGetUserMedia,
    hasLegacyGetUserMedia
  };
};

export const getMediaStreamWithFallback = async (constraints = { audio: true, video: false }) => {
  console.log('[browserCompat] Attempting to get media stream...');
  
  const compat = checkBrowserCompatibility();
  
  if (!compat.supported) {
    throw new Error(`Browser not supported: ${compat.issues.join(', ')}`);
  }

  let stream = null;
  let lastError = null;

  // Method 1: Modern getUserMedia with enhanced constraints
  if (compat.hasModernGetUserMedia) {
    try {
      const enhancedConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...constraints.audio
        },
        video: constraints.video || false
      };
      
      stream = await navigator.mediaDevices.getUserMedia(enhancedConstraints);
      console.log('[browserCompat] Enhanced getUserMedia successful');
      return stream;
    } catch (error) {
      console.warn('[browserCompat] Enhanced getUserMedia failed:', error);
      lastError = error;
      
      // Try basic constraints
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('[browserCompat] Basic getUserMedia successful');
        return stream;
      } catch (basicError) {
        console.warn('[browserCompat] Basic getUserMedia failed:', basicError);
        lastError = basicError;
      }
    }
  }

  // Method 2: Legacy getUserMedia fallback
  if (compat.hasLegacyGetUserMedia && !stream) {
    const getUserMedia = navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia;

    try {
      console.log('[browserCompat] Trying legacy getUserMedia...');
      stream = await new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
      console.log('[browserCompat] Legacy getUserMedia successful');
      return stream;
    } catch (legacyError) {
      console.warn('[browserCompat] Legacy getUserMedia failed:', legacyError);
      lastError = legacyError;
    }
  }

  // If all methods failed, provide helpful error message
  if (!stream && lastError) {
    let errorMessage = 'Failed to access microphone';
    
    if (lastError.name === 'NotAllowedError') {
      if (!compat.isSecureContext) {
        errorMessage = `Microphone access denied. HTTP sites have limited access.\n\nRecommendations:\n${compat.recommendations.join('\n')}`;
      } else {
        errorMessage = 'Microphone access denied. Please allow microphone access in your browser.';
      }
    } else if (lastError.name === 'NotFoundError') {
      errorMessage = 'No microphone found. Please connect a microphone and try again.';
    } else if (lastError.name === 'NotSupportedError') {
      errorMessage = 'Your browser does not support audio calls. Please use a modern browser.';
    } else if (lastError.name === 'NotReadableError') {
      errorMessage = 'Microphone is being used by another application. Please close other apps using the microphone.';
    } else {
      errorMessage = `Failed to access microphone: ${lastError.message}`;
      
      if (!compat.isSecureContext && compat.recommendations.length > 0) {
        errorMessage += `\n\nRecommendations:\n${compat.recommendations.join('\n')}`;
      }
    }
    
    throw new Error(errorMessage);
  }

  throw new Error('Unable to access microphone with any available method');
};

export const showBrowserCompatibilityInfo = () => {
  const compat = checkBrowserCompatibility();
  
  console.group('🔍 Browser Compatibility Check');
  console.log('Supported:', compat.supported);
  console.log('Secure Context:', compat.isSecureContext);
  console.log('Modern getUserMedia:', compat.hasModernGetUserMedia);
  console.log('Legacy getUserMedia:', compat.hasLegacyGetUserMedia);
  
  if (compat.issues.length > 0) {
    console.error('Issues:', compat.issues);
  }
  
  if (compat.warnings.length > 0) {
    console.warn('Warnings:', compat.warnings);
  }
  
  if (compat.recommendations.length > 0) {
    console.info('Recommendations:', compat.recommendations);
  }
  
  console.groupEnd();
  
  return compat;
};

// Auto-run compatibility check on import
if (typeof window !== 'undefined') {
  // Run check after a short delay to ensure DOM is ready
  setTimeout(() => {
    showBrowserCompatibilityInfo();
  }, 100);
}
