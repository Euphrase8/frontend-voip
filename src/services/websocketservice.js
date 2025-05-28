import axios from 'axios';
import { getToken } from './login';
import { MD5 } from 'crypto-js';

const WS_URL = 'ws://192.168.1.194:8088/ws';
const API_URL = 'http://192.168.1.164:8080';
let ws = null;
let isConnected = false;
let onStatusChange = null;
let currentExtension = null;
let reconnectAttempts = 0;
let authAttempts = 0;
const maxAuthAttempts = 3;
const baseReconnectDelay = 10000;
let keepAliveInterval = null;
let connectionMonitor = null;
let lastPong = Date.now();
let lastNonce = null;

const checkBackendHealth = async () => {
  try {
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${API_URL}/health`,
      {
        kali_ip: '192.168.1.194',
        ssh_port: '22',
        ssh_user: 'kali',
        ssh_password: 'kali',
      },
      { headers, timeout: 5000 }
    );
    console.log('[websocketservice.js] Health check passed:', response.data);
    return true;
  } catch (error) {
    console.warn('[websocketservice.js] Health check failed:', error.message);
    return false;
  }
};

const computeDigestResponse = (username, password, realm, method, uri, nonce) => {
  try {
    if (!MD5) throw new Error('MD5 module not available');
    const ha1 = MD5(`${username}:${realm}:${password}`).toString();
    const ha2 = MD5(`${method}:${uri}`).toString();
    const response = MD5(`${ha1}:${nonce}:${ha2}`).toString();
    console.log('[websocketservice.js] Computed digest response:', response);
    return response;
  } catch (error) {
    console.error('[websocketservice.js] Error computing digest response:', error);
    return '';
  }
};

const startKeepAlive = () => {
  if (keepAliveInterval) clearInterval(keepAliveInterval);
  if (connectionMonitor) clearInterval(connectionMonitor);
  keepAliveInterval = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send('PING');
      console.debug('[websocketservice.js] Sent keep-alive PING');
      sendSipOptions(currentExtension);
    } else {
      console.warn('[websocketservice.js] Keep-alive failed: WebSocket not open');
      reconnect();
    }
  }, 15000);
  connectionMonitor = setInterval(() => {
    if (Date.now() - lastPong > 30000) {
      console.warn('[websocketservice.js] No PONG received for 30s, forcing reconnect');
      reconnect();
    }
  }, 30000);
};

const sendSipOptions = (extension) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  try {
    const callId = `call-${Math.random().toString(36).substr(2, 9)}`;
    const cseq = Math.floor(Math.random() * 10000);
    const sipMessage = [
      `OPTIONS sip:192.168.1.194:8088 SIP/2.0`,
      `Via: SIP/2.0/WS 192.168.1.126:5060;branch=z9hG4bK${Math.random().toString(36).substr(2, 9)}`,
      `From: "User ${extension}" <sip:${extension}@192.168.1.194:8088>;tag=${Math.random().toString(36).substr(2, 9)}`,
      `To: <sip:${extension}@192.168.1.194:8088>`,
      `Call-ID: ${callId}`,
      `CSeq: ${cseq} OPTIONS`,
      `Contact: <sip:${extension}@192.168.1.126;transport=ws>`,
      `Content-Length: 0`,
      `Max-Forwards: 70`,
      `\r\n`,
    ].join('\r\n');
    console.debug('[websocketservice.js] Sending SIP OPTIONS:', sipMessage);
    ws.send(sipMessage);
    console.log(`[websocketservice.js] Sent SIP OPTIONS for ${extension}`);
  } catch (error) {
    console.error('[websocketservice.js] Error sending SIP OPTIONS:', error);
  }
};

const sendSipRegister = (extension) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  try {
    const callId = `call-${Math.random().toString(36).substr(2, 9)}`;
    const cseq = Math.floor(Math.random() * 10000);
    const sipMessage = [
      `REGISTER sip:192.168.1.194:8088 SIP/2.0`,
      `Via: SIP/2.0/WS 192.168.1.126:5060;branch=z9hG4bK${Math.random().toString(36).substr(2, 9)}`,
      `From: "User ${extension}" <sip:${extension}@192.168.1.194:8088>;tag=${Math.random().toString(36).substr(2, 9)}`,
      `To: <sip:${extension}@192.168.1.194:8088>`,
      `Call-ID: ${callId}`,
      `CSeq: ${cseq} REGISTER`,
      `Contact: <sip:${extension}@192.168.1.126;transport=ws>`,
      `Content-Length: 0`,
      `Max-Forwards: 70`,
      `\r\n`,
    ].join('\r\n');
    console.debug('[websocketservice.js] Sending SIP REGISTER:', sipMessage);
    ws.send(sipMessage);
    console.log(`[websocketservice.js] Sent SIP REGISTER for ${extension}`);
  } catch (error) {
    console.error('[websocketservice.js] Error sending SIP REGISTER:', error);
  }
};

const reconnect = () => {
  reconnectAttempts++;
  const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttempts - 1), 30000);
  console.log(`[websocketservice.js] Reconnecting attempt ${reconnectAttempts} in ${delay}ms`);
  setTimeout(() => connectWebSocket(currentExtension, null, onStatusChange), delay);
};

export const connectWebSocket = async (extension, onMessage, statusCallback) => {
  if (!extension || !/^\d{4,6}$/.test(extension)) {
    console.error('[websocketservice.js] Invalid extension:', extension);
    return Promise.reject(new Error('Invalid extension'));
  }

  if (ws && ws.readyState === WebSocket.OPEN && currentExtension === extension) {
    console.log(`[websocketservice.js] WebSocket already connected for extension: ${extension}`);
    if (statusCallback) statusCallback('connected');
    return ws;
  }

  onStatusChange = statusCallback || (() => {});
  currentExtension = extension;
  updateStatus('connecting');

  if (!await checkBackendHealth()) {
    console.warn('[websocketservice.js] Proceeding despite health check failure');
    updateStatus('warning');
  }

  const connect = () => new Promise((resolve, reject) => {
    ws = new WebSocket(`${WS_URL}?extension=${extension}`, ['sip']);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      console.log(`[websocketservice.js] WebSocket connected for extension: ${extension}`);
      isConnected = true;
      reconnectAttempts = 0;
      lastPong = Date.now();
      updateStatus('connected');
      sendSipRegister(extension);
      startKeepAlive();
      resolve(ws);
    };

    ws.onmessage = (event) => {
      const data = event.data instanceof ArrayBuffer ? new TextDecoder().decode(event.data) : event.data.trim();
      if (data === 'PONG') {
        console.debug('[websocketservice.js] Received keep-alive PONG');
        lastPong = Date.now();
        reconnectAttempts = 0;
        return;
      }
      try {
        let message;
        try {
          message = JSON.parse(data);
        } catch {
          if (data.includes('SIP/2.0 401 Unauthorized')) {
            const nonceMatch = data.match(/nonce="([^"]+)"/);
            if (nonceMatch) {
              const nonce = nonceMatch[1];
              console.log('[websocketservice.js] Received nonce:', nonce);
              if (nonce === lastNonce && authAttempts >= maxAuthAttempts) {
                console.error('[websocketservice.js] Max authentication attempts reached for nonce:', nonce);
                reconnect();
                return;
              }
              if (nonce !== lastNonce) {
                authAttempts = 0;
                lastNonce = nonce;
              }
              authAttempts++;
              sendSipRegisterWithAuth(extension, nonce);
            }
          } else if (data.includes('SIP/2.0 200 OK')) {
            console.log('[websocketservice.js] SIP registration successful for extension:', extension);
            authAttempts = 0;
            lastNonce = null;
            reconnectAttempts = 0;
            lastPong = Date.now();
          } else if (data.includes('SIP/2.0 403 Forbidden')) {
            console.error('[websocketservice.js] Registration failed: 403 Forbidden for extension:', extension);
            reconnect();
            return;
          }
          return;
        }
        console.log('[websocketservice.js] WebSocket message:', message);
        if (message.type === 'incoming-call') {
          window.dispatchEvent(new CustomEvent('incomingCall', { detail: message }));
        }
        if (onMessage) onMessage(message);
      } catch (error) {
        console.error('[websocketservice.js] Error processing message:', error, 'Data:', data);
      }
    };

    ws.onerror = (error) => {
      console.error('[websocketservice.js] WebSocket error:', error);
      isConnected = false;
      updateStatus('error');
      reconnect();
    };

    ws.onclose = (event) => {
      console.warn(`[websocketservice.js] WebSocket closed, code: ${event.code}, reason: ${event.reason || 'none'}`);
      isConnected = false;
      updateStatus('disconnected');
      if (keepAliveInterval) clearInterval(keepAliveInterval);
      if (connectionMonitor) clearInterval(connectionMonitor);
      reconnect();
    };
  });

  return connect();
};

const sendSipRegisterWithAuth = (extension, nonce) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  try {
    const callId = `call-${Math.random().toString(36).substr(2, 9)}`;
    const cseq = Math.floor(Math.random() * 10000);
    const password = `password${extension}`;
    const digestResponse = computeDigestResponse(
      extension,
      password,
      'asterisk',
      'REGISTER',
      'sip:192.168.1.194:8088',
      nonce
    );
    const sipMessage = [
      `REGISTER sip:192.168.1.194:8088 SIP/2.0`,
      `Via: SIP/2.0/WS 192.168.1.126:5060;branch=z9hG4bK${Math.random().toString(36).substr(2, 9)}`,
      `From: "User ${extension}" <sip:${extension}@192.168.1.194:8088>;tag=${Math.random().toString(36).substr(2, 9)}`,
      `To: <sip:${extension}@192.168.1.194:8088>`,
      `Call-ID: ${callId}`,
      `CSeq: ${cseq} REGISTER`,
      `Contact: <sip:${extension}@192.168.1.126;transport=ws>`,
      `Authorization: Digest username="${extension}", realm="asterisk", nonce="${nonce}", uri="sip:192.168.1.194:8088", response="${digestResponse}"`,
      `Content-Length: 0`,
      `Max-Forwards: 70`,
      `\r\n`,
    ].join('\r\n');
    console.debug('[websocketservice.js] Sending authenticated SIP REGISTER:', sipMessage);
    ws.send(sipMessage);
    console.log(`[websocketservice.js] Sent authenticated SIP REGISTER for ${extension}, attempt ${authAttempts}/${maxAuthAttempts}`);
  } catch (error) {
    console.error('[websocketservice.js] Error sending authenticated SIP REGISTER:', error);
  }
};

export const sendWebSocketMessage = (message) => {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('[websocketservice.js] WebSocket not connected');
      reject(new Error('WebSocket not connected'));
      return;
    }
    try {
      ws.send(JSON.stringify(message));
      console.log('[websocketservice.js] WebSocket message sent:', message);
      resolve();
    } catch (error) {
      console.error('[websocketservice.js] Error sending WebSocket message:', error);
      reject(error);
    }
  });
};

export const getConnectionStatus = () => ({
  isConnected,
  extension: currentExtension,
});

const updateStatus = (status) => {
  if (onStatusChange) {
    onStatusChange(status);
  }
};