import axios from 'axios';
import { getToken } from './login';

const API_URL = "http://192.168.1.164:8080";

export const hangup = async (channel) => {
  try {
    const token = getToken(); // Make sure this returns a valid JWT string
    const response = await axios.post(
      `${API_URL}/protected/call/hangup`,
      { channel },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      const { status } = error.response;
      if (status === 400) {
        throw new Error('Missing channel');
      } else if (status === 401) {
        throw new Error('Invalid JWT');
      } else if (status === 500) {
        throw new Error('AMI failure');
      }
    }
    throw new Error('Failed to hang up call');
  }
};