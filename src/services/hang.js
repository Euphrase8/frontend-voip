import axios from 'axios';
import { getToken } from './login';

const API_URL = process.env.REACT_APP_API_URL || 'http://172.20.10.8:8080';

export const hangup = async (channel) => {
  try {
    const response = await axios.post(
      `${API_URL}/protected/call/hangup`,
      { channel },
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`[hang.js] Call hung up for channel ${channel}`);
    return response.data;
  } catch (error) {
    console.error(`[hang.js] Error hanging up call for channel ${channel}:`, error);
    throw new Error(`Failed to hang up call: ${error.message}`);
  }
};