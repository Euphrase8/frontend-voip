import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiBell as Bell,
  FiPhone as Phone,
  FiWifi as Wifi,
  FiAlertTriangle as AlertTriangle,
  FiInfo as Info,
  FiCheckCircle as CheckCircle,
  FiXCircle as XCircle,
  FiTrash2 as Trash,
  FiRefreshCw as Refresh,
  FiActivity as Activity,
  FiClock as Clock,
  FiCpu as Brain,
  FiFilter as Filter
} from 'react-icons/fi';
import { cn } from '../utils/ui';
import notificationService from '../utils/notificationService';
import { generateExampleUnderstandingLogs, generateExampleSystemLogs } from '../utils/understandingLogExamples';

const NotificationsPage = ({ darkMode, user }) => {
  const [notifications, setNotifications] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [understandingLogs, setUnderstandingLogs] = useState([]);
  const [combinedLogs, setCombinedLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('notifications');
  const [logFilter, setLogFilter] = useState('all');

  useEffect(() => {
    // Load initial data from notification service
    setNotifications(notificationService.getNotifications());
    setSystemLogs(notificationService.getLogs());
    setUnderstandingLogs(notificationService.getUnderstandingLogs());
    setCombinedLogs(notificationService.getCombinedLogs());

    // Set up listener for real-time updates
    const unsubscribe = notificationService.addListener((type, data) => {
      if (type === 'notification') {
        setNotifications(notificationService.getNotifications());
      } else if (type === 'log') {
        setSystemLogs(notificationService.getLogs());
        setCombinedLogs(notificationService.getCombinedLogs());
      } else if (type === 'understanding_log') {
        setUnderstandingLogs(notificationService.getUnderstandingLogs());
        setCombinedLogs(notificationService.getCombinedLogs());
      } else if (type === 'clear') {
        setNotifications([]);
      } else if (type === 'clearLogs') {
        setSystemLogs([]);
        setCombinedLogs(notificationService.getCombinedLogs());
      } else if (type === 'clearUnderstandingLogs') {
        setUnderstandingLogs([]);
        setCombinedLogs(notificationService.getCombinedLogs());
      } else if (type === 'clearAllLogs') {
        setSystemLogs([]);
        setUnderstandingLogs([]);
        setCombinedLogs([]);
      }
    });

    return unsubscribe;
  }, []);

  const markAsRead = (id) => {
    notificationService.markAsRead(id);
  };

  const clearNotifications = () => {
    notificationService.clearNotifications();
  };

  const clearLogs = () => {
    notificationService.clearLogs();
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-danger-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning-500" />;
      case 'call':
        return <Phone className="w-5 h-5 text-primary-500" />;
      case 'network':
        return <Wifi className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-primary-500" />;
    }
  };

  const clearUnderstandingLogs = () => {
    notificationService.clearUnderstandingLogs();
  };

  const clearAllLogs = () => {
    notificationService.clearAllLogs();
  };

  const generateTestLogs = () => {
    generateExampleSystemLogs();
    generateExampleUnderstandingLogs();
  };

  const getFilteredLogs = () => {
    switch (logFilter) {
      case 'system':
        return systemLogs.map(log => ({ ...log, logType: 'system' }));
      case 'understanding':
        return understandingLogs.map(log => ({ ...log, logType: 'understanding' }));
      case 'all':
      default:
        return combinedLogs;
    }
  };

  const getLogIcon = (level, logType) => {
    if (logType === 'understanding') {
      switch (level || 'info') {
        case 'user_action':
          return <Activity className="w-4 h-4 text-blue-500" />;
        case 'ai_response':
          return <Brain className="w-4 h-4 text-purple-500" />;
        case 'comprehension':
          return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'error_recovery':
          return <AlertTriangle className="w-4 h-4 text-orange-500" />;
        case 'learning':
          return <Brain className="w-4 h-4 text-indigo-500" />;
        default:
          return <Info className="w-4 h-4 text-blue-500" />;
      }
    }

    // System logs
    switch (level) {
      case 'error':
        return <XCircle className="w-4 h-4 text-danger-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-primary-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-success-500" />;
    }
  };

  const getLogTypeLabel = (logType, type) => {
    if (logType === 'understanding') {
      switch (type) {
        case 'user_action':
          return 'User Action';
        case 'ai_response':
          return 'AI Response';
        case 'comprehension':
          return 'Comprehension';
        case 'error_recovery':
          return 'Error Recovery';
        case 'learning':
          return 'Learning';
        default:
          return 'Understanding';
      }
    }
    return 'System';
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell, count: notifications.length },
    ...(user?.role === 'admin' ? [
      { id: 'logs', label: 'All Logs', icon: Activity, count: combinedLogs.length }
    ] : [])
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Action Bar */}
      <div className="flex-shrink-0 p-4 lg:p-6 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className={cn(
              'text-sm',
              darkMode ? 'text-secondary-400' : 'text-secondary-600'
            )}>
              {user?.role === 'admin' ? 'System notifications and logs' : 'Your notifications'}
            </span>
          </div>
          <div className="flex space-x-2">
            {activeTab === 'notifications' ? (
              <>
                <button
                  onClick={markAllAsRead}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    notifications.length === 0
                      ? "opacity-50 cursor-not-allowed"
                      : darkMode
                        ? "text-secondary-400 hover:text-secondary-300 hover:bg-secondary-800 border border-secondary-700"
                        : "text-secondary-600 hover:text-secondary-700 hover:bg-secondary-100 border border-secondary-300"
                  )}
                  disabled={notifications.length === 0}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Mark All Read</span>
                </button>
                <button
                  onClick={clearNotifications}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    notifications.length === 0
                      ? "opacity-50 cursor-not-allowed"
                      : "text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 border border-red-300 dark:border-red-700"
                  )}
                  disabled={notifications.length === 0}
                >
                  <Trash className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
              </>
            ) : user?.role === 'admin' && activeTab === 'logs' ? (
              <div className="flex items-center space-x-2">
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm border",
                    darkMode
                      ? "bg-secondary-800 border-secondary-600 text-white"
                      : "bg-white border-secondary-300 text-secondary-900"
                  )}
                >
                  <option value="all">All Logs ({combinedLogs.length})</option>
                  <option value="system">System ({systemLogs.length})</option>
                  <option value="understanding">Understanding ({understandingLogs.length})</option>
                </select>
                <button
                  onClick={generateTestLogs}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:text-primary-400 dark:hover:text-primary-300 dark:hover:bg-primary-900/20 border border-primary-300 dark:border-primary-700"
                >
                  <Activity className="w-4 h-4" />
                  <span className="hidden sm:inline">Generate Test Logs</span>
                </button>
                <button
                  onClick={clearAllLogs}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    combinedLogs.length === 0
                      ? "opacity-50 cursor-not-allowed"
                      : "text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 border border-red-300 dark:border-red-700"
                  )}
                  disabled={combinedLogs.length === 0}
                >
                  <Trash className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={cn(
        'border-b px-6',
        darkMode ? 'bg-secondary-800 border-secondary-700' : 'bg-white border-secondary-200'
      )}>
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === tab.id
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
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={cn(
                    'px-2 py-1 text-xs rounded-full',
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-secondary-100 text-secondary-600'
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'notifications' && (
          <div className="p-4 lg:p-6">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bell className={cn(
                  'w-16 h-16 mb-4',
                  darkMode ? 'text-secondary-600' : 'text-secondary-400'
                )} />
                <h3 className={cn(
                  'text-lg font-medium mb-2',
                  darkMode ? 'text-secondary-400' : 'text-secondary-600'
                )}>
                  No notifications
                </h3>
                <p className={cn(
                  'text-sm',
                  darkMode ? 'text-secondary-500' : 'text-secondary-500'
                )}>
                  You're all caught up! New notifications will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md',
                      notification.read
                        ? darkMode
                          ? 'bg-secondary-800 border-secondary-700'
                          : 'bg-secondary-50 border-secondary-200'
                        : darkMode
                          ? 'bg-secondary-700 border-secondary-600'
                          : 'bg-white border-secondary-300 shadow-sm'
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={cn(
                            'font-medium',
                            darkMode ? 'text-white' : 'text-secondary-900'
                          )}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={cn(
                              'text-xs',
                              darkMode ? 'text-secondary-400' : 'text-secondary-500'
                            )}>
                              {formatTime(notification.timestamp)}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className={cn(
                          'text-sm mt-1',
                          darkMode ? 'text-secondary-300' : 'text-secondary-600'
                        )}>
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && user?.role === 'admin' && (
          <div className="p-4 lg:p-6">
            {getFilteredLogs().length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Activity className={cn(
                  'w-16 h-16 mb-4',
                  darkMode ? 'text-secondary-600' : 'text-secondary-400'
                )} />
                <h3 className={cn(
                  'text-lg font-medium mb-2',
                  darkMode ? 'text-secondary-400' : 'text-secondary-600'
                )}>
                  No logs available
                </h3>
                <p className={cn(
                  'text-sm',
                  darkMode ? 'text-secondary-500' : 'text-secondary-500'
                )}>
                  System and understanding logs will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {getFilteredLogs().map((log, index) => (
                  <motion.div
                    key={log.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'p-3 rounded border text-sm',
                      log.logType === 'understanding' ? 'font-sans' : 'font-mono',
                      darkMode
                        ? 'bg-secondary-800 border-secondary-700'
                        : 'bg-secondary-50 border-secondary-200'
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      {getLogIcon(log.level || log.type, log.logType)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className={cn(
                              'px-2 py-1 text-xs rounded uppercase font-semibold',
                              log.logType === 'understanding'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                : log.level === 'error' ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400' :
                                  log.level === 'warning' ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400' :
                                  log.level === 'info' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' :
                                  'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                            )}>
                              {getLogTypeLabel(log.logType, log.type || log.level)}
                            </span>
                            {log.confidence && (
                              <span className={cn(
                                'text-xs px-2 py-1 rounded bg-gray-100 text-gray-600',
                                darkMode ? 'bg-gray-800 text-gray-400' : ''
                              )}>
                                {Math.round(log.confidence * 100)}%
                              </span>
                            )}
                          </div>
                          <span className={cn(
                            'text-xs',
                            darkMode ? 'text-secondary-400' : 'text-secondary-500'
                          )}>
                            {formatTime(log.timestamp)}
                          </span>
                        </div>
                        <p className={cn(
                          'break-all',
                          darkMode ? 'text-secondary-300' : 'text-secondary-700'
                        )}>
                          {log.logType === 'understanding' ? log.action : log.message}
                        </p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <details className="mt-2">
                            <summary className={cn(
                              'text-xs cursor-pointer hover:underline',
                              darkMode ? 'text-secondary-400' : 'text-secondary-500'
                            )}>
                              View Details
                            </summary>
                            <pre className={cn(
                              'text-xs mt-1 p-2 rounded overflow-x-auto',
                              darkMode ? 'bg-secondary-900 text-secondary-300' : 'bg-secondary-100 text-secondary-700'
                            )}>
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
