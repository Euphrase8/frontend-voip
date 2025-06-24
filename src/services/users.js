import axios from 'axios';
import { getToken } from './login';

const API_URL = "http://172.20.10.3:8080";
const WS_URL = "ws://172.20.10.6:8080/ws";

export const getUsers = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_URL}/protected/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // Response format: { users: ["user1", "user2", "admin1"] }
    return response.data.extensions.map((name, index) => ({
      id: index + 1,
      name,
      extension: `10${index + 1}`,
      priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
      status: 'online',
      avatar: `https://via.placeholder.com/40/22c55e/fff?text=${name.charAt(0).toUpperCase()}`,
    }));
  } catch (error) {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        throw new Error('Invalid JWT');
      } else if (status === 403) {
        throw new Error('Non-admin user');
      }
    }
    throw new Error('Failed to fetch users');
  }
};

export const setupWebSocket = (extension, onIncomingCall, onError) => {
  const ws = new WebSocket(`${WS_URL}?userID=${extension}`);

  ws.onopen = () => {
    console.log(`WebSocket connected for user: ${extension}`);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'incoming-call') {
        onIncomingCall(data);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    onError('WebSocket connection failed');
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    onError('WebSocket connection closed');
  };

  return ws;
};

export const sendWebSocketMessage = (ws, to, message) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ to, message }));
  } else {
    console.error('WebSocket is not open');
  }
};