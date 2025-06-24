import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import JsSIP from 'jssip';
import { connectWebSocket, getConnectionStatus } from '../services/websocketservice';

const SipClient = ({ extension, sipPassword }) => {
  const uaRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const BASE_RECONNECT_DELAY = 15000; // 15 seconds base delay

  // Reconnect with exponential backoff capped at MAX_RECONNECT_ATTEMPTS
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[SipClient] Max reconnect attempts reached for extension:', extension);
      return;
    }

    reconnectAttemptsRef.current += 1;
    const delay = BASE_RECONNECT_DELAY * 2 ** (reconnectAttemptsRef.current - 1);
    console.warn(`[SipClient] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);

    setTimeout(() => {
      // Only try to initialize if uaRef is not connected or null
      if (!uaRef.current || !uaRef.current.isConnected()) {
        initializeSip();
      }
    }, delay);
  }, [extension]);

  const initializeSip = useCallback(async () => {
    if (!extension || !/^\d{4,6}$/.test(extension)) {
      console.error('[SipClient] Invalid extension:', extension);
      window.dispatchEvent(new CustomEvent('registrationStatus', {
        detail: { extension, registered: false, cause: 'Invalid extension' },
      }));
      return;
    }

    // Prevent multiple UA instances
    if (uaRef.current && uaRef.current.isConnected()) {
      console.log('[SipClient] SIP UA already connected for extension:', extension);
      return;
    }

    try {
      // Check WebSocket connection status and connect if necessary
      const { isConnected, extension: activeExt } = getConnectionStatus();
      if (!isConnected || activeExt !== extension) {
        await connectWebSocket(
          extension,
          (msg) => console.log('[SipClient] WS message:', msg),
          (status) => {
            console.log('[SipClient] WS status:', status);
            if (status === 'error') {
              window.dispatchEvent(new CustomEvent('registrationStatus', {
                detail: { extension, registered: false, cause: 'WebSocket error' },
              }));
            }
          }
        );
      }

      // Setup JsSIP UA with correct config
      const socket = new JsSIP.WebSocketInterface('ws://172.20.10.6:8088/ws', { protocols: ['sip'] });

      const config = {
        sockets: [socket],
        uri: `sip:${extension}@172.20.10.6:8088`,
        display_name: `User ${extension}`,
        contact_uri: `sip:${extension}@172.20.10.3;transport=ws`,
        password: sipPassword,
        register: true,
        session_timers: false,
        connection_recovery_min_interval: 2,
        connection_recovery_max_interval: 30,
        connection_timeout: 15000,
      };

      console.debug('[SipClient] JsSIP config:', config);

      uaRef.current = new JsSIP.UA(config);

      uaRef.current.on('connected', () => {
        console.log(`[SipClient] SIP UA connected for ${extension}`);
        reconnectAttemptsRef.current = 0;
      });

      uaRef.current.on('disconnected', () => {
        console.warn(`[SipClient] SIP UA disconnected for ${extension}`);
        window.dispatchEvent(new CustomEvent('registrationStatus', {
          detail: { extension, registered: false },
        }));
        attemptReconnect();
      });

      uaRef.current.on('registered', () => {
        console.log(`[SipClient] SIP UA registered for ${extension}`);
        localStorage.setItem(`sipRegistered_${extension}`, 'true');
        window.dispatchEvent(new CustomEvent('registrationStatus', {
          detail: { extension, registered: true },
        }));
      });

      uaRef.current.on('unregistered', () => {
        console.warn(`[SipClient] SIP UA unregistered for ${extension}`);
        localStorage.removeItem(`sipRegistered_${extension}`);
        window.dispatchEvent(new CustomEvent('registrationStatus', {
          detail: { extension, registered: false },
        }));
      });

      uaRef.current.on('registrationFailed', (data) => {
        console.error('[SipClient] SIP registration failed:', data.cause);
        localStorage.removeItem(`sipRegistered_${extension}`);
        window.dispatchEvent(new CustomEvent('registrationStatus', {
          detail: { extension, registered: false, cause: data.cause },
        }));
        if (data.cause === 'Unauthorized') {
          console.log('[SipClient] Retrying after 401 Unauthorized...');
          attemptReconnect();
        }
      });

      uaRef.current.on('newRTCSession', ({ session }) => {
        if (session.direction === 'incoming') {
          console.log('[SipClient] Incoming call from', session.remote_identity.uri.user);
          window.dispatchEvent(new CustomEvent('incomingCall', {
            detail: {
              from: session.remote_identity.uri.user,
              channel: `${session.remote_identity.uri.user}@172.20.10.6`,
              session,
            },
          }));
        }
      });

      uaRef.current.start();
      console.debug('[SipClient] SIP UA started for', extension);
    } catch (err) {
      console.error('[SipClient] SIP init error:', err.message);
      window.dispatchEvent(new CustomEvent('registrationStatus', {
        detail: { extension, registered: false, cause: err.message },
      }));
      attemptReconnect();
    }
  }, [extension, sipPassword, attemptReconnect]);

  useEffect(() => {
    // Only initialize if extension and password are provided
    if (extension && sipPassword) {
      initializeSip();
    }

    return () => {
      if (uaRef.current) {
        console.log('[SipClient] Stopping SIP UA...');
        uaRef.current.stop();
        uaRef.current = null;
      }
    };
  }, [extension, sipPassword, initializeSip]);

  return null;
};

SipClient.propTypes = {
  extension: PropTypes.string.isRequired,
  sipPassword: PropTypes.string.isRequired,
};

export default SipClient;
