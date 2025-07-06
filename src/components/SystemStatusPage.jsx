import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Server,
  Database,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Minus,
  Shield,
  Monitor
} from 'lucide-react';
import { cn } from '../utils/ui';
import systemHealthService from '../services/systemHealthService';
import MetricsChart from './MetricsChart';

const SystemStatusPage = ({ darkMode, className }) => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [metricsHistory, setMetricsHistory] = useState({
    cpu: [],
    memory: [],
    disk: []
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  // Load system health data
  const loadSystemHealth = async () => {
    try {
      const health = await systemHealthService.getSystemHealth();
      setSystemHealth(health);
      setLastUpdate(new Date());
      
      // Update metrics history for graphs
      if (health.system_metrics) {
        const timestamp = Date.now();
        setMetricsHistory(prev => ({
          cpu: [...prev.cpu.slice(-19), { 
            timestamp, 
            value: health.system_metrics.cpu?.usage_percent || 0 
          }],
          memory: [...prev.memory.slice(-19), { 
            timestamp, 
            value: health.system_metrics.memory?.usage_percent || 0 
          }],
          disk: [...prev.disk.slice(-19), { 
            timestamp, 
            value: health.system_metrics.disk?.usage_percent || 0 
          }]
        }));
      }
    } catch (error) {
      console.error('Failed to load system health:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemHealth();

    if (autoRefresh) {
      intervalRef.current = setInterval(loadSystemHealth, 10000); // 10 seconds for real-time updates
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'online':
        return 'text-success-600';
      case 'warning':
        return 'text-warning-600';
      case 'unhealthy':
      case 'offline':
      case 'critical':
        return 'text-danger-600';
      default:
        return 'text-secondary-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'online':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'unhealthy':
      case 'offline':
      case 'critical':
        return XCircle;
      default:
        return Minus;
    }
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'bg-danger-500';
    if (percentage >= 75) return 'bg-warning-500';
    if (percentage >= 50) return 'bg-primary-500';
    return 'bg-success-500';
  };

  const formatUptime = (uptime) => {
    if (!uptime) return 'Unknown';
    return uptime;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className={cn(
        'flex items-center justify-center h-64',
        className
      )}>
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-primary-500" />
          <span className={cn(
            'text-sm',
            darkMode ? 'text-secondary-300' : 'text-secondary-600'
          )}>
            Loading system status...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn(
            'text-2xl font-bold',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            System Status
          </h2>
          <p className={cn(
            'text-sm mt-1',
            darkMode ? 'text-secondary-400' : 'text-secondary-600'
          )}>
            Real-time monitoring of system health and performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              autoRefresh
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : darkMode
                  ? 'bg-secondary-700 text-secondary-300 hover:bg-secondary-600'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            )}
          >
            <Activity className="w-4 h-4" />
            <span>{autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}</span>
          </button>
          <button
            onClick={loadSystemHealth}
            className={cn(
              'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              darkMode
                ? 'bg-secondary-700 text-secondary-300 hover:bg-secondary-600'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            )}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Last Update */}
      {lastUpdate && (
        <div className={cn(
          'text-xs',
          darkMode ? 'text-secondary-400' : 'text-secondary-500'
        )}>
          Last updated: {lastUpdate.toLocaleString()}
        </div>
      )}

      {/* Overall Status */}
      {systemHealth && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'p-6 rounded-xl border',
            darkMode
              ? 'bg-secondary-800 border-secondary-700'
              : 'bg-white border-secondary-200'
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn(
              'text-lg font-semibold',
              darkMode ? 'text-white' : 'text-secondary-900'
            )}>
              Overall System Health
            </h3>
            <div className="flex items-center space-x-2">
              {React.createElement(getStatusIcon(systemHealth.status), {
                className: cn('w-5 h-5', getStatusColor(systemHealth.status))
              })}
              <span className={cn(
                'font-medium capitalize',
                getStatusColor(systemHealth.status)
              )}>
                {systemHealth.status}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={cn(
                'text-2xl font-bold',
                darkMode ? 'text-white' : 'text-secondary-900'
              )}>
                {formatUptime(systemHealth.uptime)}
              </div>
              <div className={cn(
                'text-sm',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                System Uptime
              </div>
            </div>
            <div className="text-center">
              <div className={cn(
                'text-2xl font-bold',
                darkMode ? 'text-white' : 'text-secondary-900'
              )}>
                {systemHealth.version || '1.0.0'}
              </div>
              <div className={cn(
                'text-sm',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                Version
              </div>
            </div>
            <div className="text-center">
              <div className={cn(
                'text-2xl font-bold',
                darkMode ? 'text-white' : 'text-secondary-900'
              )}>
                {systemHealth.environment || 'Production'}
              </div>
              <div className={cn(
                'text-sm',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                Environment
              </div>
            </div>
            <div className="text-center">
              <div className={cn(
                'text-2xl font-bold',
                darkMode ? 'text-white' : 'text-secondary-900'
              )}>
                {systemHealth.response_time_ms || 0}ms
              </div>
              <div className={cn(
                'text-sm',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                Response Time
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Services Status */}
      {systemHealth?.services && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'p-6 rounded-xl border',
            darkMode
              ? 'bg-secondary-800 border-secondary-700'
              : 'bg-white border-secondary-200'
          )}
        >
          <h3 className={cn(
            'text-lg font-semibold mb-4',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            Services Status
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(systemHealth.services).map(([serviceName, service]) => {
              const ServiceIcon = serviceName === 'asterisk' ? Server :
                                serviceName === 'database' ? Database :
                                serviceName === 'websocket' ? Wifi :
                                serviceName === 'backend' ? Monitor : Shield;

              return (
                <div
                  key={serviceName}
                  className={cn(
                    'p-4 rounded-lg border',
                    darkMode
                      ? 'bg-secondary-700 border-secondary-600'
                      : 'bg-secondary-50 border-secondary-200'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <ServiceIcon className="w-5 h-5 text-primary-500" />
                      <span className={cn(
                        'font-medium capitalize',
                        darkMode ? 'text-white' : 'text-secondary-900'
                      )}>
                        {serviceName}
                      </span>
                    </div>
                    {React.createElement(getStatusIcon(service.status), {
                      className: cn('w-4 h-4', getStatusColor(service.status))
                    })}
                  </div>

                  <div className={cn(
                    'text-sm capitalize',
                    getStatusColor(service.status)
                  )}>
                    {service.status}
                  </div>

                  {service.response_time && (
                    <div className={cn(
                      'text-xs mt-1',
                      darkMode ? 'text-secondary-400' : 'text-secondary-600'
                    )}>
                      Response: {service.response_time}ms
                    </div>
                  )}

                  {service.error && (
                    <div className="text-xs mt-1 text-danger-500">
                      {service.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* System Metrics */}
      {systemHealth?.system_metrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            'p-6 rounded-xl border',
            darkMode
              ? 'bg-secondary-800 border-secondary-700'
              : 'bg-white border-secondary-200'
          )}
        >
          <h3 className={cn(
            'text-lg font-semibold mb-4',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            System Metrics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CPU Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-primary-500" />
                  <span className={cn(
                    'font-medium',
                    darkMode ? 'text-white' : 'text-secondary-900'
                  )}>
                    CPU Usage
                  </span>
                </div>
                <span className={cn(
                  'text-sm font-medium',
                  darkMode ? 'text-white' : 'text-secondary-900'
                )}>
                  {Math.round(systemHealth.system_metrics.cpu?.usage_percent || 0)}%
                </span>
              </div>

              <div className={cn(
                'w-full h-3 rounded-full',
                darkMode ? 'bg-secondary-700' : 'bg-secondary-200'
              )}>
                <div
                  className={cn(
                    'h-3 rounded-full transition-all duration-500',
                    getUsageColor(systemHealth.system_metrics.cpu?.usage_percent || 0)
                  )}
                  style={{
                    width: `${Math.min(systemHealth.system_metrics.cpu?.usage_percent || 0, 100)}%`
                  }}
                />
              </div>

              {systemHealth.system_metrics.cpu?.cores && (
                <div className={cn(
                  'text-xs',
                  darkMode ? 'text-secondary-400' : 'text-secondary-600'
                )}>
                  {systemHealth.system_metrics.cpu.cores} cores
                </div>
              )}
            </div>

            {/* Memory Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MemoryStick className="w-5 h-5 text-primary-500" />
                  <span className={cn(
                    'font-medium',
                    darkMode ? 'text-white' : 'text-secondary-900'
                  )}>
                    Memory Usage
                  </span>
                </div>
                <span className={cn(
                  'text-sm font-medium',
                  darkMode ? 'text-white' : 'text-secondary-900'
                )}>
                  {Math.round(systemHealth.system_metrics.memory?.usage_percent || 0)}%
                </span>
              </div>

              <div className={cn(
                'w-full h-3 rounded-full',
                darkMode ? 'bg-secondary-700' : 'bg-secondary-200'
              )}>
                <div
                  className={cn(
                    'h-3 rounded-full transition-all duration-500',
                    getUsageColor(systemHealth.system_metrics.memory?.usage_percent || 0)
                  )}
                  style={{
                    width: `${Math.min(systemHealth.system_metrics.memory?.usage_percent || 0, 100)}%`
                  }}
                />
              </div>

              <div className={cn(
                'text-xs',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                {formatBytes(systemHealth.system_metrics.memory?.used)} / {formatBytes(systemHealth.system_metrics.memory?.total)}
              </div>
            </div>

            {/* Disk Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-5 h-5 text-primary-500" />
                  <span className={cn(
                    'font-medium',
                    darkMode ? 'text-white' : 'text-secondary-900'
                  )}>
                    Disk Usage
                  </span>
                </div>
                <span className={cn(
                  'text-sm font-medium',
                  darkMode ? 'text-white' : 'text-secondary-900'
                )}>
                  {Math.round(systemHealth.system_metrics.disk?.usage_percent || 0)}%
                </span>
              </div>

              <div className={cn(
                'w-full h-3 rounded-full',
                darkMode ? 'bg-secondary-700' : 'bg-secondary-200'
              )}>
                <div
                  className={cn(
                    'h-3 rounded-full transition-all duration-500',
                    getUsageColor(systemHealth.system_metrics.disk?.usage_percent || 0)
                  )}
                  style={{
                    width: `${Math.min(systemHealth.system_metrics.disk?.usage_percent || 0, 100)}%`
                  }}
                />
              </div>

              <div className={cn(
                'text-xs',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                {formatBytes(systemHealth.system_metrics.disk?.used)} / {formatBytes(systemHealth.system_metrics.disk?.total)}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Real-time Metrics Charts */}
      {metricsHistory.cpu.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            'p-6 rounded-xl border',
            darkMode
              ? 'bg-secondary-800 border-secondary-700'
              : 'bg-white border-secondary-200'
          )}
        >
          <h3 className={cn(
            'text-lg font-semibold mb-4',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            Performance Graphs
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <MetricsChart
              data={metricsHistory.cpu}
              title="CPU Usage"
              darkMode={darkMode}
              unit="%"
            />
            <MetricsChart
              data={metricsHistory.memory}
              title="Memory Usage"
              darkMode={darkMode}
              unit="%"
            />
            <MetricsChart
              data={metricsHistory.disk}
              title="Disk Usage"
              darkMode={darkMode}
              unit="%"
            />
          </div>
        </motion.div>
      )}

      {/* Database Health */}
      {systemHealth?.database_health && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={cn(
            'p-6 rounded-xl border',
            darkMode
              ? 'bg-secondary-800 border-secondary-700'
              : 'bg-white border-secondary-200'
          )}
        >
          <h3 className={cn(
            'text-lg font-semibold mb-4',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            Database Health
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={cn(
              'p-4 rounded-lg border',
              darkMode
                ? 'bg-secondary-700 border-secondary-600'
                : 'bg-secondary-50 border-secondary-200'
            )}>
              <div className="flex items-center space-x-2 mb-2">
                <Database className="w-5 h-5 text-primary-500" />
                <span className={cn(
                  'font-medium',
                  darkMode ? 'text-white' : 'text-secondary-900'
                )}>
                  Total Users
                </span>
              </div>
              <div className={cn(
                'text-2xl font-bold',
                darkMode ? 'text-white' : 'text-secondary-900'
              )}>
                {systemHealth.database_health.total_users || 0}
              </div>
            </div>

            <div className={cn(
              'p-4 rounded-lg border',
              darkMode
                ? 'bg-secondary-700 border-secondary-600'
                : 'bg-secondary-50 border-secondary-200'
            )}>
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-5 h-5 text-success-500" />
                <span className={cn(
                  'font-medium',
                  darkMode ? 'text-white' : 'text-secondary-900'
                )}>
                  Active Calls
                </span>
              </div>
              <div className={cn(
                'text-2xl font-bold',
                darkMode ? 'text-white' : 'text-secondary-900'
              )}>
                {systemHealth.database_health.active_calls || 0}
              </div>
            </div>

            <div className={cn(
              'p-4 rounded-lg border',
              darkMode
                ? 'bg-secondary-700 border-secondary-600'
                : 'bg-secondary-50 border-secondary-200'
            )}>
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-warning-500" />
                <span className={cn(
                  'font-medium',
                  darkMode ? 'text-white' : 'text-secondary-900'
                )}>
                  Call Logs
                </span>
              </div>
              <div className={cn(
                'text-2xl font-bold',
                darkMode ? 'text-white' : 'text-secondary-900'
              )}>
                {systemHealth.database_health.call_logs_count || 0}
              </div>
            </div>

            <div className={cn(
              'p-4 rounded-lg border',
              darkMode
                ? 'bg-secondary-700 border-secondary-600'
                : 'bg-secondary-50 border-secondary-200'
            )}>
              <div className="flex items-center space-x-2 mb-2">
                <HardDrive className="w-5 h-5 text-primary-500" />
                <span className={cn(
                  'font-medium',
                  darkMode ? 'text-white' : 'text-secondary-900'
                )}>
                  DB Size
                </span>
              </div>
              <div className={cn(
                'text-2xl font-bold',
                darkMode ? 'text-white' : 'text-secondary-900'
              )}>
                {systemHealth.database_health.database_size || 'N/A'}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SystemStatusPage;
