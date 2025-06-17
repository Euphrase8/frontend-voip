let socket = null;
let reconnectTimeout = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 5000;

export const connectWebSocket = (url = process.env.REACT_APP_WS_URL || 'ws://172.20.10.3:8080/ws') => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log('[websocketservice] WebSocket already open, reusing connection');
    return socket;
  }

  // Append extension to URL if available (e.g., from localStorage)
  const extension = localStorage.getItem('extension');
  const wsUrl = extension ? `${url}?extension=${encodeURIComponent(extension)}` : url;

  console.log(`[websocketservice] Connecting WebSocket to ${wsUrl}`);
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log(`[websocketservice] WebSocket connected for extension ${extension || 'unknown'}`);
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
        connectWebSocket(url);
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
  if (!socket) return 'CLOSED';
  switch (socket.readyState) {
    case WebSocket.CONNECTING:
      return 'CONNECTING';
    case WebSocket.OPEN:
      return 'OPEN';
    case WebSocket.CLOSING:
      return 'CLOSING';
    case WebSocket.CLOSED:
      return 'CLOSED';
    default:
      return 'UNKNOWN';
  }
};
