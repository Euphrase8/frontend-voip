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
  FiClock as Clock
} from 'react-icons/fi';
import { cn } from '../utils/ui';
import notificationService from '../utils/notificationService';

const NotificationsPage = ({ darkMode, user }) => {
  const [notifications, setNotifications] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('notifications');

  useEffect(() => {
    // Load initial data from notification service
    setNotifications(notificationService.getNotifications());
    setSystemLogs(notificationService.getLogs());

    // Set up listener for real-time updates
    const unsubscribe = notificationService.addListener((type, data) => {
      if (type === 'notification') {
        setNotifications(notificationService.getNotifications());
      } else if (type === 'log') {
        setSystemLogs(notificationService.getLogs());
      } else if (type === 'clear') {
        setNotifications([]);
      } else if (type === 'clearLogs') {
        setSystemLogs([]);
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

  const getLogIcon = (level) => {
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

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell, count: notifications.length },
    ...(user?.role === 'admin' ? [
      { id: 'logs', label: 'System Logs', icon: Activity, count: systemLogs.length }
    ] : [])
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center space-x-3">
          <Bell className={cn(
            'w-6 h-6',
            darkMode ? 'text-primary-400' : 'text-primary-600'
          )} />
          <h1 className={cn(
            'text-2xl font-bold',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            {user?.role === 'admin' ? 'Notifications & Logs' : 'Notifications'}
          </h1>
        </div>
        <div className="flex space-x-2">
          {activeTab === 'notifications' ? (
            <>
              <button
                onClick={markAllAsRead}
                className="btn-secondary flex items-center space-x-2"
                disabled={notifications.length === 0}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark All Read</span>
              </button>
              <button
                onClick={clearNotifications}
                className="btn-danger flex items-center space-x-2"
                disabled={notifications.length === 0}
              >
                <Trash className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </>
          ) : user?.role === 'admin' && activeTab === 'logs' ? (
            <button
              onClick={clearLogs}
              className="btn-danger flex items-center space-x-2"
              disabled={systemLogs.length === 0}
            >
              <Trash className="w-4 h-4" />
              <span>Clear Logs</span>
            </button>
          ) : null}
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
      <div className="flex-1 overflow-hidden">
        {activeTab === 'notifications' && (
          <div className="h-full overflow-y-auto p-6">
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
          <div className="h-full overflow-y-auto p-6">
            {systemLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Activity className={cn(
                  'w-16 h-16 mb-4',
                  darkMode ? 'text-secondary-600' : 'text-secondary-400'
                )} />
                <h3 className={cn(
                  'text-lg font-medium mb-2',
                  darkMode ? 'text-secondary-400' : 'text-secondary-600'
                )}>
                  No system logs
                </h3>
                <p className={cn(
                  'text-sm',
                  darkMode ? 'text-secondary-500' : 'text-secondary-500'
                )}>
                  System activity logs will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {systemLogs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'p-3 rounded border text-sm font-mono',
                      darkMode
                        ? 'bg-secondary-800 border-secondary-700'
                        : 'bg-secondary-50 border-secondary-200'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      {getLogIcon(log.level)}
                      <span className={cn(
                        'text-xs',
                        darkMode ? 'text-secondary-400' : 'text-secondary-500'
                      )}>
                        {formatTime(log.timestamp)}
                      </span>
                      <span className={cn(
                        'px-2 py-1 text-xs rounded uppercase font-semibold',
                        log.level === 'error' ? 'bg-danger-100 text-danger-700' :
                        log.level === 'warning' ? 'bg-warning-100 text-warning-700' :
                        log.level === 'info' ? 'bg-primary-100 text-primary-700' :
                        'bg-success-100 text-success-700'
                      )}>
                        {log.level}
                      </span>
                      <span className={cn(
                        'flex-1',
                        darkMode ? 'text-secondary-300' : 'text-secondary-700'
                      )}>
                        {log.message}
                      </span>
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
