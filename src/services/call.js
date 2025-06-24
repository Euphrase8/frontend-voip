import axios from 'axios';
import { sendWebSocketMessage } from './websocketservice';
import { getToken } from './login';

const API_URL = process.env.REACT_APP_API_URL || 'http://172.20.10.3:8080';
const MEDIA_CONSTRAINTS = { audio: true, video: false };

export const toAppChannelFormat = (apiChannel) => {
  const ext = apiChannel?.replace(/^PJSIP\//, '');
  return `${ext}@172.20.10.6:8088`;
};

export const toApiChannelFormat = (appChannel) => {
  const [ext] = appChannel?.split('@') || [];
  return `PJSIP/${ext}`;
};

const getAuthHeaders = () => {
  const token = getToken();
  if (!token) throw new Error('Authentication token is missing.');
  return { Authorization: `Bearer ${token}` };
};

export const getAppMediaStream = async () => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("getUserMedia is not supported in this browser or not available over HTTP.");
    }
    const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
    return stream;
  } catch (err) {
    console.error('[call.js] Failed to access microphone:', err);
    throw err;
  }
};

export const call = async (extension) => {
  if (!/^\d{4,6}$/.test(extension)) {
    throw new Error(`Invalid extension "${extension}". Must be 4-6 digits.`);
  }
  const { data } = await axios.post(
    `${API_URL}/protected/call/initiate`,
    { target_extension: extension },
    { headers: getAuthHeaders() }
  );
  const stream = await getAppMediaStream();
  return {
    apiChannel: data.channel,
    appChannel: toAppChannelFormat(data.channel),
    message: data.message,
    priority: data.priority,
    stream,
  };
};

export const answerCall = async (appChannel) => {
  if (!appChannel || !appChannel.includes('@')) {
    throw new Error('Invalid appChannel format. Expected ext@host.');
  }
  const apiChannel = toApiChannelFormat(appChannel);
  const { data } = await axios.post(
    `${API_URL}/protected/call/answer`,
    { channel: apiChannel },
    { headers: getAuthHeaders() }
  );
  const stream = await getAppMediaStream();
  return {
    apiChannel,
    message: data.message,
    stream,
  };
};

export const hangupCall = async (appChannel) => {
  if (!appChannel || !appChannel.includes('@')) {
    throw new Error('Invalid appChannel format. Expected ext@host.');
  }
  const apiChannel = toApiChannelFormat(appChannel);
  try {
    await sendWebSocketMessage({ type: 'hangup', channel: apiChannel });
  } catch (wsError) {
    console.warn('[call.js] WebSocket hangup message failed:', wsError);
  }
  const { data } = await axios.post(
    `${API_URL}/protected/call/hangup`,
    { channel: apiChannel },
    { headers: getAuthHeaders() }
  );
  return { message: data.message };
};

export const initializeSIP = async ({ extension }, onIncomingCall) => {
  console.log(`[initializeSIP] Registering SIP for extension: ${extension}`);
  // Placeholder for real SIP library integration (e.g., JsSIP)
  localStorage.setItem(`sipRegistered_${extension}`, 'true');
  setTimeout(() => {
    onIncomingCall?.({ from: '1001', message: 'Incoming call simulated' });
  }, 1000);
};