import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX as X,
  FiBell as Bell,
  FiPhone as Phone,
  FiWifi as Wifi,
  FiAlertTriangle as AlertTriangle,
  FiInfo as Info,
  FiCheckCircle as CheckCircle,
  FiXCircle as XCircle,
  FiTrash2 as Trash,
  FiRefreshCw as Refresh,
  FiCpu as Brain,
  FiActivity as Activity,
  FiFilter as Filter
} from 'react-icons/fi';
import { cn } from '../utils/ui';
import notificationService from '../utils/notificationService';
import { generateExampleUnderstandingLogs, generateExampleSystemLogs } from '../utils/understandingLogExamples';

const NotificationsPanel = ({ isOpen, onClose, darkMode }) => {
  const [notifications, setNotifications] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [understandingLogs, setUnderstandingLogs] = useState([]);
  const [combinedLogs, setCombinedLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('notifications');
  const [logFilter, setLogFilter] = useState('all'); // 'all', 'system', 'understanding'

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

  const clearSystemLogs = () => {
    notificationService.clearLogs();
  };

  const generateTestNotifications = () => {
    notificationService.generateTestNotifications();
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
          return <Info className="w-4 h-4 text-primary-500" />;
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

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, x: 300 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          exit={{ scale: 0.9, opacity: 0, x: 300 }}
          className={cn(
            "w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl",
            darkMode ? "bg-secondary-900 text-white" : "bg-white text-secondary-900"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between p-6 border-b",
            darkMode ? "border-secondary-700" : "border-secondary-200"
          )}>
            <div className="flex items-center space-x-3">
              <Bell className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Notifications & Logs</h2>
            </div>
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-lg transition-colors",
                darkMode ? "hover:bg-secondary-800" : "hover:bg-secondary-100"
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className={cn(
            "flex border-b",
            darkMode ? "border-secondary-700" : "border-secondary-200"
          )}>
            <button
              onClick={() => setActiveTab('notifications')}
              className={cn(
                "flex-1 px-6 py-3 font-medium transition-colors",
                activeTab === 'notifications'
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : darkMode ? "text-secondary-400 hover:text-white" : "text-secondary-600 hover:text-secondary-900"
              )}
            >
              Notifications ({notifications.filter(n => !n.read).length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={cn(
                "flex-1 px-6 py-3 font-medium transition-colors",
                activeTab === 'logs'
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : darkMode ? "text-secondary-400 hover:text-white" : "text-secondary-600 hover:text-secondary-900"
              )}
            >
              All Logs ({combinedLogs.length})
            </button>
          </div>

          {/* Content */}
          <div className="h-96 overflow-y-auto p-6">
            {activeTab === 'notifications' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Recent Notifications</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={generateTestNotifications}
                      className="text-xs px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                    >
                      Test
                    </button>
                    <button
                      onClick={clearNotifications}
                      className="text-xs px-3 py-1 bg-danger-600 text-white rounded-md hover:bg-danger-700 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-secondary-500">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-colors",
                        notification.read
                          ? darkMode ? "bg-secondary-800 border-secondary-700" : "bg-secondary-50 border-secondary-200"
                          : darkMode ? "bg-secondary-700 border-secondary-600" : "bg-primary-50 border-primary-200",
                        "hover:shadow-md"
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{notification.title}</h4>
                            <span className="text-xs text-secondary-500">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-secondary-600 mt-1">{notification.message}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">System & Understanding Logs</h3>
                  <div className="flex items-center space-x-2">
                    <select
                      value={logFilter}
                      onChange={(e) => setLogFilter(e.target.value)}
                      className={cn(
                        "text-xs px-2 py-1 rounded border",
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
                      className="text-xs px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                    >
                      Generate Test Logs
                    </button>
                    <button
                      onClick={clearAllLogs}
                      className="text-xs px-3 py-1 bg-danger-600 text-white rounded-md hover:bg-danger-700 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {getFilteredLogs().length === 0 ? (
                  <div className="text-center py-8 text-secondary-500">
                    <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No logs yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getFilteredLogs().map((log) => (
                      <div
                        key={log.id}
                        className={cn(
                          "p-3 rounded-md border text-sm",
                          log.logType === 'understanding' ? "font-sans" : "font-mono",
                          darkMode ? "bg-secondary-800 border-secondary-700" : "bg-secondary-50 border-secondary-200"
                        )}
                      >
                        <div className="flex items-start space-x-2">
                          {getLogIcon(log.level || log.type, log.logType)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className={cn(
                                  "text-xs font-medium uppercase px-2 py-1 rounded",
                                  log.logType === 'understanding'
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                    : log.level === 'error' ? "bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400" :
                                      log.level === 'warning' ? "bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400" :
                                      log.level === 'info' ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400" :
                                      "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400"
                                )}>
                                  {getLogTypeLabel(log.logType, log.type || log.level)}
                                </span>
                                {log.confidence && (
                                  <span className="text-xs text-secondary-500">
                                    {Math.round(log.confidence * 100)}%
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-secondary-500">
                                {formatTime(log.timestamp)}
                              </span>
                            </div>
                            <p className="mt-1 break-all">
                              {log.logType === 'understanding' ? log.action : log.message}
                            </p>
                            {log.details && Object.keys(log.details).length > 0 && (
                              <details className="mt-2">
                                <summary className="text-xs text-secondary-500 cursor-pointer hover:text-secondary-700">
                                  Details
                                </summary>
                                <pre className="text-xs mt-1 p-2 bg-secondary-100 dark:bg-secondary-900 rounded overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationsPanel;
