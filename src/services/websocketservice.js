import axios from 'axios';

let socket = null;
let reconnectAttempts = 0;
let maxReconnectAttempts = 5;
let reconnectTimeout = null;
let connectionTimeout = null;
let isConnected = false;
let onStatusChange = null;

const API_URL = 'http://192.168.1.164:8080';
const DEFAULT_WS_URL = 'ws://192.168.1.194:8088/ws';
const CONNECTION_TIMEOUT = 10000;
const MAX_RECONNECT_DELAY = 30000;

export const connectWebSocket = async (extension, onMessage, statusCallback) => {
  if (!extension) {
    console.error('Extension is required for WebSocket connection.');
    return Promise.reject(new Error('Missing extension'));
  }

  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log('WebSocket already connected for extension:', extension);
    return Promise.resolve(socket);
  }

  onStatusChange = statusCallback;
  updateStatus('connecting');

  // Fetch WebSocket port from /health API
  let wsUrl = DEFAULT_WS_URL;
  try {
    const response = await axios.post(`${API_URL}/health`, {
      kali_ip: '192.168.1.194',
      ssh_port: '22',
      ssh_user: 'kali',
      ssh_password: 'kali',
    }, { timeout: 10000 });
    if (response.data.status === 'success' && response.data.ports.websocket) {
      wsUrl = `ws://192.168.1.194:${response.data.ports.websocket}/ws`;
    } else {
      console.warn('Using default WebSocket URL; /health API did not return valid port.');
    }
  } catch (error) {
    console.error('Failed to fetch WebSocket port from /health:', error.message);
    console.warn('Falling back to default WebSocket URL:', wsUrl);
  }

  // Append extension to WebSocket URL
  const finalWsUrl = `${wsUrl}?extension=${extension}`;
  socket = new WebSocket(finalWsUrl);

  return new Promise((resolve, reject) => {
    // Start a connection timeout timer
    connectionTimeout = setTimeout(() => {
      if (!isConnected) {
        console.error('WebSocket connection timed out for URL:', finalWsUrl);
        safeCloseSocket();
        updateStatus('disconnected');
        reject(new Error('Connection timeout'));
      }
    }, CONNECTION_TIMEOUT);

    socket.onopen = () => {
      console.log('✅ WebSocket connection established for extension:', extension, 'at', finalWsUrl);
      clearTimeout(connectionTimeout);
      reconnectAttempts = 0;
      isConnected = true;
      updateStatus('connected');
      resolve(socket);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📩 WebSocket message received:', data);
        if (onMessage) onMessage(data);
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error, event.data);
      }
    };

    socket.onerror = (error) => {
      console.error('🚨 WebSocket error for URL:', finalWsUrl, error);
      isConnected = false;
      updateStatus('error');
      safeCloseSocket();
      attemptReconnect(extension, onMessage, reject);
    };

    socket.onclose = () => {
      console.log('🔌 WebSocket connection closed for URL:', finalWsUrl);
      isConnected = false;
      safeCloseSocket();
      updateStatus('disconnected');
      attemptReconnect(extension, onMessage);
    };
  });
};

const attemptReconnect = (extension, onMessage, reject = null) => {
  if (reconnectAttempts >= maxReconnectAttempts) {
    console.error('❌ Max reconnect attempts reached.');
    if (reject) reject(new Error('Max reconnect attempts reached'));
    return;
  }

  if (reconnectTimeout) return; // prevent multiple reconnect timers

  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  console.log(`🔄 Reconnecting in ${delay}ms... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
  reconnectAttempts++;

  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    connectWebSocket(extension, onMessage, onStatusChange)
      .catch((err) => console.error('Reconnect failed:', err));
  }, delay);
};

const safeCloseSocket = () => {
  if (socket && socket.readyState !== WebSocket.CLOSED) {
    try {
      socket.close();
    } catch (e) {
      console.warn('Error while closing socket:', e);
    }
  }
  socket = null;
  clearTimeout(reconnectTimeout);
  clearTimeout(connectionTimeout);
};

export const sendWebSocketMessage = (message, retries = 3, delay = 1000) => {
  return new Promise((resolve, reject) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      if (retries > 0) {
        console.warn(`WebSocket not open, retrying in ${delay}ms (${retries} retries left)...`);
        setTimeout(() => {
          sendWebSocketMessage(message, retries - 1, delay).then(resolve).catch(reject);
        }, delay);
        return;
      }
      console.error('WebSocket is not open.');
      return reject(new Error('WebSocket not open'));
    }

    try {
      socket.send(JSON.stringify(message));
      console.log('📤 WebSocket message sent:', message);
      resolve();
    } catch (error) {
      console.error('❌ Error sending WebSocket message:', error);
      if (retries > 0) {
        setTimeout(() => {
          sendWebSocketMessage(message, retries - 1, delay).then(resolve).catch(reject);
        }, delay);
      } else {
        reject(error);
      }
    }
  });
};

export const getWebSocket = () => socket;

export const getConnectionStatus = () => ({
  isConnected,
  reconnectAttempts,
  maxReconnectAttempts,
});

export const closeWebSocket = () => {
  safeCloseSocket();
  reconnectAttempts = 0;
  isConnected = false;
  updateStatus('disconnected');
  console.log('👋 WebSocket connection closed manually.');
};

const updateStatus = (status) => {
  if (onStatusChange) {
    onStatusChange(status);
  }
};