import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import JsSIP from 'jssip';
import { connectWebSocket, getConnectionStatus } from '../services/websocketservice';

const SipClient = ({ extension, sipPassword }) => {
  const uaRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 15000;

  const attemptReconnect = () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('[SipClient.jsx] Max reconnect attempts reached for extension:', extension);
      return;
    }
    reconnectAttemptsRef.current += 1;
    const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1);
    console.log(`[SipClient.jsx] Reconnecting attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms`);
    setTimeout(() => {
      initializeSip();
    }, delay);
  };

  const initializeSip = useCallback(async () => {
    if (!extension || !/^\d{4,6}$/.test(extension)) {
      console.error('[SipClient.jsx] Invalid extension:', extension);
      window.dispatchEvent(new CustomEvent('registrationStatus', {
        detail: { extension, registered: false, cause: 'Invalid extension' },
      }));
      return;
    }

    if (uaRef.current && uaRef.current.isConnected()) {
      console.log('[SipClient.jsx] SIP UA already initialized for extension:', extension);
      return;
    }

    try {
      const { isConnected, extension: activeExtension } = getConnectionStatus();
      if (!isConnected || activeExtension !== extension) {
        await connectWebSocket(
          extension,
          (data) => console.log('[SipClient.jsx] WebSocket message:', data),
          (status) => {
            console.log('[SipClient.jsx] WebSocket status:', status);
            if (status === 'error') {
              window.dispatchEvent(new CustomEvent('registrationStatus', {
                detail: { extension, registered: false, cause: 'WebSocket connection failed' },
              }));
            }
          }
        );
      }

      const socket = new JsSIP.WebSocketInterface('ws://192.168.1.194:8088/ws', {
        protocols: ['sip'],
      });

      const configuration = {
        sockets: [socket],
        uri: `sip:${extension}@192.168.1.194:8088`,
        display_name: `User ${extension}`,
        contact_uri: `sip:${extension}@192.168.1.126;transport=ws`,
        password: sipPassword,
        register: true,
        session_timers: false,
        connection_recovery_min_interval: 2,
        connection_recovery_max_interval: 30,
        connection_timeout: 15000,
      };
      console.debug('[SipClient.jsx] JsSIP configuration:', configuration);

      uaRef.current = new JsSIP.UA(configuration);

      uaRef.current.on('connected', () => {
        console.log(`[SipClient.jsx] SIP UA connected for extension ${extension}`);
        reconnectAttemptsRef.current = 0;
      });

      uaRef.current.on('disconnected', () => {
        console.warn(`[SipClient.jsx] SIP UA disconnected for extension ${extension}`);
        window.dispatchEvent(new CustomEvent('registrationStatus', {
          detail: { extension, registered: false },
        }));
        attemptReconnect();
      });

      uaRef.current.on('registered', () => {
        console.log(`[SipClient.jsx] SIP UA registered for extension ${extension}`);
        localStorage.setItem(`sipRegistered_${extension}`, 'true');
        window.dispatchEvent(new CustomEvent('registrationStatus', {
          detail: { extension, registered: true },
        }));
      });

      uaRef.current.on('unregistered', () => {
        console.log('[SipClient.jsx] SIP UA unregistered for extension:', extension);
        localStorage.removeItem(`sipRegistered_${extension}`);
        window.dispatchEvent(new CustomEvent('registrationStatus', {
          detail: { extension, registered: false },
        }));
      });

      uaRef.current.on('registrationFailed', (data) => {
        console.error('[SipClient.jsx] SIP registration failed:', data.cause);
        localStorage.removeItem(`sipRegistered_${extension}`);
        window.dispatchEvent(new CustomEvent('registrationStatus', {
          detail: { extension, registered: false, cause: data.cause },
        }));
        if (data.cause === 'Unauthorized') {
          console.log('[SipClient.jsx] Retrying registration after 401 Unauthorized');
          attemptReconnect();
        }
      });

      uaRef.current.on('newRTCSession', (data) => {
        const session = data.session;
        if (session.direction === 'incoming') {
          console.log('[SipClient.jsx] Incoming call from', session.remote_identity.uri.user);
          window.dispatchEvent(new CustomEvent('incomingCall', {
            detail: {
              from: session.remote_identity.uri.user,
              channel: `${session.remote_identity.uri.user}@192.168.1.194`,
              session,
            },
          }));
        }
      });

      uaRef.current.start();
      console.debug('[SipClient.jsx] SIP UA started with extension:', extension);
      console.log('[SipClient.jsx] SIP UA started for extension:', extension);

    } catch (error) {
      console.error('[SipClient.jsx] SIP UA initialization failed:', error.message, error.stack);
      window.dispatchEvent(new CustomEvent('registrationStatus', {
        detail: { extension, registered: false, cause: error.message },
      }));
      attemptReconnect();
    }
  }, [extension, sipPassword, attemptReconnect]);

  useEffect(() => {
    initializeSip();
    return () => {
      if (uaRef.current) {
        uaRef.current.stop();
        uaRef.current = null;
        console.log('[SipClient.jsx] SIP UA stopped');
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