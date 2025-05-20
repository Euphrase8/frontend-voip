// services/hang.js
import axios from 'axios';
import { getToken } from './login';

const API_URL = 'http://192.168.1.164:8080';

export const hangup = async (channel) => {
  try {
    const token = getToken();
    const response = await axios.post(
      `${API_URL}/protected/call/hangup`,
      { channel },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Hangup error:', error);
    throw error;
  }
};