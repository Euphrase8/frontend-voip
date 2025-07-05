import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Palette,
  Shield,
  Activity,
  Download,
  RefreshCw,
  Save,
  RotateCcw
} from 'lucide-react';
import { cn } from '../utils/ui';
import SystemStatusPage from './SystemStatusPage';
import backupService from '../services/backupService';
import { toast } from 'react-hot-toast';

const EnhancedSettingsTab = ({
  darkMode,
  backupStatus,
  systemHealth,
  onCreateBackup,
  onRestoreBackup,
  onDownloadBackup,
  onUpdateSystemHealth
}) => {
  const [activeSection, setActiveSection] = useState('data');
  const [settings, setSettings] = useState({
    // Data Management
    maxCallLogs: 1000,
    sessionTimeout: 24,
    autoCleanup: true,
    cleanupInterval: 30,
    
    // Theme & Appearance
    theme: 'auto',
    primaryColor: 'blue',
    compactMode: false,
    animationsEnabled: true,
    
    // System Health
    healthCheckInterval: 30,
    alertThresholds: {
      cpu: 90,
      memory: 85,
      disk: 90
    },
    
    // Backup Configuration
    autoBackup: true,
    backupInterval: 'daily',
    backupRetention: 30,
    includeCallLogs: true,
    includeUserData: true,
    includeSystemConfig: true
  });

  const [backupHistory, setBackupHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBackupHistory();
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('voipAdminSettings');
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('voipAdminSettings', JSON.stringify(settings));
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        maxCallLogs: 1000,
        sessionTimeout: 24,
        autoCleanup: true,
        cleanupInterval: 30,
        theme: 'auto',
        primaryColor: 'blue',
        compactMode: false,
        animationsEnabled: true,
        healthCheckInterval: 30,
        alertThresholds: {
          cpu: 90,
          memory: 85,
          disk: 90
        },
        autoBackup: true,
        backupInterval: 'daily',
        backupRetention: 30,
        includeCallLogs: true,
        includeUserData: true,
        includeSystemConfig: true
      });
      localStorage.removeItem('voipAdminSettings');
      toast.success('Settings reset to default');
    }
  };

  const loadBackupHistory = async () => {
    try {
      const history = await backupService.getBackupHistory();
      setBackupHistory(history.slice(0, 5)); // Show last 5 backups
    } catch (error) {
      console.error('Failed to load backup history:', error);
    }
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      await onCreateBackup({
        includeDatabase: settings.includeUserData,
        includeConfig: settings.includeSystemConfig,
        includeCallLogs: settings.includeCallLogs,
        backupName: `Manual_Backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`
      });
      await loadBackupHistory();
      toast.success('Backup created successfully');
    } catch (error) {
      console.error('Failed to create backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => {
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      return { ...prev, [key]: value };
    });
  };

  const sections = [
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'theme', label: 'Theme & Appearance', icon: Palette },
    { id: 'system', label: 'System Status', icon: Activity },
    { id: 'backup', label: 'System Backup', icon: Shield }
  ];

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'online':
      case 'healthy':
      case 'completed':
        return 'text-success-600';
      case 'warning':
        return 'text-warning-600';
      case 'offline':
      case 'unhealthy':
      case 'failed':
        return 'text-danger-600';
      default:
        return 'text-secondary-500';
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
    switch (status?.toLowerCase()) {
      case 'online':
      case 'healthy':
      case 'completed':
        return `${baseClasses} bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400`;
      case 'warning':
        return `${baseClasses} bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400`;
      case 'offline':
      case 'unhealthy':
      case 'failed':
        return `${baseClasses} bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-400`;
      default:
        return `${baseClasses} bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-400`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn(
            'text-2xl font-bold',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            Settings
          </h2>
          <p className={cn(
            'text-sm mt-1',
            darkMode ? 'text-secondary-400' : 'text-secondary-600'
          )}>
            Configure system preferences and manage your VoIP application
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={resetSettings}
            className={cn(
              'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              darkMode
                ? 'bg-secondary-700 text-secondary-300 hover:bg-secondary-600'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            )}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={saveSettings}
            className="flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className={cn(
        'border-b',
        darkMode ? 'border-secondary-700' : 'border-secondary-200'
      )}>
        <nav className="flex space-x-8">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeSection === section.id
                    ? 'border-primary-500 text-primary-600'
                    : cn(
                        'border-transparent',
                        darkMode 
                          ? 'text-secondary-400 hover:text-secondary-300' 
                          : 'text-secondary-500 hover:text-secondary-700'
                      )
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeSection === 'data' && (
            <div className="space-y-6">
              <div className={cn(
                'p-6 rounded-xl border',
                darkMode
                  ? 'bg-secondary-800 border-secondary-700'
                  : 'bg-white border-secondary-200'
              )}>
                <h3 className={cn(
                  'text-lg font-semibold mb-4',
                  darkMode ? 'text-white' : 'text-secondary-900'
                )}>
                  Data Management
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2',
                      darkMode ? 'text-secondary-300' : 'text-secondary-700'
                    )}>
                      Max Call Logs
                    </label>
                    <input
                      type="number"
                      value={settings.maxCallLogs}
                      onChange={(e) => updateSetting('maxCallLogs', parseInt(e.target.value))}
                      className={cn(
                        'w-full px-3 py-2 border rounded-lg',
                        darkMode
                          ? 'bg-secondary-700 border-secondary-600 text-white'
                          : 'bg-white border-secondary-300 text-secondary-900'
                      )}
                    />
                  </div>

                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2',
                      darkMode ? 'text-secondary-300' : 'text-secondary-700'
                    )}>
                      Session Timeout (hours)
                    </label>
                    <input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                      className={cn(
                        'w-full px-3 py-2 border rounded-lg',
                        darkMode
                          ? 'bg-secondary-700 border-secondary-600 text-white'
                          : 'bg-white border-secondary-300 text-secondary-900'
                      )}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.autoCleanup}
                      onChange={(e) => updateSetting('autoCleanup', e.target.checked)}
                      className="rounded border-secondary-300"
                    />
                    <span className={cn(
                      'text-sm',
                      darkMode ? 'text-secondary-300' : 'text-secondary-700'
                    )}>
                      Enable automatic cleanup of old data
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'theme' && (
            <div className="space-y-6">
              <div className={cn(
                'p-6 rounded-xl border',
                darkMode
                  ? 'bg-secondary-800 border-secondary-700'
                  : 'bg-white border-secondary-200'
              )}>
                <h3 className={cn(
                  'text-lg font-semibold mb-4',
                  darkMode ? 'text-white' : 'text-secondary-900'
                )}>
                  Theme & Appearance
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2',
                      darkMode ? 'text-secondary-300' : 'text-secondary-700'
                    )}>
                      Theme Mode
                    </label>
                    <select
                      value={settings.theme}
                      onChange={(e) => updateSetting('theme', e.target.value)}
                      className={cn(
                        'w-full px-3 py-2 border rounded-lg',
                        darkMode
                          ? 'bg-secondary-700 border-secondary-600 text-white'
                          : 'bg-white border-secondary-300 text-secondary-900'
                      )}
                    >
                      <option value="auto">Auto</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>

                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2',
                      darkMode ? 'text-secondary-300' : 'text-secondary-700'
                    )}>
                      Primary Color
                    </label>
                    <select
                      value={settings.primaryColor}
                      onChange={(e) => updateSetting('primaryColor', e.target.value)}
                      className={cn(
                        'w-full px-3 py-2 border rounded-lg',
                        darkMode
                          ? 'bg-secondary-700 border-secondary-600 text-white'
                          : 'bg-white border-secondary-300 text-secondary-900'
                      )}
                    >
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="purple">Purple</option>
                      <option value="red">Red</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.compactMode}
                      onChange={(e) => updateSetting('compactMode', e.target.checked)}
                      className="rounded border-secondary-300"
                    />
                    <span className={cn(
                      'text-sm',
                      darkMode ? 'text-secondary-300' : 'text-secondary-700'
                    )}>
                      Compact Mode
                    </span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.animationsEnabled}
                      onChange={(e) => updateSetting('animationsEnabled', e.target.checked)}
                      className="rounded border-secondary-300"
                    />
                    <span className={cn(
                      'text-sm',
                      darkMode ? 'text-secondary-300' : 'text-secondary-700'
                    )}>
                      Enable animations
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'system' && (
            <SystemStatusPage darkMode={darkMode} />
          )}

          {activeSection === 'backup' && (
            <div className="space-y-6">
              {/* System Health Summary */}
              <div className={cn(
                'p-6 rounded-xl border',
                darkMode
                  ? 'bg-secondary-800 border-secondary-700'
                  : 'bg-white border-secondary-200'
              )}>
                <h3 className={cn(
                  'text-lg font-semibold mb-4',
                  darkMode ? 'text-white' : 'text-secondary-900'
                )}>
                  System Health
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'text-sm font-medium',
                      darkMode ? 'text-secondary-300' : 'text-secondary-700'
                    )}>
                      Asterisk Server
                    </span>
                    <span className={getStatusBadge(systemHealth?.asteriskStatus || 'online')}>
                      {systemHealth?.asteriskStatus || 'online'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'text-sm font-medium',
                      darkMode ? 'text-secondary-300' : 'text-secondary-700'
                    )}>
                      Database
                    </span>
                    <span className={getStatusBadge(systemHealth?.databaseStatus || 'online')}>
                      {systemHealth?.databaseStatus || 'online'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'text-sm font-medium',
                      darkMode ? 'text-secondary-300' : 'text-secondary-700'
                    )}>
                      Backend API
                    </span>
                    <span className={getStatusBadge(systemHealth?.backendStatus || 'online')}>
                      {systemHealth?.backendStatus || 'online'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className={cn(
                      'text-2xl font-bold',
                      getStatusColor(systemHealth?.diskUsage > 90 ? 'warning' : 'healthy')
                    )}>
                      {systemHealth?.diskUsage || 45}%
                    </div>
                    <div className={cn(
                      'text-sm',
                      darkMode ? 'text-secondary-400' : 'text-secondary-600'
                    )}>
                      Disk Usage
                    </div>
                  </div>

                  <div className="text-center">
                    <div className={cn(
                      'text-2xl font-bold',
                      getStatusColor(systemHealth?.memoryUsage > 85 ? 'warning' : 'healthy')
                    )}>
                      {systemHealth?.memoryUsage || 62}%
                    </div>
                    <div className={cn(
                      'text-sm',
                      darkMode ? 'text-secondary-400' : 'text-secondary-600'
                    )}>
                      Memory Usage
                    </div>
                  </div>

                  <div className="text-center">
                    <div className={cn(
                      'text-2xl font-bold',
                      getStatusColor(systemHealth?.cpuUsage > 90 ? 'warning' : 'healthy')
                    )}>
                      {systemHealth?.cpuUsage || 28}%
                    </div>
                    <div className={cn(
                      'text-sm',
                      darkMode ? 'text-secondary-400' : 'text-secondary-600'
                    )}>
                      CPU Usage
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={cn(
                        'font-medium',
                        darkMode ? 'text-white' : 'text-secondary-900'
                      )}>
                        System Uptime
                      </div>
                      <div className={cn(
                        'text-sm',
                        darkMode ? 'text-secondary-400' : 'text-secondary-600'
                      )}>
                        {systemHealth?.uptime || '3 days, 7 hours, 55 minutes'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        'font-medium',
                        darkMode ? 'text-white' : 'text-secondary-900'
                      )}>
                        Last Health Check
                      </div>
                      <div className={cn(
                        'text-sm',
                        darkMode ? 'text-secondary-400' : 'text-secondary-600'
                      )}>
                        {systemHealth?.lastCheck || new Date().toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Backup */}
              <div className={cn(
                'p-6 rounded-xl border',
                darkMode
                  ? 'bg-secondary-800 border-secondary-700'
                  : 'bg-white border-secondary-200'
              )}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={cn(
                    'text-lg font-semibold',
                    darkMode ? 'text-white' : 'text-secondary-900'
                  )}>
                    System Backup
                  </h3>
                  <button
                    onClick={handleCreateBackup}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Creating...' : 'Create Backup'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className={cn(
                    'p-4 rounded-lg border',
                    darkMode
                      ? 'bg-secondary-700 border-secondary-600'
                      : 'bg-secondary-50 border-secondary-200'
                  )}>
                    <div className={cn(
                      'text-sm font-medium mb-1',
                      darkMode ? 'text-secondary-300' : 'text-secondary-700'
                    )}>
                      Last Backup
                    </div>
                    <div className={cn(
                      'text-lg font-bold',
                      darkMode ? 'text-white' : 'text-secondary-900'
                    )}>
                      {backupHistory[0] ? formatDate(backupHistory[0].created_at) : '2024-01-15 10:30:00'}
                    </div>
                  </div>

                  <div className={cn(
                    'p-4 rounded-lg border',
                    darkMode
                      ? 'bg-secondary-700 border-secondary-600'
                      : 'bg-secondary-50 border-secondary-200'
                  )}>
                    <div className={cn(
                      'text-sm font-medium mb-1',
                      darkMode ? 'text-secondary-300' : 'text-secondary-700'
                    )}>
                      Size
                    </div>
                    <div className={cn(
                      'text-lg font-bold',
                      darkMode ? 'text-white' : 'text-secondary-900'
                    )}>
                      {backupHistory[0] ? formatFileSize(backupHistory[0].size) : '2.4 MB'}
                    </div>
                  </div>

                  <div className={cn(
                    'p-4 rounded-lg border',
                    darkMode
                      ? 'bg-secondary-700 border-secondary-600'
                      : 'bg-secondary-50 border-secondary-200'
                  )}>
                    <div className={cn(
                      'text-sm font-medium mb-1',
                      darkMode ? 'text-secondary-300' : 'text-secondary-700'
                    )}>
                      Status
                    </div>
                    <div className={cn(
                      'text-lg font-bold',
                      getStatusColor(backupHistory[0]?.status || 'completed')
                    )}>
                      {backupHistory[0]?.status || 'completed'}
                    </div>
                  </div>

                  <div className={cn(
                    'p-4 rounded-lg border',
                    darkMode
                      ? 'bg-secondary-700 border-secondary-600'
                      : 'bg-secondary-50 border-secondary-200'
                  )}>
                    <div className={cn(
                      'text-sm font-medium mb-1',
                      darkMode ? 'text-secondary-300' : 'text-secondary-700'
                    )}>
                      Total Backups
                    </div>
                    <div className={cn(
                      'text-lg font-bold',
                      darkMode ? 'text-white' : 'text-secondary-900'
                    )}>
                      {backupHistory.length || 15}
                    </div>
                  </div>
                </div>

                {/* Backup Configuration */}
                <div className="space-y-4">
                  <h4 className={cn(
                    'font-medium',
                    darkMode ? 'text-white' : 'text-secondary-900'
                  )}>
                    Backup Configuration
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.autoBackup}
                        onChange={(e) => updateSetting('autoBackup', e.target.checked)}
                        className="rounded border-secondary-300"
                      />
                      <span className={cn(
                        'text-sm',
                        darkMode ? 'text-secondary-300' : 'text-secondary-700'
                      )}>
                        Auto Backup
                      </span>
                    </label>

                    <div>
                      <label className={cn(
                        'block text-sm font-medium mb-1',
                        darkMode ? 'text-secondary-300' : 'text-secondary-700'
                      )}>
                        Backup Interval
                      </label>
                      <select
                        value={settings.backupInterval}
                        onChange={(e) => updateSetting('backupInterval', e.target.value)}
                        className={cn(
                          'w-full px-3 py-2 border rounded-lg text-sm',
                          darkMode
                            ? 'bg-secondary-700 border-secondary-600 text-white'
                            : 'bg-white border-secondary-300 text-secondary-900'
                        )}
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.includeCallLogs}
                        onChange={(e) => updateSetting('includeCallLogs', e.target.checked)}
                        className="rounded border-secondary-300"
                      />
                      <span className={cn(
                        'text-sm',
                        darkMode ? 'text-secondary-300' : 'text-secondary-700'
                      )}>
                        Include call logs in backup
                      </span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.includeUserData}
                        onChange={(e) => updateSetting('includeUserData', e.target.checked)}
                        className="rounded border-secondary-300"
                      />
                      <span className={cn(
                        'text-sm',
                        darkMode ? 'text-secondary-300' : 'text-secondary-700'
                      )}>
                        Include user data in backup
                      </span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.includeSystemConfig}
                        onChange={(e) => updateSetting('includeSystemConfig', e.target.checked)}
                        className="rounded border-secondary-300"
                      />
                      <span className={cn(
                        'text-sm',
                        darkMode ? 'text-secondary-300' : 'text-secondary-700'
                      )}>
                        Include system configuration in backup
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default EnhancedSettingsTab;
