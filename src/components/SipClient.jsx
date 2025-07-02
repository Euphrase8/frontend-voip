import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import JsSIP from 'jssip';
import { connectWebSocket, getConnectionStatus } from '../services/websocketservice';
import { CONFIG } from '../services/config';

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
        const websocket = connectWebSocket(extension);

        // Set up WebSocket message handler
        websocket.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            console.log('[SipClient] WS message:', msg);
          } catch (error) {
            console.error('[SipClient] Failed to parse WebSocket message:', error);
          }
        };

        // Set up WebSocket error handler
        websocket.onerror = () => {
          console.log('[SipClient] WS status: error');
          window.dispatchEvent(new CustomEvent('registrationStatus', {
            detail: { extension, registered: false, cause: 'WebSocket error' },
          }));
        };
      }

      // Setup JsSIP UA with correct config
      const socket = new JsSIP.WebSocketInterface(CONFIG.SIP_WS_URL, { protocols: ['sip'] });

      const config = {
        sockets: [socket],
        uri: `sip:${extension}@${CONFIG.SIP_SERVER}:${CONFIG.SIP_PORT}`,
        display_name: `User ${extension}`,
        contact_uri: `sip:${extension}@${CONFIG.CLIENT_IP};transport=${CONFIG.SIP_TRANSPORT}`,
        password: sipPassword,
        register: true,
        session_timers: false,
        connection_recovery_min_interval: 2,
        connection_recovery_max_interval: 30,
        connection_timeout: 15000,
        register_expires: 300, // 5 minutes registration expiry
        no_answer_timeout: 30, // 30 seconds no answer timeout
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

          // Set up session event handlers for incoming calls
          session.on('accepted', () => {
            console.log('[SipClient] Incoming call accepted');
          });

          session.on('ended', () => {
            console.log('[SipClient] Incoming call ended');
          });

          session.on('failed', (data) => {
            console.log('[SipClient] Incoming call failed:', data.cause);
          });

          window.dispatchEvent(new CustomEvent('incomingCall', {
            detail: {
              from: session.remote_identity.uri.user,
              channel: `${session.remote_identity.uri.user}@${CONFIG.SIP_SERVER}`,
              session,
            },
          }));
        } else if (session.direction === 'outgoing') {
          console.log('[SipClient] Outgoing call to', session.remote_identity.uri.user);

          // Set up session event handlers for outgoing calls
          session.on('progress', () => {
            console.log('[SipClient] Outgoing call progress');
            window.dispatchEvent(new CustomEvent('callProgress', {
              detail: { status: 'ringing' }
            }));
          });

          session.on('accepted', () => {
            console.log('[SipClient] Outgoing call accepted');
            window.dispatchEvent(new CustomEvent('callAccepted', {
              detail: { session }
            }));
          });

          session.on('ended', () => {
            console.log('[SipClient] Outgoing call ended');
            window.dispatchEvent(new CustomEvent('callEnded', {
              detail: { reason: 'normal' }
            }));
          });

          session.on('failed', (data) => {
            console.log('[SipClient] Outgoing call failed:', data.cause);
            window.dispatchEvent(new CustomEvent('callFailed', {
              detail: { cause: data.cause }
            }));
          });
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
