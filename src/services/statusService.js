import CONFIG from './config';

class StatusService {
  constructor() {
    this.heartbeatInterval = null;
    this.heartbeatFrequency = 30000; // 30 seconds
    this.isActive = false;
  }

  // Start heartbeat to keep user status active
  startHeartbeat() {
    if (this.heartbeatInterval) {
      this.stopHeartbeat();
    }

    this.isActive = true;
    this.sendHeartbeat(); // Send initial heartbeat

    this.heartbeatInterval = setInterval(() => {
      if (this.isActive) {
        this.sendHeartbeat();
      }
    }, this.heartbeatFrequency);

    console.log('Status heartbeat started');
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.isActive = false;
    console.log('Status heartbeat stopped');
  }

  // Send heartbeat to server
  async sendHeartbeat() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('[StatusService] No token for heartbeat, stopping');
        this.stopHeartbeat();
        return;
      }

      console.log(`[StatusService] Sending heartbeat to: ${CONFIG.API_URL}/protected/heartbeat`);

      const response = await fetch(`${CONFIG.API_URL}/protected/heartbeat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[StatusService] Heartbeat failed! status: ${response.status}, response: ${errorText}`);

        if (response.status === 401) {
          // Token expired, stop heartbeat
          console.warn('[StatusService] Token expired, stopping heartbeat');
          this.stopHeartbeat();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[StatusService] Heartbeat successful:', data);
      return data;
    } catch (error) {
      console.error('[StatusService] Heartbeat failed:', error);
      // Don't stop heartbeat on network errors, just log them
    }
  }

  // Update user status
  async updateStatus(status) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('[StatusService] No authentication token found');
        throw new Error('No authentication token');
      }

      console.log(`[StatusService] Updating status to: ${status}`);
      console.log(`[StatusService] Using API URL: ${CONFIG.API_URL}`);

      const response = await fetch(`${CONFIG.API_URL}/protected/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[StatusService] HTTP error! status: ${response.status}, response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[StatusService] Status updated successfully:`, data);

      // If setting to online, start heartbeat
      if (status === 'online' && !this.isActive) {
        this.startHeartbeat();
      } else if (status === 'offline') {
        this.stopHeartbeat();
      }

      return data;
    } catch (error) {
      console.error('[StatusService] Failed to update status:', error);
      throw error;
    }
  }

  // Set user online
  async setOnline() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[StatusService] Cannot set online status without authentication token');
      return;
    }
    return this.updateStatus('online');
  }

  // Set user offline
  async setOffline() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[StatusService] Cannot set offline status without authentication token');
      return;
    }
    return this.updateStatus('offline');
  }

  // Set user busy
  async setBusy() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[StatusService] Cannot set busy status without authentication token');
      return;
    }
    return this.updateStatus('busy');
  }

  // Set user away
  async setAway() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[StatusService] Cannot set away status without authentication token');
      return;
    }
    return this.updateStatus('away');
  }

  // Handle page visibility changes
  handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden, set to away
      this.setAway();
    } else {
      // Page is visible, set to online
      this.setOnline();
    }
  }

  // Initialize status tracking
  initialize() {
    // Check if user is authenticated before initializing
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[StatusService] Cannot initialize without authentication token');
      return;
    }

    console.log('[StatusService] Initializing status service...');

    // Start heartbeat when service initializes
    this.startHeartbeat();

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // Handle window focus/blur
    window.addEventListener('focus', () => {
      this.setOnline();
    });

    window.addEventListener('blur', () => {
      this.setAway();
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.setOffline();
    });

    // Handle browser close/refresh
    window.addEventListener('unload', () => {
      this.setOffline();
    });

    console.log('[StatusService] Status service initialized successfully');
  }

  // Cleanup
  cleanup() {
    this.stopHeartbeat();
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('focus', this.setOnline);
    window.removeEventListener('blur', this.setAway);
    window.removeEventListener('beforeunload', this.setOffline);
    window.removeEventListener('unload', this.setOffline);

    console.log('Status service cleaned up');
  }
}

// Create singleton instance
const statusService = new StatusService();

export default statusService;
