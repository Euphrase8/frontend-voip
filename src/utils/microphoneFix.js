// Enhanced Microphone Fix Utility
// Comprehensive solution for microphone access issues in VoIP applications

export class MicrophoneFix {
  constructor() {
    this.isHTTPS = window.location.protocol === 'https:';
    this.isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
    this.browserInfo = this.detectBrowser();
  }

  // Detect browser type and version
  detectBrowser() {
    const userAgent = navigator.userAgent;
    let browser = 'unknown';
    let version = 'unknown';

    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser = 'chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'unknown';
    } else if (userAgent.includes('Firefox')) {
      browser = 'firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'unknown';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? match[1] : 'unknown';
    } else if (userAgent.includes('Edg')) {
      browser = 'edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      version = match ? match[1] : 'unknown';
    }

    return { browser, version };
  }

  // Comprehensive microphone access with multiple fallback methods
  async requestMicrophoneAccess() {
    console.log('[MicrophoneFix] Starting comprehensive microphone access...');
    
    const results = {
      success: false,
      method: null,
      stream: null,
      error: null,
      recommendations: []
    };

    // Method 1: Modern getUserMedia with optimal constraints
    try {
      console.log('[MicrophoneFix] Trying modern getUserMedia...');
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        },
        video: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      results.success = true;
      results.method = 'modern_getUserMedia';
      results.stream = stream;
      console.log('[MicrophoneFix] ✅ Modern getUserMedia successful');
      return results;
    } catch (error) {
      console.warn('[MicrophoneFix] Modern getUserMedia failed:', error);
    }

    // Method 2: Basic getUserMedia with minimal constraints
    try {
      console.log('[MicrophoneFix] Trying basic getUserMedia...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      results.success = true;
      results.method = 'basic_getUserMedia';
      results.stream = stream;
      console.log('[MicrophoneFix] ✅ Basic getUserMedia successful');
      return results;
    } catch (error) {
      console.warn('[MicrophoneFix] Basic getUserMedia failed:', error);
      results.error = error;
    }

    // Method 3: Legacy getUserMedia fallback
    try {
      console.log('[MicrophoneFix] Trying legacy getUserMedia...');
      const getUserMedia = navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia;

      if (getUserMedia) {
        const stream = await new Promise((resolve, reject) => {
          getUserMedia.call(navigator, { audio: true, video: false }, resolve, reject);
        });
        results.success = true;
        results.method = 'legacy_getUserMedia';
        results.stream = stream;
        console.log('[MicrophoneFix] ✅ Legacy getUserMedia successful');
        return results;
      }
    } catch (error) {
      console.warn('[MicrophoneFix] Legacy getUserMedia failed:', error);
    }

    // If all methods failed, provide detailed recommendations
    results.recommendations = this.getRecommendations(results.error);
    return results;
  }

  // Get specific recommendations based on error and browser
  getRecommendations(error) {
    const recommendations = [];

    if (!error) {
      recommendations.push('getUserMedia is not supported in this browser');
      recommendations.push('Please use a modern browser like Chrome, Firefox, Safari, or Edge');
      return recommendations;
    }

    switch (error.name) {
      case 'NotAllowedError':
        recommendations.push('Microphone permission was denied');
        recommendations.push('Click the microphone icon in the address bar and allow access');
        recommendations.push('Check browser settings: Settings > Privacy > Microphone');
        if (this.browserInfo.browser === 'chrome') {
          recommendations.push('Chrome: Go to chrome://settings/content/microphone');
        } else if (this.browserInfo.browser === 'firefox') {
          recommendations.push('Firefox: Go to about:preferences#privacy');
        }
        break;

      case 'NotFoundError':
        recommendations.push('No microphone device found');
        recommendations.push('Connect a microphone or headset');
        recommendations.push('Check device manager for audio devices');
        recommendations.push('Try refreshing the page after connecting microphone');
        break;

      case 'NotReadableError':
        recommendations.push('Microphone is being used by another application');
        recommendations.push('Close other applications that might be using the microphone');
        recommendations.push('Restart your browser');
        recommendations.push('Check if Zoom, Teams, or other apps are running');
        break;

      case 'OverconstrainedError':
        recommendations.push('Microphone constraints are too restrictive');
        recommendations.push('Your microphone may not support the requested settings');
        recommendations.push('Try using a different microphone');
        break;

      case 'SecurityError':
        if (!this.isHTTPS && !this.isLocalhost) {
          recommendations.push('HTTPS is required for microphone access');
          recommendations.push('Use HTTPS version of the site');
          recommendations.push('Or access via localhost for testing');
        } else {
          recommendations.push('Security policy blocks microphone access');
          recommendations.push('Check browser security settings');
        }
        break;

      default:
        recommendations.push(`Unknown error: ${error.message}`);
        recommendations.push('Try refreshing the page');
        recommendations.push('Try a different browser');
        break;
    }

    // Add browser-specific recommendations
    if (!this.isHTTPS && !this.isLocalhost) {
      if (this.browserInfo.browser === 'chrome') {
        recommendations.push('Chrome: Use --unsafely-treat-insecure-origin-as-secure flag for testing');
      }
    }

    return recommendations;
  }

  // Test microphone with audio level detection
  async testMicrophoneLevel(stream, duration = 3000) {
    return new Promise((resolve) => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        microphone.connect(analyser);
        analyser.fftSize = 256;

        let maxLevel = 0;
        let avgLevel = 0;
        let samples = 0;

        const checkLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const level = Math.max(...dataArray);
          maxLevel = Math.max(maxLevel, level);
          avgLevel = (avgLevel * samples + level) / (samples + 1);
          samples++;
        };

        const interval = setInterval(checkLevel, 100);

        setTimeout(() => {
          clearInterval(interval);
          audioContext.close();
          
          resolve({
            maxLevel,
            avgLevel: Math.round(avgLevel),
            samples,
            isWorking: maxLevel > 10, // Threshold for detecting audio
            quality: maxLevel > 50 ? 'good' : maxLevel > 20 ? 'fair' : 'poor'
          });
        }, duration);
      } catch (error) {
        console.error('[MicrophoneFix] Audio level test failed:', error);
        resolve({
          maxLevel: 0,
          avgLevel: 0,
          samples: 0,
          isWorking: false,
          quality: 'unknown',
          error: error.message
        });
      }
    });
  }

  // Check microphone permissions status
  async checkPermissionStatus() {
    try {
      if (!navigator.permissions || !navigator.permissions.query) {
        return { state: 'unknown', supported: false };
      }

      const permission = await navigator.permissions.query({ name: 'microphone' });
      return { 
        state: permission.state, 
        supported: true,
        description: this.getPermissionDescription(permission.state)
      };
    } catch (error) {
      return { 
        state: 'unknown', 
        supported: false, 
        error: error.message 
      };
    }
  }

  getPermissionDescription(state) {
    switch (state) {
      case 'granted':
        return 'Microphone access is allowed';
      case 'denied':
        return 'Microphone access is blocked';
      case 'prompt':
        return 'Browser will ask for microphone permission';
      default:
        return 'Permission status unknown';
    }
  }

  // Generate user-friendly fix instructions
  generateFixInstructions(error, browserInfo = this.browserInfo) {
    const instructions = {
      title: 'Microphone Access Fix',
      steps: [],
      browserSpecific: [],
      technical: []
    };

    if (!error) {
      instructions.title = 'Browser Compatibility Issue';
      instructions.steps = [
        'Your browser does not support microphone access',
        'Please use a modern browser like Chrome, Firefox, Safari, or Edge',
        'Make sure your browser is up to date'
      ];
      return instructions;
    }

    switch (error.name) {
      case 'NotAllowedError':
        instructions.title = 'Microphone Permission Denied';
        instructions.steps = [
          'Look for a microphone icon in your browser\'s address bar',
          'Click the icon and select "Allow" for microphone access',
          'Refresh the page and try again'
        ];

        if (browserInfo.browser === 'chrome') {
          instructions.browserSpecific = [
            'Chrome: Go to Settings > Privacy and security > Site Settings > Microphone',
            'Find this website and change permission to "Allow"',
            'Or go to chrome://settings/content/microphone'
          ];
        } else if (browserInfo.browser === 'firefox') {
          instructions.browserSpecific = [
            'Firefox: Go to Preferences > Privacy & Security > Permissions',
            'Click "Settings" next to Microphone',
            'Find this website and change status to "Allow"'
          ];
        }
        break;

      case 'NotFoundError':
        instructions.title = 'No Microphone Found';
        instructions.steps = [
          'Connect a microphone or headset to your computer',
          'Check that your microphone is properly connected',
          'Test your microphone in system settings',
          'Refresh the page after connecting the microphone'
        ];
        break;

      case 'NotReadableError':
        instructions.title = 'Microphone In Use';
        instructions.steps = [
          'Close other applications that might be using your microphone',
          'Check for Zoom, Teams, Skype, or other video call apps',
          'Restart your browser',
          'Try again after closing other apps'
        ];
        break;

      default:
        instructions.title = 'Microphone Access Error';
        instructions.steps = [
          'Refresh the page and try again',
          'Check your browser settings for microphone permissions',
          'Try using a different browser',
          'Restart your browser and try again'
        ];
        break;
    }

    // Add HTTPS recommendation if needed
    if (!this.isHTTPS && !this.isLocalhost) {
      instructions.technical = [
        'This site is using HTTP instead of HTTPS',
        'Modern browsers require HTTPS for microphone access',
        'Contact the site administrator to enable HTTPS'
      ];
    }

    return instructions;
  }
}

// Export convenience functions
export const microphoneFix = new MicrophoneFix();

export async function fixMicrophoneAccess() {
  return await microphoneFix.requestMicrophoneAccess();
}

export async function testMicrophone() {
  const accessResult = await microphoneFix.requestMicrophoneAccess();
  
  if (!accessResult.success) {
    return {
      success: false,
      error: accessResult.error,
      recommendations: accessResult.recommendations,
      instructions: microphoneFix.generateFixInstructions(accessResult.error)
    };
  }

  // Test audio levels
  const levelTest = await microphoneFix.testMicrophoneLevel(accessResult.stream);
  
  // Clean up stream
  accessResult.stream.getTracks().forEach(track => track.stop());

  return {
    success: true,
    method: accessResult.method,
    audioTest: levelTest,
    quality: levelTest.quality,
    isWorking: levelTest.isWorking
  };
}

export default microphoneFix;
