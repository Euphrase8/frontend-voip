import JsSIP from 'jssip';
import CONFIG from './config';

class SipManager {
  constructor() {
    this.ua = null;
    this.currentSession = null;
    this.isRegistered = false;
    this.extension = null;
    this.sipPassword = null;
    this.eventListeners = new Map();
  }

  // Initialize SIP User Agent
  async initialize(extension, sipPassword) {
    console.log(`[SipManager] Initializing SIP for extension ${extension}`);

    if (this.ua && this.ua.isConnected()) {
      console.log('[SipManager] Already initialized and connected');
      return;
    }

    // Clean up any existing UA
    if (this.ua) {
      console.log('[SipManager] Cleaning up existing UA');
      this.ua.stop();
      this.ua = null;
      this.isRegistered = false;
    }

    this.extension = extension;
    this.sipPassword = sipPassword;

    // Validate required parameters
    if (!extension || !sipPassword) {
      throw new Error('Extension and SIP password are required');
    }

    try {
      console.log(`[SipManager] Connecting to SIP server: ${CONFIG.SIP_WS_URL}`);

      // Create WebSocket interface
      const socket = new JsSIP.WebSocketInterface(CONFIG.SIP_WS_URL, {
        protocols: ['sip']
      });

      // SIP UA configuration
      const config = {
        sockets: [socket],
        uri: `sip:${extension}@${CONFIG.SIP_SERVER}`,
        display_name: `User ${extension}`,
        password: sipPassword,
        register: true,
        session_timers: false,
        connection_recovery_min_interval: 2,
        connection_recovery_max_interval: 30,
        connection_timeout: 15000,
        register_expires: 300,
        no_answer_timeout: 30,
      };

      console.log('[SipManager] Creating UA with config:', {
        ...config,
        password: '***hidden***'
      });

      this.ua = new JsSIP.UA(config);
      this.setupEventHandlers();
      this.ua.start();

      console.log('[SipManager] SIP UA started, waiting for registration...');

      // Return a promise that resolves when registered
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('SIP registration timeout after 15 seconds'));
        }, 15000);

        const onRegistered = () => {
          clearTimeout(timeout);
          this.ua.off('registered', onRegistered);
          this.ua.off('registrationFailed', onFailed);
          console.log('[SipManager] SIP registration successful');
          resolve();
        };

        const onFailed = (data) => {
          clearTimeout(timeout);
          this.ua.off('registered', onRegistered);
          this.ua.off('registrationFailed', onFailed);
          console.error('[SipManager] SIP registration failed:', data);
          reject(new Error(`SIP registration failed: ${data.cause}`));
        };

        this.ua.on('registered', onRegistered);
        this.ua.on('registrationFailed', onFailed);
      });

    } catch (error) {
      console.error('[SipManager] Initialization failed:', error);
      throw error;
    }
  }

  // Set up event handlers
  setupEventHandlers() {
    this.ua.on('connected', () => {
      console.log('[SipManager] SIP connected');
      this.emit('connected');
    });

    this.ua.on('disconnected', () => {
      console.log('[SipManager] SIP disconnected');
      this.isRegistered = false;
      this.emit('disconnected');
    });

    this.ua.on('registered', () => {
      console.log('[SipManager] SIP registered');
      this.isRegistered = true;
      this.emit('registered');
    });

    this.ua.on('unregistered', () => {
      console.log('[SipManager] SIP unregistered');
      this.isRegistered = false;
      this.emit('unregistered');
    });

    this.ua.on('registrationFailed', (data) => {
      console.error('[SipManager] Registration failed:', data.cause);
      this.isRegistered = false;
      this.emit('registrationFailed', data.cause);
    });

    this.ua.on('newRTCSession', ({ session }) => {
      this.handleNewSession(session);
    });
  }

  // Handle new RTC session (incoming/outgoing calls)
  handleNewSession(session) {
    if (session.direction === 'incoming') {
      console.log('[SipManager] Incoming call from:', session.remote_identity.uri.user);
      this.emit('incomingCall', {
        from: session.remote_identity.uri.user,
        session: session
      });
    } else {
      console.log('[SipManager] Outgoing call to:', session.remote_identity.uri.user);
      this.currentSession = session;
    }

    // Set up session event handlers
    session.on('progress', () => {
      console.log('[SipManager] Call progress');
      this.emit('callProgress', { session });
    });

    session.on('accepted', () => {
      console.log('[SipManager] Call accepted');
      this.currentSession = session;
      this.emit('callAccepted', { session });
    });

    session.on('ended', () => {
      console.log('[SipManager] Call ended');
      this.currentSession = null;
      this.emit('callEnded', { session });
    });

    session.on('failed', (data) => {
      console.log('[SipManager] Call failed:', data.cause);
      this.currentSession = null;
      this.emit('callFailed', { session, cause: data.cause });
    });
  }

  // Make an outgoing call
  async makeCall(targetExtension) {
    if (!this.ua || !this.isRegistered) {
      throw new Error('SIP not registered');
    }

    if (this.currentSession) {
      throw new Error('Call already in progress');
    }

    try {
      const targetUri = `sip:${targetExtension}@${CONFIG.SIP_SERVER}:${CONFIG.SIP_PORT}`;
      
      const session = this.ua.call(targetUri, {
        mediaConstraints: CONFIG.MEDIA_CONSTRAINTS,
        rtcOfferConstraints: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: false
        }
      });

      this.currentSession = session;
      return session;
    } catch (error) {
      console.error('[SipManager] Make call failed:', error);
      throw error;
    }
  }

  // Answer an incoming call
  async answerCall(session) {
    try {
      session.answer({
        mediaConstraints: CONFIG.MEDIA_CONSTRAINTS
      });
      this.currentSession = session;
    } catch (error) {
      console.error('[SipManager] Answer call failed:', error);
      throw error;
    }
  }

  // Reject an incoming call
  rejectCall(session) {
    try {
      session.reject();
    } catch (error) {
      console.error('[SipManager] Reject call failed:', error);
      throw error;
    }
  }

  // End current call
  endCall() {
    if (this.currentSession) {
      try {
        this.currentSession.terminate();
        this.currentSession = null;
      } catch (error) {
        console.error('[SipManager] End call failed:', error);
        throw error;
      }
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[SipManager] Event callback error:', error);
        }
      });
    }
  }

  // Get current status
  getStatus() {
    return {
      isConnected: this.ua ? this.ua.isConnected() : false,
      isRegistered: this.isRegistered,
      hasActiveCall: !!this.currentSession,
      extension: this.extension
    };
  }

  // Cleanup
  destroy() {
    if (this.ua) {
      this.ua.stop();
      this.ua = null;
    }
    this.currentSession = null;
    this.isRegistered = false;
    this.eventListeners.clear();
  }
}

// Create singleton instance
const sipManager = new SipManager();
export default sipManager;
