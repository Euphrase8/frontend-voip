// System Health Service
// Handles communication with backend for system health monitoring

import { CONFIG } from './config';

class SystemHealthService {
  constructor() {
    this.baseURL = CONFIG.API_URL;
    this.healthCheckInterval = null;
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

  // Get comprehensive system health
  async getSystemHealth() {
    try {
      const response = await fetch(`${this.baseURL}/protected/admin/health`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to get system health');
      }

      return data.health;
    } catch (error) {
      console.error('[SystemHealthService] Failed to get system health:', error);
      throw error;
    }
  }

  // Get real-time metrics
  async getRealTimeMetrics() {
    try {
      const response = await fetch(`${this.baseURL}/protected/admin/metrics/realtime`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to get real-time metrics');
      }

      return data.metrics;
    } catch (error) {
      console.error('[SystemHealthService] Failed to get real-time metrics:', error);
      throw error;
    }
  }

  // Start automatic health monitoring
  startHealthMonitoring(intervalMs = 30000) {
    if (this.healthCheckInterval) {
      this.stopHealthMonitoring();
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getSystemHealth();
        this.notifyListeners('health_update', health);
      } catch (error) {
        this.notifyListeners('health_error', error);
      }
    }, intervalMs);

    console.log('[SystemHealthService] Started health monitoring');
  }

  // Stop automatic health monitoring
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('[SystemHealthService] Stopped health monitoring');
    }
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
        console.error('[SystemHealthService] Listener error:', error);
      }
    });
  }

  // Format system health data for display
  formatHealthData(health) {
    return {
      status: health.status,
      timestamp: health.timestamp,
      uptime: health.uptime,
      services: {
        asterisk: {
          status: health.services.asterisk?.status || 'unknown',
          responseTime: health.services.asterisk?.response_time_ms || 0,
          error: health.services.asterisk?.error
        },
        database: {
          status: health.services.database?.status || 'unknown',
          responseTime: health.services.database?.response_time_ms || 0,
          connections: health.services.database?.details?.open_connections || 0
        },
        websocket: {
          status: health.services.websocket?.status || 'unknown',
          clients: health.services.websocket?.details?.active_clients || 0,
          extensions: health.services.websocket?.details?.connected_extensions || 0
        },
        backend: {
          status: health.services.backend?.status || 'healthy',
          goroutines: health.services.backend?.details?.goroutines || 0,
          memoryUsage: health.services.backend?.details?.memory_usage || 0
        }
      },
      metrics: {
        cpu: {
          usage: health.system_metrics?.cpu?.usage_percent || 0,
          cores: health.system_metrics?.cpu?.cores || 1
        },
        memory: {
          total: health.system_metrics?.memory?.total_bytes || 0,
          used: health.system_metrics?.memory?.used_bytes || 0,
          usagePercent: health.system_metrics?.memory?.usage_percent || 0
        },
        disk: {
          total: health.system_metrics?.disk?.total_bytes || 0,
          used: health.system_metrics?.disk?.used_bytes || 0,
          usagePercent: health.system_metrics?.disk?.usage_percent || 0
        },
        network: {
          wsClients: health.system_metrics?.network?.websocket_clients || 0
        }
      },
      database: {
        status: health.database_health?.status || 'unknown',
        totalUsers: health.database_health?.total_users || 0,
        activeCalls: health.database_health?.active_calls || 0,
        callLogsCount: health.database_health?.call_logs_count || 0,
        size: health.database_health?.database_size || '0 B'
      }
    };
  }

  // Get status color based on health status
  getStatusColor(status) {
    switch (status) {
      case 'healthy':
        return 'green';
      case 'warning':
        return 'yellow';
      case 'unhealthy':
      case 'critical':
        return 'red';
      default:
        return 'gray';
    }
  }

  // Get status icon based on health status
  getStatusIcon(status) {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'unhealthy':
      case 'critical':
        return '❌';
      default:
        return '❓';
    }
  }

  // Format bytes to human readable format
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Format percentage with color coding
  formatPercentage(percent, warningThreshold = 70, criticalThreshold = 90) {
    const rounded = Math.round(percent);
    let color = 'text-green-600';
    
    if (percent >= criticalThreshold) {
      color = 'text-red-600';
    } else if (percent >= warningThreshold) {
      color = 'text-yellow-600';
    }
    
    return {
      value: rounded,
      formatted: `${rounded}%`,
      color
    };
  }

  // Check if system needs attention
  needsAttention(health) {
    if (!health) return false;
    
    // Check overall status
    if (health.status === 'unhealthy' || health.status === 'critical') {
      return true;
    }
    
    // Check individual metrics
    const metrics = health.system_metrics;
    if (metrics) {
      if (metrics.cpu?.usage_percent > 90) return true;
      if (metrics.memory?.usage_percent > 95) return true;
      if (metrics.disk?.usage_percent > 95) return true;
    }
    
    // Check services
    const services = health.services;
    if (services) {
      for (const service of Object.values(services)) {
        if (service.status === 'unhealthy' || service.status === 'critical') {
          return true;
        }
      }
    }
    
    return false;
  }

  // Get health summary for dashboard
  getHealthSummary(health) {
    if (!health) {
      return {
        status: 'unknown',
        message: 'Health data not available',
        issues: []
      };
    }
    
    const issues = [];
    
    // Check services
    Object.entries(health.services || {}).forEach(([name, service]) => {
      if (service.status === 'unhealthy' || service.status === 'critical') {
        issues.push(`${name.charAt(0).toUpperCase() + name.slice(1)} service is ${service.status}`);
      }
    });
    
    // Check metrics
    const metrics = health.system_metrics;
    if (metrics) {
      if (metrics.cpu?.usage_percent > 90) {
        issues.push(`High CPU usage: ${Math.round(metrics.cpu.usage_percent)}%`);
      }
      if (metrics.memory?.usage_percent > 90) {
        issues.push(`High memory usage: ${Math.round(metrics.memory.usage_percent)}%`);
      }
      if (metrics.disk?.usage_percent > 90) {
        issues.push(`High disk usage: ${Math.round(metrics.disk.usage_percent)}%`);
      }
    }
    
    let status = health.status;
    let message = 'System is running normally';
    
    if (issues.length > 0) {
      message = `${issues.length} issue${issues.length > 1 ? 's' : ''} detected`;
    }
    
    return {
      status,
      message,
      issues,
      uptime: health.uptime,
      lastCheck: health.timestamp
    };
  }
}

// Create singleton instance
const systemHealthService = new SystemHealthService();

export default systemHealthService;
