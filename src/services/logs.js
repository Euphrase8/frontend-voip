import axios from 'axios';
import { getToken } from './login';
import { CONFIG } from './config';

const API_URL = CONFIG.API_URL;

export const getLogs = async () => {
  try {
    const token = getToken(); // Make sure this returns a valid JWT string
    const response = await axios.get(`${API_URL}/protected/call/logs`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    return response.data.map(log => ({
      id: log.ID,
      contact: `Extension ${log.ReceiverID}`,
      extension: log.ReceiverID,
      time: new Date(log.CreatedAt).toLocaleString(),
      duration: formatDuration(log.Duration),
      status: capitalize(log.Status),
      priority: log.Priority
    }));
  } catch (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
};


function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
