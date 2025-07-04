// Microphone Diagnostics and Fix Utility
// Comprehensive microphone troubleshooting for VoIP application

export class MicrophoneDiagnostics {
  constructor() {
    this.testResults = {
      browserSupport: null,
      permissions: null,
      deviceAvailability: null,
      secureContext: null,
      audioContext: null,
      mediaStream: null
    };
  }

  // Run comprehensive microphone diagnostics
  async runDiagnostics() {
    console.log('🔍 Starting microphone diagnostics...');
    
    try {
      // Test 1: Browser Support
      this.testResults.browserSupport = this.testBrowserSupport();
      
      // Test 2: Secure Context
      this.testResults.secureContext = this.testSecureContext();
      
      // Test 3: Device Availability
      this.testResults.deviceAvailability = await this.testDeviceAvailability();
      
      // Test 4: Permissions
      this.testResults.permissions = await this.testPermissions();
      
      // Test 5: Audio Context
      this.testResults.audioContext = this.testAudioContext();
      
      // Test 6: Media Stream
      this.testResults.mediaStream = await this.testMediaStream();
      
      return this.generateReport();
    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      return {
        success: false,
        error: error.message,
        fixes: this.getGeneralFixes()
      };
    }
  }

  // Test browser support for required APIs
  testBrowserSupport() {
    const support = {
      getUserMedia: false,
      webrtc: false,
      websocket: false,
      audioContext: false
    };

    // Check getUserMedia support
    support.getUserMedia = !!(
      navigator.mediaDevices?.getUserMedia ||
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia
    );

    // Check WebRTC support
    support.webrtc = !!(
      window.RTCPeerConnection ||
      window.webkitRTCPeerConnection ||
      window.mozRTCPeerConnection
    );

    // Check WebSocket support
    support.websocket = !!window.WebSocket;

    // Check AudioContext support
    support.audioContext = !!(
      window.AudioContext ||
      window.webkitAudioContext
    );

    return {
      passed: Object.values(support).every(Boolean),
      details: support,
      issues: Object.entries(support)
        .filter(([key, value]) => !value)
        .map(([key]) => `${key} not supported`)
    };
  }

  // Test secure context (HTTPS/localhost)
  testSecureContext() {
    const isSecure = window.isSecureContext || 
                    window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.startsWith('192.168.') ||
                    window.location.hostname.startsWith('10.') ||
                    window.location.hostname.startsWith('172.');

    return {
      passed: isSecure,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      issues: isSecure ? [] : ['Not in secure context - microphone access may be restricted']
    };
  }

  // Test device availability
  async testDeviceAvailability() {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        return {
          passed: false,
          devices: [],
          issues: ['Device enumeration not supported']
        };
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');

      return {
        passed: audioInputs.length > 0,
        devices: audioInputs,
        totalDevices: devices.length,
        issues: audioInputs.length === 0 ? ['No audio input devices found'] : []
      };
    } catch (error) {
      return {
        passed: false,
        devices: [],
        issues: [`Device enumeration failed: ${error.message}`]
      };
    }
  }

  // Test microphone permissions
  async testPermissions() {
    try {
      if (!navigator.permissions?.query) {
        return {
          passed: null,
          state: 'unknown',
          issues: ['Permission API not supported']
        };
      }

      const permission = await navigator.permissions.query({ name: 'microphone' });
      
      return {
        passed: permission.state === 'granted',
        state: permission.state,
        issues: permission.state === 'denied' ? ['Microphone permission denied'] : []
      };
    } catch (error) {
      return {
        passed: null,
        state: 'unknown',
        issues: [`Permission check failed: ${error.message}`]
      };
    }
  }

  // Test audio context
  testAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        return {
          passed: false,
          issues: ['AudioContext not supported']
        };
      }

      const audioContext = new AudioContextClass();
      const canCreate = !!audioContext;
      
      if (audioContext) {
        audioContext.close();
      }

      return {
        passed: canCreate,
        issues: canCreate ? [] : ['Failed to create AudioContext']
      };
    } catch (error) {
      return {
        passed: false,
        issues: [`AudioContext test failed: ${error.message}`]
      };
    }
  }

  // Test actual media stream access
  async testMediaStream() {
    const constraints = { audio: true, video: false };
    
    try {
      let stream = null;

      // Try modern getUserMedia first
      if (navigator.mediaDevices?.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (modernError) {
          console.warn('Modern getUserMedia failed:', modernError);
        }
      }

      // Try legacy getUserMedia if modern failed
      if (!stream) {
        const getUserMedia = navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia;

        if (getUserMedia) {
          stream = await new Promise((resolve, reject) => {
            getUserMedia.call(navigator, constraints, resolve, reject);
          });
        }
      }

      if (stream) {
        const audioTracks = stream.getAudioTracks();
        const hasAudio = audioTracks.length > 0;
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());

        return {
          passed: hasAudio,
          audioTracks: audioTracks.length,
          trackDetails: audioTracks.map(track => ({
            label: track.label,
            enabled: track.enabled,
            readyState: track.readyState
          })),
          issues: hasAudio ? [] : ['No audio tracks in stream']
        };
      } else {
        return {
          passed: false,
          audioTracks: 0,
          issues: ['Failed to obtain media stream']
        };
      }
    } catch (error) {
      return {
        passed: false,
        audioTracks: 0,
        error: error.name,
        message: error.message,
        issues: [this.getErrorMessage(error)]
      };
    }
  }

  // Get user-friendly error message
  getErrorMessage(error) {
    switch (error.name) {
      case 'NotAllowedError':
        return 'Microphone permission denied by user';
      case 'NotFoundError':
        return 'No microphone device found';
      case 'NotReadableError':
        return 'Microphone is being used by another application';
      case 'OverconstrainedError':
        return 'Microphone constraints cannot be satisfied';
      case 'SecurityError':
        return 'Security error - check HTTPS/permissions';
      case 'TypeError':
        return 'Invalid constraints or browser incompatibility';
      default:
        return `Microphone error: ${error.message}`;
    }
  }

  // Generate comprehensive diagnostic report
  generateReport() {
    const allPassed = Object.values(this.testResults).every(result =>
      result && (result.passed === true || result.passed === null)
    );

    const allIssues = Object.values(this.testResults)
      .flatMap(result => result?.issues || []);

    const fixes = this.generateFixes();

    return {
      success: allPassed,
      summary: {
        totalTests: Object.keys(this.testResults).length,
        passed: Object.values(this.testResults).filter(r => r?.passed === true).length,
        failed: Object.values(this.testResults).filter(r => r?.passed === false).length,
        unknown: Object.values(this.testResults).filter(r => r?.passed === null).length
      },
      results: this.testResults,
      issues: allIssues,
      fixes: fixes,
      recommendations: this.getRecommendations()
    };
  }

  // Generate specific fixes based on test results
  generateFixes() {
    const fixes = [];

    // Browser support fixes
    if (!this.testResults.browserSupport?.passed) {
      fixes.push({
        category: 'Browser Support',
        priority: 'high',
        title: 'Update Your Browser',
        description: 'Your browser doesn\'t support required features',
        actions: [
          'Update to the latest version of Chrome, Firefox, Safari, or Edge',
          'Ensure your browser supports WebRTC and getUserMedia',
          'Consider switching to a modern browser if using an outdated one'
        ]
      });
    }

    // Secure context fixes
    if (!this.testResults.secureContext?.passed) {
      const protocol = this.testResults.secureContext?.protocol;
      fixes.push({
        category: 'Security',
        priority: 'high',
        title: 'Enable Secure Context',
        description: `Running on ${protocol} limits microphone access`,
        actions: this.getSecureContextFixes()
      });
    }

    // Device availability fixes
    if (!this.testResults.deviceAvailability?.passed) {
      fixes.push({
        category: 'Hardware',
        priority: 'high',
        title: 'Connect Microphone',
        description: 'No microphone devices detected',
        actions: [
          'Connect a microphone or headset to your computer',
          'Check that your microphone is properly plugged in',
          'Verify microphone works in other applications',
          'Check Windows/Mac sound settings to ensure microphone is recognized'
        ]
      });
    }

    // Permission fixes
    if (this.testResults.permissions?.passed === false) {
      fixes.push({
        category: 'Permissions',
        priority: 'high',
        title: 'Grant Microphone Permission',
        description: 'Microphone access has been denied',
        actions: [
          'Click the microphone icon in your browser\'s address bar',
          'Select "Allow" for microphone access',
          'Reload the page after granting permission',
          'Check browser settings if permission option is not visible'
        ]
      });
    }

    // Media stream fixes
    if (!this.testResults.mediaStream?.passed) {
      const error = this.testResults.mediaStream?.error;
      fixes.push({
        category: 'Media Access',
        priority: 'high',
        title: 'Fix Microphone Access',
        description: `Media stream failed: ${error || 'Unknown error'}`,
        actions: this.getMediaStreamFixes(error)
      });
    }

    return fixes;
  }

  // Get secure context specific fixes
  getSecureContextFixes() {
    const userAgent = navigator.userAgent.toLowerCase();
    const hostname = window.location.hostname;

    const fixes = [
      'Use HTTPS instead of HTTP for production',
      'Access via localhost or 127.0.0.1 for development'
    ];

    if (userAgent.includes('chrome')) {
      fixes.push(
        'Chrome: Add --unsafely-treat-insecure-origin-as-secure="http://' + hostname + ':3000" flag',
        'Chrome: Enable "Insecure origins treated as secure" in chrome://flags/'
      );
    } else if (userAgent.includes('firefox')) {
      fixes.push('Firefox: Set media.devices.insecure.enabled to true in about:config');
    } else if (userAgent.includes('safari')) {
      fixes.push('Safari: Use HTTPS (Safari has strict security requirements)');
    }

    return fixes;
  }

  // Get media stream specific fixes
  getMediaStreamFixes(errorName) {
    const fixes = [];

    switch (errorName) {
      case 'NotAllowedError':
        fixes.push(
          'Grant microphone permission when prompted',
          'Check browser address bar for permission icons',
          'Reset site permissions in browser settings',
          'Reload the page and try again'
        );
        break;
      case 'NotFoundError':
        fixes.push(
          'Connect a microphone to your computer',
          'Check microphone is properly connected',
          'Verify microphone works in system settings',
          'Try a different microphone if available'
        );
        break;
      case 'NotReadableError':
        fixes.push(
          'Close other applications using the microphone',
          'Restart your browser',
          'Check if microphone is being used by video conferencing apps',
          'Restart your computer if the issue persists'
        );
        break;
      default:
        fixes.push(
          'Check microphone permissions in browser settings',
          'Ensure microphone is connected and working',
          'Try refreshing the page',
          'Use a different browser if the issue persists'
        );
    }

    return fixes;
  }

  // Get general recommendations
  getRecommendations() {
    const recommendations = [];

    // Browser recommendations
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) {
      recommendations.push('Chrome detected - excellent WebRTC support');
    } else if (userAgent.includes('firefox')) {
      recommendations.push('Firefox detected - good WebRTC support');
    } else if (userAgent.includes('safari')) {
      recommendations.push('Safari detected - requires HTTPS for microphone access');
    } else if (userAgent.includes('edge')) {
      recommendations.push('Edge detected - good WebRTC support');
    } else {
      recommendations.push('Consider using Chrome or Firefox for best compatibility');
    }

    // Security recommendations
    if (window.location.protocol === 'http:') {
      recommendations.push('Use HTTPS in production for better security and compatibility');
    }

    // General recommendations
    recommendations.push(
      'Test microphone in browser settings before using the app',
      'Close other applications that might use the microphone',
      'Use a good quality headset for better call quality'
    );

    return recommendations;
  }

  // Get general fixes for when diagnostics fail
  getGeneralFixes() {
    return [
      {
        category: 'General',
        priority: 'high',
        title: 'Basic Troubleshooting',
        description: 'Try these general solutions',
        actions: [
          'Refresh the page and try again',
          'Check that your microphone is connected',
          'Grant microphone permission when prompted',
          'Try using a different browser',
          'Check browser console for error messages'
        ]
      }
    ];
  }
}

// Quick diagnostic function for easy use
export async function quickMicrophoneCheck() {
  const diagnostics = new MicrophoneDiagnostics();
  return await diagnostics.runDiagnostics();
}

// Enhanced microphone access test with multiple fallback methods
export async function testMicrophoneAccess() {
  console.log('🎤 Starting enhanced microphone access test...');

  try {
    // Step 1: Check basic browser support
    if (!navigator) {
      throw new Error('Navigator not available');
    }

    // Step 2: Check if we have any form of getUserMedia
    const hasModernGetUserMedia = navigator.mediaDevices?.getUserMedia;
    const hasLegacyGetUserMedia = navigator.getUserMedia ||
                                 navigator.webkitGetUserMedia ||
                                 navigator.mozGetUserMedia ||
                                 navigator.msGetUserMedia;

    if (!hasModernGetUserMedia && !hasLegacyGetUserMedia) {
      throw new Error('getUserMedia not supported in this browser');
    }

    console.log('✅ getUserMedia support detected');

    // Step 3: Try to enumerate devices first
    let hasAudioInput = false;
    try {
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        hasAudioInput = devices.some(device => device.kind === 'audioinput');
        console.log(`📱 Found ${devices.filter(d => d.kind === 'audioinput').length} audio input devices`);
      }
    } catch (enumError) {
      console.warn('⚠️ Device enumeration failed:', enumError);
      // Continue anyway, as some browsers restrict enumeration before permission
    }

    // Step 4: Try multiple getUserMedia approaches
    let stream = null;
    let lastError = null;

    // Method 1: Modern getUserMedia with basic constraints
    if (hasModernGetUserMedia) {
      try {
        console.log('🔄 Trying modern getUserMedia...');
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        console.log('✅ Modern getUserMedia successful');
      } catch (error) {
        console.warn('⚠️ Modern getUserMedia failed:', error);
        lastError = error;

        // Try with minimal constraints
        try {
          console.log('🔄 Trying modern getUserMedia with minimal constraints...');
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('✅ Modern getUserMedia with minimal constraints successful');
        } catch (minimalError) {
          console.warn('⚠️ Modern getUserMedia with minimal constraints failed:', minimalError);
          lastError = minimalError;
        }
      }
    }

    // Method 2: Legacy getUserMedia fallback
    if (!stream && hasLegacyGetUserMedia) {
      try {
        console.log('🔄 Trying legacy getUserMedia...');
        const getUserMedia = navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia;

        stream = await new Promise((resolve, reject) => {
          getUserMedia.call(navigator, { audio: true }, resolve, reject);
        });
        console.log('✅ Legacy getUserMedia successful');
      } catch (legacyError) {
        console.warn('⚠️ Legacy getUserMedia failed:', legacyError);
        lastError = legacyError;
      }
    }

    // Step 5: Analyze the stream
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      console.log(`🎵 Audio tracks found: ${audioTracks.length}`);

      if (audioTracks.length > 0) {
        const track = audioTracks[0];
        console.log('🎤 Microphone details:', {
          label: track.label || 'Unknown microphone',
          enabled: track.enabled,
          readyState: track.readyState,
          settings: track.getSettings?.() || 'Settings not available'
        });
      }

      // Clean up
      stream.getTracks().forEach(track => track.stop());

      return {
        success: true,
        message: `Microphone access successful - ${audioTracks.length} audio track(s) found`,
        tracks: audioTracks.length,
        details: {
          method: hasModernGetUserMedia ? 'modern' : 'legacy',
          trackInfo: audioTracks.map(track => ({
            label: track.label || 'Unknown microphone',
            enabled: track.enabled,
            readyState: track.readyState
          }))
        }
      };
    }

    // Step 6: If we get here, all methods failed
    const diagnostics = new MicrophoneDiagnostics();
    const errorMessage = lastError ? diagnostics.getErrorMessage(lastError) : 'Unknown microphone access error';

    return {
      success: false,
      error: lastError?.name || 'UnknownError',
      message: errorMessage,
      fixes: diagnostics.getMediaStreamFixes(lastError?.name || 'UnknownError'),
      details: {
        hasModernGetUserMedia,
        hasLegacyGetUserMedia,
        hasAudioInput,
        lastError: lastError?.message
      }
    };

  } catch (error) {
    console.error('❌ Microphone access test failed:', error);
    const diagnostics = new MicrophoneDiagnostics();

    return {
      success: false,
      error: error.name || 'UnknownError',
      message: diagnostics.getErrorMessage(error),
      fixes: diagnostics.getMediaStreamFixes(error.name || 'UnknownError'),
      details: {
        errorStack: error.stack
      }
    };
  }
}

// Quick microphone permission check
export async function quickMicrophonePermissionCheck() {
  try {
    // Try to get permission without actually accessing the microphone
    if (navigator.permissions) {
      const permission = await navigator.permissions.query({ name: 'microphone' });
      return {
        state: permission.state,
        granted: permission.state === 'granted',
        denied: permission.state === 'denied',
        prompt: permission.state === 'prompt'
      };
    }
    return { state: 'unknown', message: 'Permissions API not available' };
  } catch (error) {
    return { state: 'error', error: error.message };
  }
}
