import axios from 'axios';
import { getToken } from './login';
import { CONFIG } from './config';

const API_URL = CONFIG.API_URL;

export const getLogs = async (limit = 100) => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_URL}/protected/call/logs?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    // Handle both old and new API response formats
    const logs = response.data.call_logs || response.data || [];

    return logs.map(log => ({
      id: log.id || log.ID,
      callerId: log.caller_id || log.CallerID,
      calleeId: log.callee_id || log.CalleeID,
      caller: log.caller || { username: `User ${log.CallerID}`, extension: log.CallerID },
      callee: log.callee || { username: `User ${log.CalleeID}`, extension: log.CalleeID },
      startTime: log.start_time || log.StartTime || log.CreatedAt,
      endTime: log.end_time || log.EndTime,
      duration: log.duration || log.Duration || 0,
      status: log.status || log.Status || 'unknown',
      channel: log.channel || log.Channel,
      direction: log.direction || log.Direction || 'unknown',
      createdAt: log.created_at || log.CreatedAt,

      // Legacy format for backward compatibility
      contact: log.caller ? `${log.caller.username} → ${log.callee.username}` : `Extension ${log.CallerID} → ${log.CalleeID}`,
      extension: log.callee?.extension || log.CalleeID,
      time: new Date(log.start_time || log.StartTime || log.CreatedAt).toLocaleString(),
      formattedDuration: formatDuration(log.duration || log.Duration || 0),
      priority: log.priority || log.Priority || 'normal'
    }));
  } catch (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
};

// Get comprehensive call logs with detailed information
export const getDetailedCallLogs = async (limit = 100, filters = {}) => {
  try {
    const token = getToken();
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      ...filters
    });

    const response = await axios.get(`${API_URL}/protected/call/logs?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    const logs = response.data.call_logs || response.data || [];

    return logs.map(log => ({
      id: log.id || log.ID,
      caller: {
        id: log.caller_id || log.CallerID,
        username: log.caller?.username || `User ${log.caller_id || log.CallerID}`,
        extension: log.caller?.extension || log.caller_id || log.CallerID,
        email: log.caller?.email
      },
      callee: {
        id: log.callee_id || log.CalleeID,
        username: log.callee?.username || `User ${log.callee_id || log.CalleeID}`,
        extension: log.callee?.extension || log.callee_id || log.CalleeID,
        email: log.callee?.email
      },
      timing: {
        startTime: log.start_time || log.StartTime,
        endTime: log.end_time || log.EndTime,
        duration: log.duration || log.Duration || 0,
        formattedDuration: formatDuration(log.duration || log.Duration || 0),
        createdAt: log.created_at || log.CreatedAt
      },
      call: {
        status: log.status || log.Status || 'unknown',
        channel: log.channel || log.Channel,
        direction: log.direction || log.Direction || 'unknown',
        priority: log.priority || log.Priority || 'normal'
      },
      display: {
        participants: log.caller ? `${log.caller.username} → ${log.callee.username}` : `${log.caller_id || log.CallerID} → ${log.callee_id || log.CalleeID}`,
        extensions: log.caller ? `${log.caller.extension} → ${log.callee.extension}` : `${log.caller_id || log.CallerID} → ${log.callee_id || log.CalleeID}`,
        time: new Date(log.start_time || log.StartTime || log.CreatedAt).toLocaleString(),
        date: new Date(log.start_time || log.StartTime || log.CreatedAt).toLocaleDateString(),
        timeOnly: new Date(log.start_time || log.StartTime || log.CreatedAt).toLocaleTimeString()
      }
    }));
  } catch (error) {
    console.error("Error fetching detailed logs:", error);
    return [];
  }
};

// Delete call log (admin only)
export const deleteCallLog = async (logId) => {
  try {
    const token = getToken();
    const response = await axios.delete(`${API_URL}/protected/admin/call-logs/${logId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting call log:", error);
    throw error;
  }
};

// Bulk delete call logs (admin only)
export const bulkDeleteCallLogs = async (logIds) => {
  try {
    const token = getToken();
    const response = await axios.delete(`${API_URL}/protected/admin/call-logs/bulk-delete`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: { log_ids: logIds }
    });
    return response.data;
  } catch (error) {
    console.error("Error bulk deleting call logs:", error);
    throw error;
  }
};

// Export call logs (admin only)
export const exportCallLogs = async (format = 'csv') => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_URL}/protected/admin/export/call-logs?format=${format}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `call-logs-${new Date().toISOString().split('T')[0]}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Error exporting call logs:", error);
    throw error;
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
