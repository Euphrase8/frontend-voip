import axios from 'axios';
import { connectWebSocket, sendWebSocketMessage, getConnectionStatus } from './websocketservice';
import { getToken } from './login';
import JsSIP from 'jssip';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.164:8080';

let ua = null;

const validateCredentials = async (extension, password) => {
  try {
    const token = getToken();
    const response = await axios.post(
      `${API_URL}/protected/validate-credentials`,
      { extension, password },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );
    return response.data.valid;
  } catch (error) {
    console.error('[call.js] Credential validation failed:', error.message);
    return false;
  }
};

const registerWithBackoff = async (ua, maxAttempts = 3) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Registration timeout')), 10000);
        ua.register();
        ua.on('registered', () => {
          clearTimeout(timeout);
          resolve();
        });
        ua.on('registrationFailed', (data) => {
          clearTimeout(timeout);
          reject(new Error(`Registration failed: ${data.cause}`));
        });
      });
      return true;
    } catch (error) {
      console.error(`[call.js] Registration attempt ${attempt} failed:`, error.message);
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
};

const sendKeepAlive = (extension) => {
  if (ua && ua.isConnected()) {
    ua.sendMessage(`sip:${extension}@192.168.1.194`, '', {
      contentType: 'application/sdp',
      eventHandlers: {
        succeeded: () => console.debug('[call.js] Keep-alive OPTIONS sent'),
        failed: (e) => console.error('[call.js] Keep-alive OPTIONS failed:', e),
      },
    });
    setTimeout(() => sendKeepAlive(extension), 15000); // Schedule next keep-alive
  }
};

export const initializeSIP = async (user, onIncomingCall) => {
  if (ua && ua.isConnected()) {
    console.log('[call.js] SIP UA already initialized for extension:', user.extension);
    return ua;
  }

  if (!user?.extension || !/^\d{4,6}$/.test(user.extension)) {
    console.error('[call.js] Invalid extension:', user?.extension);
    throw new Error('Invalid extension');
  }

  try {
    const password = `password${user.extension}`;
    if (!await validateCredentials(user.extension, password)) {
      console.error('[call.js] Invalid credentials for extension:', user.extension);
      throw new Error('Invalid credentials');
    }

    const { isConnected, extension: activeExtension } = getConnectionStatus();
    if (!isConnected || activeExtension !== user.extension) {
      await connectWebSocket(user.extension, (data) => {
        console.log('[call.js] WebSocket message:', data);
        if (data.type === 'incoming-call') {
          onIncomingCall({
            from: data.caller,
            channel: `${user.extension}@192.168.1.194`,
          });
        }
      });
    }

    const socket = new JsSIP.WebSocketInterface('ws://192.168.1.194:8088/ws', {
      protocols: ['sip'],
      keepalive_interval: 10,
    });

    const configuration = {
      sockets: [socket],
      uri: `sip:${user.extension}@192.168.1.194`,
      password,
      register: true,
      session_timers: false,
      connection_recovery_min_interval: 2,
      connection_recovery_max_interval: 30,
    };

    ua = new JsSIP.UA(configuration);

    ua.on('connected', () => {
      console.log(`[call.js] SIP UA connected for extension ${user.extension}`);
    });

    ua.on('disconnected', () => {
      console.log(`[call.js] SIP UA disconnected for extension ${user.extension}`);
      window.dispatchEvent(new CustomEvent('registrationStatus', {
        detail: { extension: user.extension, registered: false },
      }));
    });

    ua.on('registered', () => {
      console.log(`[call.js] SIP UA registered for extension ${user.extension}`);
      localStorage.setItem(`sipRegistered_${user.extension}`, 'true');
      window.dispatchEvent(new CustomEvent('registrationStatus', {
        detail: { extension: user.extension, registered: true },
      }));
      sendKeepAlive(user.extension);
    });

    ua.on('unregistered', () => {
      console.log(`[call.js] SIP UA unregistered for extension ${user.extension}`);
      localStorage.removeItem(`sipRegistered_${user.extension}`);
      window.dispatchEvent(new CustomEvent('registrationStatus', {
        detail: { extension: user.extension, registered: false },
      }));
    });

    ua.on('registrationFailed', (data) => {
      console.error('[call.js] SIP registration failed:', data.cause);
      localStorage.removeItem(`sipRegistered_${user.extension}`);
      window.dispatchEvent(new CustomEvent('registrationStatus', {
        detail: { extension: user.extension, registered: false, cause: data.cause },
      }));
    });

    ua.on('newRTCSession', (data) => {
      const session = data.session;
      if (session.direction === 'incoming') {
        console.log('[call.js] Incoming call from', session.remote_identity.uri.user);
        onIncomingCall({
          session,
          from: session.remote_identity.uri.user,
          channel: `${user.extension}@192.168.1.194`,
        });
      }
    });

    ua.start();
    console.log('[call.js] SIP UA started for extension:', user.extension);

    if (!await registerWithBackoff(ua)) {
      throw new Error('All registration attempts failed');
    }

    return ua;
  } catch (error) {
    console.error('[call.js] Error initializing SIP:', error);
    localStorage.removeItem(`sipRegistered_${user.extension}`);
    window.dispatchEvent(new CustomEvent('registrationStatus', {
      detail: { extension: user.extension, registered: false, cause: error.message },
    }));
    throw error;
  }
};

export const call = async (extension) => {
  const token = getToken();
  if (!token) {
    console.error('[call.js] No auth token found');
    throw new Error('Authentication required');
  }

  if (!/^\d{4,6}$/.test(extension)) {
    console.error('[call.js] Invalid target extension:', extension);
    throw new Error('Invalid target extension');
  }

  if (!localStorage.getItem(`sipRegistered_${extension}`)) {
    console.error('[call.js] Target extension not registered:', extension);
    throw new Error('Target extension not registered');
  }

  try {
    console.log('[call.js] Initiating call to:', extension);
    const response = await axios.post(
      `${API_URL}/protected/call/initiate`,
      { extension, channel: `${extension}@192.168.1.194` },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    console.log('[call.js] Call initiated:', response.data);
    return { ...response.data, channel: `${extension}@192.168.1.194` };
  } catch (error) {
    console.error('[call.js] Call initiation error:', error.response?.data || error.message);
    throw new Error(`Call initiation failed: ${error.message}`);
  }
};

export const answerCall = async (channel) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const token = getToken();
    await axios.post(
      `${API_URL}/protected/call/answer`,
      { channel },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    console.log(`[call.js] Call answered for channel ${channel}`);
    return stream;
  } catch (error) {
    console.error('[call.js] Error answering call:', error.response?.data || error.message);
    throw new Error(`Answer call failed: ${error.message}`);
  }
};

export const hangupCall = async (channel, from, to, session) => {
  try {
    await sendWebSocketMessage({
      type: 'hangup',
      from,
      to,
      channel,
    });

    const token = getToken();
    await axios.post(
      `${API_URL}/protected/call/hangup`,
      { channel },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    if (session) {
      session.terminate();
    }

    console.log('[call.js] Call hangup sent for channel:', channel);
  } catch (error) {
    console.error('[call.js] Error hanging up call:', error.response?.data || error.message);
    throw new Error(`Hangup failed: ${error.message}`);
  }
};