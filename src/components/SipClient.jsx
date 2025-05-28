import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import JsSIP from 'jssip';
import { connectWebSocket, getConnectionStatus } from '../services/websocketservice';

const SipClient = ({ extension, sipPassword }) => {
  const uaRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 10000; // 10 seconds

  const initializeSip = useCallback(async () => {
    if (!extension || !/^\d{4,6}$/.test(extension)) {
      console.error('[SipClient] Invalid extension:', extension);
      window.dispatchEvent(new CustomEvent('registrationStatus', {
        detail: { extension, registered: false, cause: 'Invalid extension' },
      }));
      return;
    }

    if (uaRef.current && uaRef.current.isConnected()) {
      console.log('[SipClient] SIP UA already initialized for extension:', extension);
      return;
    }

    try {
      const { isConnected, extension: activeExtension } = getConnectionStatus();
      if (!isConnected || activeExtension !== extension) {
        await connectWebSocket(
          extension,
          (data) => console.log('[SipClient] WebSocket message:', data),
          (status) => {
            console.log('[SipClient] WebSocket status:', status);
            if (status === 'error') {
              window.dispatchEvent(new CustomEvent('registrationStatus', {
                detail: { extension, registered: false, cause: 'WebSocket connection failed' },
              }));
            }
          }
        );
      }

      const socket = new JsSIP.WebSocketInterface('ws://192.168.1.194:8088/ws');

      const configuration = {
        sockets: [socket],
        uri: `sip:${extension}@192.168.1.194`,
        password: sipPassword,
        register: true,
        session_timers: false,
        connection_recovery_min_interval: 2,
        connection_recovery_max_interval: 30,
        connection_timeout: 15000,
      };

      uaRef.current = new JsSIP.UA(configuration);

      uaRef.current.on('connected', () => {
        console.log(`[SipClient] SIP UA connected for extension ${extension}`);
        reconnectAttemptsRef.current = 0;
      });

      uaRef.current.on('disconnected', () => {
        console.warn(`[SipClient] SIP UA disconnected for extension ${extension}`);
        window.dispatchEvent(new CustomEvent('registrationStatus', {
          detail: { extension, registered: false },
        }));
        attemptReconnect();
      });

      uaRef.current.on('registered', () => {
        console.log(`[SipClient] SIP UA registered for extension ${extension}`);
        localStorage.setItem(`sipRegistered_${extension}`, 'true');
        window.dispatchEvent(new CustomEvent('registrationStatus', {
          detail: { extension, registered: true },
        }));
      });

      uaRef.current.on('unregistered', () => {
        console.log(`[SipClient] SIP UA unregistered for extension ${extension}`);
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
          console.log('[SipClient] Retrying registration after 401 Unauthorized');
          attemptReconnect();
        }
      });

      uaRef.current.on('newRTCSession', (data) => {
        const session = data.session;
        if (session.direction === 'incoming') {
          console.log('[SipClient] Incoming call from', session.remote_identity.uri.user);
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
      console.log('[SipClient] SIP UA started for extension:', extension);

    } catch (error) {
      console.error('[SipClient] SIP UA initialization failed:', error);
      window.dispatchEvent(new CustomEvent('registrationStatus', {
        detail: { extension, registered: false, cause: error.message },
      }));
      attemptReconnect();
    }
  }, [extension, sipPassword]);

  const attemptReconnect = () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('[SipClient] Max reconnect attempts reached for extension:', extension);
      return;
    }
    reconnectAttemptsRef.current += 1;
    const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1);
    console.log(`[SipClient] Reconnecting attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms`);
    setTimeout(() => {
      initializeSip();
    }, delay);
  };

  useEffect(() => {
    initializeSip();
    return () => {
      if (uaRef.current) {
        uaRef.current.stop();
        uaRef.current = null;
        console.log('[SipClient] SIP UA stopped');
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
