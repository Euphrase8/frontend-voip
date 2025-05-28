import axios from 'axios';
import { sendWebSocketMessage } from './websocketservice';
import { getToken } from './login';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.164:8080';

// Helper to convert API channel (PJSIP/1002) to app format (1002@:8088)
const toAppChannelFormat = (apiChannel, targetExtension) => {
  if (apiChannel && apiChannel.startsWith('PJSIP/')) {
    return `${targetExtension}@:8088`;
  }
  console.warn('[call.js] Unexpected API channel format:', apiChannel);
  return `${targetExtension}@:8088`; // Fallback
};

// Helper to convert app channel (1002@:8088) to API format (PJSIP/1002)
const toApiChannelFormat = (appChannel) => {
  if (appChannel && appChannel.endsWith('@:8088')) {
    const extension = appChannel.split('@')[0];
    return `PJSIP/${extension}`;
  }
  console.warn('[call.js] Invalid app channel format:', appChannel);
  return appChannel; // Fallback
};

export const initializeSIP = async (user, onIncomingCall) => {
  console.log('[call.js] initializeSIP is handled by SipClient.jsx');
  return null; // No-op, SIP is managed by SipClient.jsx
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

  try {
    console.log('[call.js] Initiating call to:', extension);
    const response = await axios.post(
      `${API_URL}/protected/call/initiate`,
      { target_extension: extension },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    if (response.status === 200 && response.data.message && response.data.channel) {
      console.log('[call.js] Call initiated:', response.data);
      return {
        message: response.data.message,
        priority: response.data.priority,
        channel: toAppChannelFormat(response.data.channel, extension), // e.g., 1002@:8088
      };
    } else {
      console.error('[call.js] Unexpected response:', response.data);
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    let message = 'Call initiation failed';
    if (error.response) {
      if (error.response.status === 400) {
        message = 'Invalid target extension';
      } else if (error.response.status === 401) {
        message = 'Unauthorized: Invalid token';
      } else if (error.response.status === 500) {
        message = 'Server error: Asterisk failure';
      }
      console.error('[call.js] Call initiation error:', error.response?.data || error.message);
    } else {
      console.error('[call.js] Call initiation error:', error.message);
    }
    throw new Error(message);
  }
};

export const answerCall = async (channel) => {
  const token = getToken();
  if (!token) {
    console.error('[call.js] No auth token found');
    throw new Error('Authentication required');
  }

  if (!channel || !channel.endsWith('@:8088')) {
    console.error('[call.js] Invalid channel format:', channel);
    throw new Error('Invalid channel format');
  }

  const apiChannel = toApiChannelFormat(channel); // Convert to PJSIP/1002

  try {
    console.log('[call.js] Answering call for channel:', channel);
    const response = await axios.post(
      `${API_URL}/protected/call/answer`,
      { channel: apiChannel },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    if (response.status === 200 && response.data.message) {
      console.log('[call.js] Call answered:', response.data);
      return response.data; // { message }
    } else {
      console.error('[call.js] Unexpected response:', response.data);
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    let message = 'Answer call failed';
    if (error.response) {
      if (error.response.status === 400) {
        message = 'Invalid or non-existent channel';
      } else if (error.response.status === 401) {
        message = 'Unauthorized: Invalid token';
      } else if (error.response.status === 500) {
        message = 'Server error: Asterisk failure';
      }
      console.error('[call.js] Answer call error:', error.response?.data || error.message);
    } else {
      console.error('[call.js] Answer call error:', error.message);
    }
    throw new Error(message);
  }
};

export const hangupCall = async (channel) => {
  const token = getToken();
  if (!token) {
    console.error('[call.js] No auth token found');
    throw new Error('Authentication required');
  }

  if (!channel || !channel.endsWith('@:8088')) {
    console.error('[call.js] Invalid channel format:', channel);
    throw new Error('Invalid channel format');
  }

  const apiChannel = toApiChannelFormat(channel); // Convert to PJSIP/1002

  try {
    // Notify via WebSocket for consistency
    await sendWebSocketMessage({
      type: 'hangup',
      channel: apiChannel,
    });

    console.log('[call.js] Hanging up call for channel:', channel);
    const response = await axios.post(
      `${API_URL}/protected/call/hangup`,
      { channel: apiChannel },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    if (response.status === 200 && response.data.message) {
      console.log('[call.js] Call hung up:', response.data);
      return response.data; // { message }
    } else {
      console.error('[call.js] Unexpected response:', response.data);
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    let message = 'Hangup failed';
    if (error.response) {
      if (error.response.status === 400) {
        message = 'Invalid or non-existent channel';
      } else if (error.response.status === 401) {
        message = 'Unauthorized: Invalid token';
      } else if (error.response.status === 500) {
        message = 'Server error: Asterisk failure';
      }
      console.error('[call.js] Hangup error:', error.response?.data || error.message);
    } else {
      console.error('[call.js] Hangup error:', error.message);
    }
    throw new Error(message);
  }
};