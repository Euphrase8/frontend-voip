import { CONFIG } from './config';

let socket = null;
let reconnectTimeout = null;
let reconnectAttempts = 0;
let currentExtension = null;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 5000;

export const connectWebSocket = (extension = null, url = CONFIG.WS_URL) => {
  // Use provided extension or get from localStorage
  const targetExtension = extension || localStorage.getItem('extension');

  if (socket && socket.readyState === WebSocket.OPEN && currentExtension === targetExtension) {
    console.log('[websocketservice] WebSocket already open for extension:', targetExtension);
    return socket;
  }

  // Close existing connection if extension changed
  if (socket && currentExtension !== targetExtension) {
    console.log('[websocketservice] Extension changed, closing existing connection');
    socket.close();
    socket = null;
  }

  currentExtension = targetExtension;
  const wsUrl = targetExtension ? `${url}?extension=${encodeURIComponent(targetExtension)}` : url;

  console.log(`[websocketservice] Connecting WebSocket to ${wsUrl}`);
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log(`[websocketservice] ✅ WebSocket connected for extension ${currentExtension || 'unknown'}`);
    console.log(`[websocketservice] WebSocket URL: ${wsUrl}`);
    console.log(`[websocketservice] WebSocket readyState: ${socket.readyState}`);
    reconnectAttempts = 0;
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  };

  socket.onerror = (err) => {
    console.error('[websocketservice] WebSocket error:', err);
  };

  socket.onclose = (event) => {
    console.warn(`[websocketservice] WebSocket closed with code ${event.code}: ${event.reason || 'No reason provided'}`);
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts += 1;
      console.log(`[websocketservice] Reconnecting (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${RECONNECT_INTERVAL}ms...`);
      reconnectTimeout = setTimeout(() => {
        connectWebSocket(currentExtension, url);
      }, RECONNECT_INTERVAL);
    } else {
      console.error('[websocketservice] Max reconnect attempts reached. Giving up.');
    }
  };

  return socket;
};

export const sendWebSocketMessage = async (message) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('[websocketservice] WebSocket not connected. Attempting to reconnect...');
    connectWebSocket();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected after retry');
    }
  }

  // Validate and log message
  let messageStr;
  try {
    if (typeof message !== 'object') {
      console.error('[websocketservice] Invalid message: must be an object', message);
      throw new Error('Message must be a valid JSON object');
    }
    messageStr = JSON.stringify(message);
    console.log('[websocketservice] Sending message:', messageStr);
  } catch (error) {
    console.error('[websocketservice] Failed to stringify message:', error, 'Message:', message);
    throw error;
  }

  try {
    socket.send(messageStr);
  } catch (error) {
    console.error('[websocketservice] Failed to send message via WebSocket:', error, 'Message:', messageStr);
    throw error;
  }
};

export const getWebSocket = () => socket;

export const getConnectionStatus = () => {
  const status = {
    isConnected: socket && socket.readyState === WebSocket.OPEN,
    extension: currentExtension,
    readyState: socket ? socket.readyState : WebSocket.CLOSED
  };

  if (!socket) {
    status.state = 'CLOSED';
  } else {
    switch (socket.readyState) {
      case WebSocket.CONNECTING:
        status.state = 'CONNECTING';
        break;
      case WebSocket.OPEN:
        status.state = 'OPEN';
        break;
      case WebSocket.CLOSING:
        status.state = 'CLOSING';
        break;
      case WebSocket.CLOSED:
        status.state = 'CLOSED';
        break;
      default:
        status.state = 'UNKNOWN';
    }
  }

  return status;
};

// Close WebSocket connection
export const closeWebSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
    currentExtension = null;
  }
};
