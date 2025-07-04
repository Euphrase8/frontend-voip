// Backup Service
// Handles communication with backend for backup and restore operations

import { CONFIG } from './config';

class BackupService {
  constructor() {
    this.baseURL = CONFIG.API_URL;
    this.activeOperations = new Map();
    this.listeners = new Set();
  }

  // Get authentication headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Create a new backup
  async createBackup(options = {}) {
    try {
      const backupRequest = {
        include_database: options.includeDatabase !== false,
        include_config: options.includeConfig !== false,
        include_call_logs: options.includeCallLogs !== false,
        backup_name: options.backupName || `Backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`
      };

      const response = await fetch(`${this.baseURL}/protected/admin/backup`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(backupRequest)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create backup');
      }

      // Start monitoring the backup progress
      this.monitorOperation(data.backup_id, 'backup');

      return {
        id: data.backup_id,
        status: data.status,
        message: data.message
      };
    } catch (error) {
      console.error('[BackupService] Failed to create backup:', error);
      throw error;
    }
  }

  // Get backup status
  async getBackupStatus(backupId) {
    try {
      const response = await fetch(`${this.baseURL}/protected/admin/backup/status/${backupId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to get backup status');
      }

      return data.status;
    } catch (error) {
      console.error('[BackupService] Failed to get backup status:', error);
      throw error;
    }
  }

  // List all available backups
  async listBackups() {
    try {
      const response = await fetch(`${this.baseURL}/protected/admin/backups`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[BackupService] Raw API response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to list backups');
      }

      if (!data.backups || !Array.isArray(data.backups)) {
        console.error('[BackupService] Invalid backups data:', data);
        throw new Error('Invalid backup data received from server');
      }

      return data.backups.map((backup, index) => {
        console.log(`[BackupService] Processing backup ${index}:`, backup);
        console.log(`[BackupService] Backup ID: "${backup.id}" (type: ${typeof backup.id})`);

        // Ensure ID is a string
        const backupId = backup.id ? String(backup.id) : null;

        if (!backupId) {
          console.error(`[BackupService] Backup ${index} has no valid ID:`, backup);
        }

        return {
          id: backupId,
          name: backup.name || backupId,
          createdAt: new Date(backup.created_at),
          size: backup.size || 0,
          formattedSize: this.formatBytes(backup.size || 0),
          status: backup.status || 'unknown',
          components: backup.components || [],
          description: backup.description || ''
        };
      }).filter(backup => backup.id); // Filter out backups without valid IDs
    } catch (error) {
      console.error('[BackupService] Failed to list backups:', error);
      throw error;
    }
  }

  // Download a backup
  async downloadBackup(backupId) {
    try {
      console.log('[BackupService] Downloading backup with ID:', backupId, 'Type:', typeof backupId);

      // Validate backupId
      if (!backupId || typeof backupId !== 'string') {
        throw new Error(`Invalid backup ID: ${backupId} (type: ${typeof backupId})`);
      }

      const response = await fetch(`${this.baseURL}/protected/admin/backup/download/${backupId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backupId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return true;
    } catch (error) {
      console.error('[BackupService] Failed to download backup:', error);
      throw error;
    }
  }

  // Delete a backup
  async deleteBackup(backupId) {
    try {
      const response = await fetch(`${this.baseURL}/protected/admin/backup/${backupId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete backup');
      }

      return data.message;
    } catch (error) {
      console.error('[BackupService] Failed to delete backup:', error);
      throw error;
    }
  }

  // Restore from backup
  async restoreBackup(backupId) {
    try {
      const response = await fetch(`${this.baseURL}/protected/admin/backup/restore/${backupId}`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to start restore');
      }

      // Start monitoring the restore progress
      this.monitorOperation(data.restore_id, 'restore');

      return {
        id: data.restore_id,
        status: data.status,
        message: data.message
      };
    } catch (error) {
      console.error('[BackupService] Failed to restore backup:', error);
      throw error;
    }
  }

  // Monitor backup/restore operation progress
  async monitorOperation(operationId, type) {
    if (this.activeOperations.has(operationId)) {
      return; // Already monitoring
    }

    const monitor = setInterval(async () => {
      try {
        const status = await this.getBackupStatus(operationId);
        
        // Notify listeners
        this.notifyListeners('operation_update', {
          id: operationId,
          type,
          status
        });

        // Stop monitoring if operation is complete
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(monitor);
          this.activeOperations.delete(operationId);
          
          this.notifyListeners('operation_complete', {
            id: operationId,
            type,
            status
          });
        }
      } catch (error) {
        console.error('[BackupService] Error monitoring operation:', error);
        clearInterval(monitor);
        this.activeOperations.delete(operationId);
        
        this.notifyListeners('operation_error', {
          id: operationId,
          type,
          error
        });
      }
    }, 2000); // Check every 2 seconds

    this.activeOperations.set(operationId, monitor);
  }

  // Add event listener
  addEventListener(callback) {
    this.listeners.add(callback);
  }

  // Remove event listener
  removeEventListener(callback) {
    this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners(type, data) {
    this.listeners.forEach(callback => {
      try {
        callback({ type, data });
      } catch (error) {
        console.error('[BackupService] Listener error:', error);
      }
    });
  }

  // Format bytes to human readable format
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get backup status color
  getStatusColor(status) {
    switch (status) {
      case 'completed':
        return 'green';
      case 'creating':
      case 'restoring':
        return 'blue';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  }

  // Get backup status icon
  getStatusIcon(status) {
    switch (status) {
      case 'completed':
        return '✅';
      case 'creating':
      case 'restoring':
        return '🔄';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  }

  // Validate backup options
  validateBackupOptions(options) {
    const errors = [];
    
    if (options.backupName && options.backupName.length > 100) {
      errors.push('Backup name must be less than 100 characters');
    }
    
    if (options.backupName && !/^[a-zA-Z0-9_\-\s]+$/.test(options.backupName)) {
      errors.push('Backup name can only contain letters, numbers, spaces, hyphens, and underscores');
    }
    
    return errors;
  }

  // Get backup recommendations
  getBackupRecommendations() {
    return [
      'Create regular backups to prevent data loss',
      'Include database and configuration in backups',
      'Store backups in a secure location',
      'Test restore procedures regularly',
      'Keep multiple backup versions',
      'Monitor backup completion status'
    ];
  }

  // Cleanup completed operations
  cleanup() {
    this.activeOperations.forEach((monitor, operationId) => {
      clearInterval(monitor);
    });
    this.activeOperations.clear();
    this.listeners.clear();
  }
}

// Create singleton instance
const backupService = new BackupService();

export default backupService;
