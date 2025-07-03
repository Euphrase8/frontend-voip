import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiUsers as Users,
  FiPhone as Phone,
  FiActivity as Activity,
  FiSettings as Settings,
  FiTrash2 as Trash2,
  FiUserPlus as UserPlus,
  FiDownload as Download,
  FiRefreshCw as RefreshCw,
  FiAlertTriangle as AlertTriangle,
  FiCheckCircle as CheckCircle,
  FiXCircle as XCircle,
  FiClock as Clock,
  FiTrendingUp as TrendingUp,
  FiShield as Shield,
  FiDatabase as Database,
  FiWifi as Wifi,
  FiBell as Bell
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { cn, formatDate, formatDuration, getStatusColor } from '../utils/ui';
import toast from 'react-hot-toast';
import adminService from '../services/adminService';
import CONFIG from '../services/config';
import AdminCallPanel from '../components/AdminCallPanel';
import NotificationsPage from './NotificationsPage';
import ConfirmationModal from '../components/ConfirmationModal';

// Chart Components
const UserStatusChart = ({ stats, darkMode }) => {
  const total = stats.total_users || 1;
  const online = stats.online_users || 0;
  const offline = total - online;

  const onlinePercentage = (online / total) * 100;
  const offlinePercentage = (offline / total) * 100;

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={darkMode ? "#374151" : "#e5e7eb"}
              strokeWidth="2"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray={`${onlinePercentage}, 100`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={cn(
                "text-lg font-bold",
                darkMode ? "text-white" : "text-secondary-900"
              )}>
                {online}
              </div>
              <div className={cn(
                "text-xs",
                darkMode ? "text-secondary-400" : "text-secondary-600"
              )}>
                Online
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className={cn(
              "text-sm",
              darkMode ? "text-secondary-300" : "text-secondary-700"
            )}>
              Online
            </span>
          </div>
          <span className={cn(
            "text-sm font-medium",
            darkMode ? "text-white" : "text-secondary-900"
          )}>
            {online} ({onlinePercentage.toFixed(1)}%)
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-3 h-3 rounded-full",
              darkMode ? "bg-secondary-600" : "bg-secondary-300"
            )}></div>
            <span className={cn(
              "text-sm",
              darkMode ? "text-secondary-300" : "text-secondary-700"
            )}>
              Offline
            </span>
          </div>
          <span className={cn(
            "text-sm font-medium",
            darkMode ? "text-white" : "text-secondary-900"
          )}>
            {offline} ({offlinePercentage.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
};

const CallActivityChart = ({ stats, darkMode }) => {
  // Generate mock hourly data for the last 24 hours
  const generateHourlyData = () => {
    const hours = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const calls = Math.floor(Math.random() * (stats.calls_today / 24 + 5));
      hours.push({
        hour: hour.getHours(),
        calls: calls,
        label: hour.getHours().toString().padStart(2, '0') + ':00'
      });
    }
    return hours;
  };

  const hourlyData = generateHourlyData();
  const maxCalls = Math.max(...hourlyData.map(h => h.calls), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-end space-x-1 h-32">
        {hourlyData.slice(-12).map((hour, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-primary-500 rounded-t transition-all duration-300 hover:bg-primary-600"
              style={{
                height: `${(hour.calls / maxCalls) * 100}%`,
                minHeight: '2px'
              }}
              title={`${hour.label}: ${hour.calls} calls`}
            ></div>
            <span className={cn(
              "text-xs mt-1 transform rotate-45 origin-bottom-left",
              darkMode ? "text-secondary-400" : "text-secondary-600"
            )}>
              {hour.hour}
            </span>
          </div>
        ))}
      </div>
      <div className="text-center">
        <span className={cn(
          "text-sm",
          darkMode ? "text-secondary-400" : "text-secondary-600"
        )}>
          Last 12 hours
        </span>
      </div>
    </div>
  );
};

const SystemHealthChart = ({ stats, darkMode }) => {
  const healthMetrics = [
    {
      name: 'WebSocket Connections',
      value: stats.ws_connections || 0,
      max: Math.max(stats.total_users || 10, 10),
      color: 'bg-blue-500'
    },
    {
      name: 'Active Calls',
      value: stats.active_calls || 0,
      max: Math.max(stats.online_users || 5, 5),
      color: 'bg-yellow-500'
    },
    {
      name: 'Online Users',
      value: stats.online_users || 0,
      max: stats.total_users || 1,
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="space-y-4">
      {healthMetrics.map((metric, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-sm",
              darkMode ? "text-secondary-300" : "text-secondary-700"
            )}>
              {metric.name}
            </span>
            <span className={cn(
              "text-sm font-medium",
              darkMode ? "text-white" : "text-secondary-900"
            )}>
              {metric.value}/{metric.max}
            </span>
          </div>
          <div className={cn(
            "w-full h-2 rounded-full",
            darkMode ? "bg-secondary-700" : "bg-secondary-200"
          )}>
            <div
              className={cn("h-2 rounded-full transition-all duration-500", metric.color)}
              style={{
                width: `${Math.min((metric.value / metric.max) * 100, 100)}%`
              }}
            ></div>
          </div>
        </div>
      ))}
      <div className="pt-2 border-t border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-success-500" />
          <span className="text-sm text-success-600">All systems operational</span>
        </div>
      </div>
    </div>
  );
};

const PerformanceMetrics = ({ stats, darkMode }) => {
  const metrics = [
    {
      label: 'Call Success Rate',
      value: '98.5%',
      trend: '+2.1%',
      trendUp: true,
      icon: CheckCircle,
      color: 'text-success-600'
    },
    {
      label: 'Avg Call Duration',
      value: '4:32',
      trend: '+0:15',
      trendUp: true,
      icon: Clock,
      color: 'text-primary-600'
    },
    {
      label: 'System Uptime',
      value: '99.9%',
      trend: 'Stable',
      trendUp: true,
      icon: Shield,
      color: 'text-success-600'
    },
    {
      label: 'Response Time',
      value: '45ms',
      trend: '-5ms',
      trendUp: true,
      icon: TrendingUp,
      color: 'text-success-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {metrics.map((metric, index) => (
        <div key={index} className={cn(
          "p-3 rounded-lg border",
          darkMode
            ? "bg-secondary-700 border-secondary-600"
            : "bg-secondary-50 border-secondary-200"
        )}>
          <div className="flex items-center space-x-2 mb-1">
            <metric.icon className={cn("w-4 h-4", metric.color)} />
            <span className={cn(
              "text-xs font-medium",
              darkMode ? "text-secondary-300" : "text-secondary-700"
            )}>
              {metric.label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-lg font-bold",
              darkMode ? "text-white" : "text-secondary-900"
            )}>
              {metric.value}
            </span>
            <span className={cn(
              "text-xs",
              metric.trendUp ? "text-success-600" : "text-danger-600"
            )}>
              {metric.trend}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const RecentActivityFeed = ({ darkMode }) => {
  const activities = [
    {
      id: 1,
      type: 'call',
      message: 'Call completed: 1001 → 1002',
      time: '2 min ago',
      icon: Phone,
      color: 'text-success-600'
    },
    {
      id: 2,
      type: 'user',
      message: 'User user3 logged in',
      time: '5 min ago',
      icon: Users,
      color: 'text-primary-600'
    },
    {
      id: 3,
      type: 'call',
      message: 'Missed call: 1003 → 1001',
      time: '8 min ago',
      icon: Phone,
      color: 'text-warning-600'
    },
    {
      id: 4,
      type: 'system',
      message: 'System backup completed',
      time: '15 min ago',
      icon: Database,
      color: 'text-success-600'
    },
    {
      id: 5,
      type: 'user',
      message: 'User user2 logged out',
      time: '22 min ago',
      icon: Users,
      color: 'text-secondary-600'
    }
  ];

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3">
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            darkMode ? "bg-secondary-700" : "bg-secondary-100"
          )}>
            <activity.icon className={cn("w-4 h-4", activity.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm",
              darkMode ? "text-secondary-300" : "text-secondary-700"
            )}>
              {activity.message}
            </p>
            <p className={cn(
              "text-xs mt-1",
              darkMode ? "text-secondary-500" : "text-secondary-500"
            )}>
              {activity.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// StatCard Component
const StatCard = ({ title, value, icon: Icon, color = 'primary', trend }) => {
  const { darkMode } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-6 rounded-xl border transition-all duration-200 hover:shadow-lg',
        darkMode
          ? 'bg-secondary-800 border-secondary-700'
          : 'bg-white border-secondary-200'
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={cn(
            'text-sm font-medium',
            darkMode ? 'text-secondary-400' : 'text-secondary-600'
          )}>
            {title}
          </p>
          <p className={cn(
            'text-2xl font-bold mt-1',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            {value}
          </p>
          {trend && (
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="w-4 h-4 text-success-500 mr-1" />
              <span className="text-success-600">{trend}</span>
            </div>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-lg',
          color === 'primary' && 'bg-primary-100 text-primary-600',
          color === 'success' && 'bg-success-100 text-success-600',
          color === 'warning' && 'bg-warning-100 text-warning-600',
          color === 'danger' && 'bg-danger-100 text-danger-600'
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};

const AdminDashboard = ({ user, onLogout }) => {
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdminCall, setShowAdminCall] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, user: null, loading: false });
  const [deleteLogConfirmation, setDeleteLogConfirmation] = useState({ show: false, log: null, loading: false });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'calls', label: 'Call Logs', icon: Phone },
    { id: 'system', label: 'System Status', icon: Wifi },
    { id: 'notifications', label: 'Notifications & Logs', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        loadStats(),
        loadUsers(),
        loadCallLogs(),
        loadSystemStatus(),
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminService.getSystemStats();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await adminService.getUsers();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadCallLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${CONFIG.API_URL}/protected/call/logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setCallLogs(data.call_logs || []);
      }
    } catch (error) {
      console.error('Failed to load call logs:', error);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${CONFIG.API_URL}/protected/extensions/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSystemStatus(data);
      }
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  const showDeleteConfirmation = (user) => {
    setDeleteConfirmation({ show: true, user, loading: false });
  };

  const hideDeleteConfirmation = () => {
    setDeleteConfirmation({ show: false, user: null, loading: false });
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirmation.user) return;

    setDeleteConfirmation(prev => ({ ...prev, loading: true }));

    try {
      const result = await adminService.deleteUser(deleteConfirmation.user.id);

      if (result.success) {
        toast.success(`User "${deleteConfirmation.user.username}" deleted successfully`);
        loadUsers();
        loadStats();
        hideDeleteConfirmation();
      } else {
        toast.error(result.error || 'Failed to delete user');
        setDeleteConfirmation(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(`Failed to delete user: ${error.message}`);
      setDeleteConfirmation(prev => ({ ...prev, loading: false }));
    }
  };

  const showDeleteLogConfirmation = (log) => {
    setDeleteLogConfirmation({
      show: true,
      log,
      loading: false
    });
  };

  const hideDeleteLogConfirmation = () => {
    setDeleteLogConfirmation({
      show: false,
      log: null,
      loading: false
    });
  };

  const confirmDeleteCallLog = async () => {
    if (!deleteLogConfirmation.log) return;

    setDeleteLogConfirmation(prev => ({ ...prev, loading: true }));

    try {
      const result = await adminService.deleteCallLog(deleteLogConfirmation.log.id);

      if (result.success) {
        toast.success('Call log deleted successfully');
        loadCallLogs(); // Refresh call logs without full page reload
        hideDeleteLogConfirmation();
      } else {
        toast.error(result.error || 'Failed to delete call log');
        setDeleteLogConfirmation(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Failed to delete call log:', error);
      toast.error('Failed to delete call log');
      setDeleteLogConfirmation(prev => ({ ...prev, loading: false }));
    }
  };





  if (loading) {
    return (
      <div className={cn(
        'min-h-screen flex items-center justify-center',
        darkMode ? 'bg-secondary-900' : 'bg-secondary-50'
      )}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className={cn(
            'text-lg font-medium',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            Loading Admin Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'h-screen flex flex-col overflow-hidden',
      darkMode ? 'bg-secondary-900' : 'bg-secondary-50'
    )}>
      {/* Header */}
      <div className={cn(
        'flex-shrink-0 border-b px-4 sm:px-6 py-4',
        darkMode
          ? 'bg-secondary-800 border-secondary-700'
          : 'bg-white border-secondary-200'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
            <div>
              <h1 className={cn(
                'text-lg sm:text-2xl font-bold',
                darkMode ? 'text-white' : 'text-secondary-900'
              )}>
                Admin Dashboard
              </h1>
              <p className={cn(
                'text-xs sm:text-sm',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                Welcome back, {user?.username}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setShowAdminCall(true)}
              className="btn-primary flex items-center space-x-1 sm:space-x-2 text-sm"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Admin Call</span>
              <span className="sm:hidden">Call</span>
            </button>
            <button
              onClick={loadDashboardData}
              disabled={refreshing}
              className={cn(
                'p-2 rounded-lg transition-colors',
                refreshing && 'animate-spin',
                darkMode
                  ? 'bg-secondary-700 hover:bg-secondary-600 text-white'
                  : 'bg-secondary-100 hover:bg-secondary-200 text-secondary-700'
              )}
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={onLogout}
              className="btn-danger text-sm"
            >
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Exit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={cn(
        'flex-shrink-0 border-b px-4 sm:px-6',
        darkMode
          ? 'bg-secondary-800 border-secondary-700'
          : 'bg-white border-secondary-200'
      )}>
        <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap',
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
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">
                  {tab.id === 'overview' ? 'Overview' :
                   tab.id === 'users' ? 'Users' :
                   tab.id === 'calls' ? 'Calls' :
                   tab.id === 'system' ? 'System' :
                   tab.id === 'notifications' ? 'Logs' :
                   'Settings'}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'overview' && (
          <div className="h-full overflow-y-auto p-4 sm:p-6">
            <OverviewTab
              stats={stats}
              darkMode={darkMode}
              loadDashboardData={loadDashboardData}
              refreshing={refreshing}
            />
          </div>
        )}
        {activeTab === 'users' && (
          <div className="h-full overflow-y-auto p-4 sm:p-6">
            <UsersTab users={users} onDeleteUser={showDeleteConfirmation} darkMode={darkMode} />
          </div>
        )}
        {activeTab === 'calls' && (
          <CallLogsTab callLogs={callLogs} onDeleteCallLog={showDeleteLogConfirmation} darkMode={darkMode} />
        )}
        {activeTab === 'system' && (
          <div className="h-full overflow-y-auto p-4 sm:p-6">
            <SystemTab systemStatus={systemStatus} darkMode={darkMode} />
          </div>
        )}
        {activeTab === 'notifications' && (
          <NotificationsPage darkMode={darkMode} user={user} />
        )}
        {activeTab === 'settings' && (
          <div className="h-full overflow-y-auto p-4 sm:p-6">
            <SettingsTab darkMode={darkMode} />
          </div>
        )}
      </div>

      {/* Admin Call Panel */}
      <AdminCallPanel
        isOpen={showAdminCall}
        onClose={() => setShowAdminCall(false)}
        darkMode={darkMode}
        currentUser={user}
      />

      {/* Delete User Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.show}
        onClose={hideDeleteConfirmation}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={
          deleteConfirmation.user
            ? `Are you sure you want to delete the user "${deleteConfirmation.user.username}"? This action cannot be undone and will permanently remove all user data including call logs and settings.`
            : "Are you sure you want to delete this user?"
        }
        confirmText="Delete User"
        cancelText="Cancel"
        type="danger"
        loading={deleteConfirmation.loading}
        darkMode={darkMode}
      />

      {/* Delete Call Log Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteLogConfirmation.show}
        onClose={hideDeleteLogConfirmation}
        onConfirm={confirmDeleteCallLog}
        title="Delete Call Log"
        message={
          deleteLogConfirmation.log
            ? `Are you sure you want to delete this call log between "${deleteLogConfirmation.log.caller?.username}" and "${deleteLogConfirmation.log.callee?.username}"? This action cannot be undone.`
            : "Are you sure you want to delete this call log?"
        }
        confirmText="Delete Log"
        cancelText="Cancel"
        type="danger"
        loading={deleteLogConfirmation.loading}
        darkMode={darkMode}
      />
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ stats, darkMode, loadDashboardData, refreshing }) => {
  if (!stats) {
    return (
      <div className="text-center py-8">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
        <p className={cn(
          'text-lg',
          darkMode ? 'text-secondary-400' : 'text-secondary-600'
        )}>
          Loading statistics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.total_users}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Online Users"
          value={stats.online_users}
          icon={Activity}
          color="success"
        />
        <StatCard
          title="Active Calls"
          value={stats.active_calls}
          icon={Phone}
          color="warning"
        />
        <StatCard
          title="Calls Today"
          value={stats.calls_today}
          icon={TrendingUp}
          color="primary"
        />
      </div>

      {/* Charts and Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* User Status Distribution Chart */}
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
            User Status Distribution
          </h3>
          <UserStatusChart stats={stats} darkMode={darkMode} />
        </motion.div>

        {/* Call Activity Chart */}
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
            Call Activity (24h)
          </h3>
          <CallActivityChart stats={stats} darkMode={darkMode} />
        </motion.div>

        {/* System Health */}
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
            System Health
          </h3>
          <SystemHealthChart stats={stats} darkMode={darkMode} />
        </motion.div>
      </div>

      {/* Additional Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
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
            Performance Metrics
          </h3>
          <PerformanceMetrics stats={stats} darkMode={darkMode} />
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
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
            Recent Activity
          </h3>
          <RecentActivityFeed darkMode={darkMode} />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
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
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => toast.success('User management feature coming soon')}
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
            <button
              onClick={async () => {
                try {
                  console.log('[AdminDashboard] Quick export initiated from Overview tab');
                  await adminService.exportCallLogs('csv');
                  toast.success('Call logs exported successfully');
                } catch (error) {
                  console.error('[AdminDashboard] Quick export failed:', error);
                  toast.error(`Failed to export call logs: ${error.message}`);
                }
              }}
              className="w-full btn-secondary flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Call Logs</span>
            </button>
            <button
              onClick={loadDashboardData}
              disabled={refreshing}
              className={cn(
                'w-full btn-secondary flex items-center justify-center space-x-2',
                refreshing && 'opacity-50 cursor-not-allowed'
              )}
            >
              <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
              <span>Refresh Data</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Users Tab Component
const UsersTab = ({ users, onDeleteUser, darkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.extension.includes(searchTerm);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-primary w-full"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="input-primary sm:w-48"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-xl border overflow-hidden',
          darkMode
            ? 'bg-secondary-800 border-secondary-700'
            : 'bg-white border-secondary-200'
        )}
      >
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Users className={cn(
              'w-16 h-16 mb-4',
              darkMode ? 'text-secondary-600' : 'text-secondary-400'
            )} />
            <h3 className={cn(
              'text-lg font-medium mb-2',
              darkMode ? 'text-secondary-400' : 'text-secondary-600'
            )}>
              {users.length === 0 ? 'No users found' : 'No users match your filters'}
            </h3>
            <p className={cn(
              'text-sm',
              darkMode ? 'text-secondary-500' : 'text-secondary-500'
            )}>
              {users.length === 0
                ? 'Users will appear here when they register.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={cn(
                'border-b',
                darkMode ? 'border-secondary-700' : 'border-secondary-200'
              )}>
                <tr>
                  <th className={cn(
                    'text-left py-3 px-4 font-medium text-sm',
                    darkMode ? 'text-secondary-400' : 'text-secondary-600'
                  )}>
                    User
                  </th>
                  <th className={cn(
                    'text-left py-3 px-4 font-medium text-sm hidden sm:table-cell',
                    darkMode ? 'text-secondary-400' : 'text-secondary-600'
                  )}>
                    Extension
                  </th>
                  <th className={cn(
                    'text-left py-3 px-4 font-medium text-sm',
                    darkMode ? 'text-secondary-400' : 'text-secondary-600'
                  )}>
                    Status
                  </th>
                  <th className={cn(
                    'text-left py-3 px-4 font-medium text-sm hidden md:table-cell',
                    darkMode ? 'text-secondary-400' : 'text-secondary-600'
                  )}>
                    Role
                  </th>
                  <th className={cn(
                    'text-right py-3 px-4 font-medium text-sm',
                    darkMode ? 'text-secondary-400' : 'text-secondary-600'
                  )}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={cn(
                      'border-b transition-colors hover:bg-opacity-50',
                      darkMode
                        ? 'border-secondary-700 hover:bg-secondary-700'
                        : 'border-secondary-100 hover:bg-secondary-50'
                    )}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className={cn(
                          'font-medium text-sm sm:text-base',
                          darkMode ? 'text-white' : 'text-secondary-900'
                        )}>
                          {user.username}
                        </p>
                        <p className={cn(
                          'text-xs sm:text-sm',
                          darkMode ? 'text-secondary-400' : 'text-secondary-600'
                        )}>
                          {user.email}
                        </p>
                        <p className={cn(
                          'text-xs font-mono sm:hidden',
                          darkMode ? 'text-secondary-400' : 'text-secondary-600'
                        )}>
                          Ext: {user.extension}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className={cn(
                        'font-mono text-sm',
                        darkMode ? 'text-secondary-300' : 'text-secondary-700'
                      )}>
                        {user.extension}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          getStatusColor(user.status, 'bg')
                        )} />
                        <span className={cn(
                          'text-xs sm:text-sm capitalize',
                          getStatusColor(user.status, 'text')
                        )}>
                          {user.status}
                        </span>
                      </div>
                      <span className={cn(
                        'md:hidden px-2 py-1 rounded-full text-xs font-medium mt-1 inline-block',
                        user.role === 'admin'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-secondary-100 text-secondary-700'
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        user.role === 'admin'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-secondary-100 text-secondary-700'
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => onDeleteUser(user)}
                          className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                          title={`Delete user ${user.username}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Call Logs Tab Component
const CallLogsTab = ({ callLogs, onDeleteCallLog, darkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const filteredLogs = callLogs.filter(log => {
    const matchesSearch = log.caller?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.callee?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.caller?.extension?.includes(searchTerm) ||
                         log.callee?.extension?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleExport = async (format = 'csv') => {
    try {
      setIsExporting(true);
      console.log(`[AdminDashboard] Starting export of ${filteredLogs.length} call logs as ${format}`);

      // Add current filters to export
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (filterStatus !== 'all') filters.status = filterStatus;

      await adminService.exportCallLogs(format, filters);
      toast.success(`Call logs exported as ${format.toUpperCase()} successfully`);
      console.log(`[AdminDashboard] Export completed successfully`);
    } catch (error) {
      console.error('[AdminDashboard] Failed to export call logs:', error);
      toast.error(`Failed to export call logs: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Filters */}
      <div className="flex-shrink-0 p-4 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search call logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-primary w-full"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-primary sm:w-48"
            >
              <option value="all">All Status</option>
              <option value="answered">Answered</option>
              <option value="ended">Ended</option>
              <option value="failed">Failed</option>
              <option value="missed">Missed</option>
            </select>
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="btn-primary flex items-center justify-center space-x-2 whitespace-nowrap"
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Call Logs Table - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-full overflow-y-auto"
        >
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Phone className={cn(
                'w-16 h-16 mb-4',
                darkMode ? 'text-secondary-600' : 'text-secondary-400'
              )} />
              <h3 className={cn(
                'text-lg font-medium mb-2',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                {callLogs.length === 0 ? 'No call logs' : 'No logs match your filters'}
              </h3>
              <p className={cn(
                'text-sm',
                darkMode ? 'text-secondary-500' : 'text-secondary-500'
              )}>
                {callLogs.length === 0
                  ? 'Call logs will appear here when users make calls.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </div>
          ) : (
            <div className={cn(
              'border-x border-b rounded-b-xl overflow-hidden',
              darkMode
                ? 'bg-secondary-800 border-secondary-700'
                : 'bg-white border-secondary-200'
            )}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={cn(
                    'border-b sticky top-0 z-10',
                    darkMode
                      ? 'border-secondary-700 bg-secondary-800'
                      : 'border-secondary-200 bg-white'
                  )}>
                    <tr>
                      <th className={cn(
                        'text-left py-3 px-4 font-medium text-sm',
                        darkMode ? 'text-secondary-400' : 'text-secondary-600'
                      )}>
                        Call Details
                      </th>
                      <th className={cn(
                        'text-left py-3 px-4 font-medium text-sm',
                        darkMode ? 'text-secondary-400' : 'text-secondary-600'
                      )}>
                        Duration
                      </th>
                      <th className={cn(
                        'text-left py-3 px-4 font-medium text-sm',
                        darkMode ? 'text-secondary-400' : 'text-secondary-600'
                      )}>
                        Status
                      </th>
                      <th className={cn(
                        'text-left py-3 px-4 font-medium text-sm',
                        darkMode ? 'text-secondary-400' : 'text-secondary-600'
                      )}>
                        Date
                      </th>
                      <th className={cn(
                        'text-right py-3 px-4 font-medium text-sm',
                        darkMode ? 'text-secondary-400' : 'text-secondary-600'
                      )}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className={cn(
                          'border-b transition-colors hover:bg-opacity-50',
                          darkMode
                            ? 'border-secondary-700 hover:bg-secondary-700'
                            : 'border-secondary-100 hover:bg-secondary-50'
                        )}
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className={cn(
                              'font-medium text-sm sm:text-base',
                              darkMode ? 'text-white' : 'text-secondary-900'
                            )}>
                              {log.caller?.username} → {log.callee?.username}
                            </p>
                            <p className={cn(
                              'text-xs sm:text-sm',
                              darkMode ? 'text-secondary-400' : 'text-secondary-600'
                            )}>
                              {log.caller?.extension} → {log.callee?.extension}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            'font-mono text-xs sm:text-sm',
                            darkMode ? 'text-secondary-300' : 'text-secondary-700'
                          )}>
                            {formatDuration(log.duration)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            log.status === 'answered' && 'bg-success-100 text-success-700',
                            log.status === 'ended' && 'bg-secondary-100 text-secondary-700',
                            log.status === 'failed' && 'bg-danger-100 text-danger-700',
                            log.status === 'missed' && 'bg-warning-100 text-warning-700'
                          )}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            'text-xs sm:text-sm',
                            darkMode ? 'text-secondary-300' : 'text-secondary-700'
                          )}>
                            {formatDate(log.created_at)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onDeleteCallLog(log)}
                            className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                            title="Delete call log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// System Status Tab Component
const SystemTab = ({ systemStatus, darkMode }) => {
  // Function to determine actual online status based on WebSocket connection and login status
  const getActualStatus = (status) => {
    // If WebSocket is connected with active clients, user is definitely online
    if (status.ws_connected && status.client_count > 0) {
      return 'online';
    }

    // If user has database status as online but no WebSocket connection,
    // they might be recently logged in but not actively connected - show as away
    if (status.status === 'online' && !status.ws_connected) {
      return 'away';
    }

    // If no WebSocket connection, user is effectively offline regardless of database status
    if (!status.ws_connected) {
      return 'offline';
    }

    // For all other cases, use the database status
    return status.status;
  };

  if (!systemStatus) {
    return (
      <div className="text-center py-8">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
        <p className={cn(
          'text-lg',
          darkMode ? 'text-secondary-400' : 'text-secondary-600'
        )}>
          Loading system status...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            'p-4 sm:p-6 rounded-xl border',
            darkMode
              ? 'bg-secondary-800 border-secondary-700'
              : 'bg-white border-secondary-200'
          )}
        >
          <h3 className={cn(
            'text-base sm:text-lg font-semibold mb-4 flex items-center space-x-2',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            <Wifi className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Connection Status</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={cn(
                'text-xs sm:text-sm',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                Total Clients
              </span>
              <span className={cn(
                'font-medium text-sm sm:text-base',
                darkMode ? 'text-white' : 'text-secondary-900'
              )}>
                {systemStatus.total_clients}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn(
                'text-xs sm:text-sm',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                Connected Extensions
              </span>
              <span className={cn(
                'font-medium text-sm sm:text-base',
                darkMode ? 'text-white' : 'text-secondary-900'
              )}>
                {systemStatus.connected_extensions?.length || 0}
              </span>
            </div>
          </div>
        </motion.div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            'p-4 sm:p-6 rounded-xl border',
            darkMode
              ? 'bg-secondary-800 border-secondary-700'
              : 'bg-white border-secondary-200'
          )}
        >
          <h3 className={cn(
            'text-base sm:text-lg font-semibold mb-4 flex items-center space-x-2',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            <Database className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>System Health</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={cn(
                'text-xs sm:text-sm',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                Database
              </span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success-500" />
                <span className="text-xs sm:text-sm text-success-600">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn(
                'text-xs sm:text-sm',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                WebSocket Server
              </span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success-500" />
                <span className="text-xs sm:text-sm text-success-600">Running</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Extension Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-xl border overflow-hidden',
          darkMode
            ? 'bg-secondary-800 border-secondary-700'
            : 'bg-white border-secondary-200'
        )}
      >
        <div className="p-4 sm:p-6 border-b border-secondary-200 dark:border-secondary-700">
          <h3 className={cn(
            'text-base sm:text-lg font-semibold mb-2',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            Extension Status Details
          </h3>
          <p className={cn(
            'text-xs sm:text-sm',
            darkMode ? 'text-secondary-400' : 'text-secondary-600'
          )}>
            Status shows "online" only for extensions with active WebSocket connections.
            Users without connections show as "offline" or "away" regardless of login status.
          </p>
        </div>
        {!systemStatus.connection_status || systemStatus.connection_status.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Wifi className={cn(
              'w-16 h-16 mb-4',
              darkMode ? 'text-secondary-600' : 'text-secondary-400'
            )} />
            <h3 className={cn(
              'text-lg font-medium mb-2',
              darkMode ? 'text-secondary-400' : 'text-secondary-600'
            )}>
              No extension data
            </h3>
            <p className={cn(
              'text-sm',
              darkMode ? 'text-secondary-500' : 'text-secondary-500'
            )}>
              Extension status information will appear here when available.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={cn(
                'border-b',
                darkMode ? 'border-secondary-700' : 'border-secondary-200'
              )}>
                <tr>
                  <th className={cn(
                    'text-left py-3 px-4 font-medium text-sm',
                    darkMode ? 'text-secondary-400' : 'text-secondary-600'
                  )}>
                    Extension
                  </th>
                  <th className={cn(
                    'text-left py-3 px-4 font-medium text-sm hidden sm:table-cell',
                    darkMode ? 'text-secondary-400' : 'text-secondary-600'
                  )}>
                    Username
                  </th>
                  <th className={cn(
                    'text-left py-3 px-4 font-medium text-sm',
                    darkMode ? 'text-secondary-400' : 'text-secondary-600'
                  )}>
                    Status
                  </th>
                  <th className={cn(
                    'text-left py-3 px-4 font-medium text-sm hidden md:table-cell',
                    darkMode ? 'text-secondary-400' : 'text-secondary-600'
                  )}>
                    WebSocket
                  </th>
                  <th className={cn(
                    'text-left py-3 px-4 font-medium text-sm hidden lg:table-cell',
                    darkMode ? 'text-secondary-400' : 'text-secondary-600'
                  )}>
                    Clients
                  </th>
                </tr>
              </thead>
              <tbody>
                {systemStatus.connection_status?.map((status) => (
                  <tr
                    key={status.extension}
                    className={cn(
                      'border-b transition-colors hover:bg-opacity-50',
                      darkMode
                        ? 'border-secondary-700 hover:bg-secondary-700'
                        : 'border-secondary-100 hover:bg-secondary-50'
                    )}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <span className={cn(
                          'font-mono text-sm',
                          darkMode ? 'text-secondary-300' : 'text-secondary-700'
                        )}>
                          {status.extension}
                        </span>
                        <p className={cn(
                          'text-xs sm:hidden',
                          darkMode ? 'text-secondary-400' : 'text-secondary-600'
                        )}>
                          {status.username}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className={cn(
                        'text-sm',
                        darkMode ? 'text-white' : 'text-secondary-900'
                      )}>
                        {status.username}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const actualStatus = getActualStatus(status);
                          return (
                            <>
                              <div className={cn(
                                'w-2 h-2 rounded-full',
                                getStatusColor(actualStatus, 'bg')
                              )} />
                              <span className={cn(
                                'text-xs sm:text-sm capitalize',
                                getStatusColor(actualStatus, 'text')
                              )}>
                                {actualStatus}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <div className="md:hidden mt-1 flex items-center space-x-1">
                        {status.ws_connected ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-success-500" />
                            <span className="text-xs text-success-600">Connected</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-danger-500" />
                            <span className="text-xs text-danger-600">Disconnected</span>
                          </>
                        )}
                        <span className={cn(
                          'text-xs lg:hidden ml-2',
                          darkMode ? 'text-secondary-400' : 'text-secondary-600'
                        )}>
                          ({status.client_count} clients)
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex items-center space-x-2">
                        {status.ws_connected ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-success-500" />
                            <span className="text-sm text-success-600">Connected</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-danger-500" />
                            <span className="text-sm text-danger-600">Disconnected</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="flex items-center space-x-1">
                        <span className={cn(
                          'text-sm font-medium',
                          darkMode ? 'text-secondary-300' : 'text-secondary-700'
                        )}>
                          {status.client_count}
                        </span>
                        <span className={cn(
                          'text-xs',
                          darkMode ? 'text-secondary-400' : 'text-secondary-600'
                        )}>
                          {status.client_count === 1 ? 'device' : 'devices'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Settings Tab Component
const SettingsTab = ({ darkMode }) => {
  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: 30,
    enableNotifications: true,
    enableAudioAlerts: false,
    maxCallLogs: 1000,
    sessionTimeout: 24,
    enableDebugMode: false,
    asteriskHost: '172.20.10.6',
    backendHost: '172.20.10.4',
    sipPort: '8088',
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    toast.success('Setting updated successfully');
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* General Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            'p-4 sm:p-6 rounded-xl border',
            darkMode
              ? 'bg-secondary-800 border-secondary-700'
              : 'bg-white border-secondary-200'
          )}
        >
          <h3 className={cn(
            'text-base sm:text-lg font-semibold mb-4 flex items-center space-x-2',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>General Settings</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className={cn(
                'text-sm font-medium',
                darkMode ? 'text-secondary-300' : 'text-secondary-700'
              )}>
                Auto Refresh Dashboard
              </label>
              <input
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className={cn(
                'text-sm font-medium',
                darkMode ? 'text-secondary-300' : 'text-secondary-700'
              )}>
                Refresh Interval (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={settings.refreshInterval}
                onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                className={cn(
                  'w-20 px-2 py-1 text-sm rounded border',
                  darkMode
                    ? 'bg-secondary-700 border-secondary-600 text-white'
                    : 'bg-white border-secondary-300 text-secondary-900'
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className={cn(
                'text-sm font-medium',
                darkMode ? 'text-secondary-300' : 'text-secondary-700'
              )}>
                Enable Notifications
              </label>
              <input
                type="checkbox"
                checked={settings.enableNotifications}
                onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className={cn(
                'text-sm font-medium',
                darkMode ? 'text-secondary-300' : 'text-secondary-700'
              )}>
                Audio Alerts
              </label>
              <input
                type="checkbox"
                checked={settings.enableAudioAlerts}
                onChange={(e) => handleSettingChange('enableAudioAlerts', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
            </div>
          </div>
        </motion.div>

        {/* System Configuration */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            'p-4 sm:p-6 rounded-xl border',
            darkMode
              ? 'bg-secondary-800 border-secondary-700'
              : 'bg-white border-secondary-200'
          )}
        >
          <h3 className={cn(
            'text-base sm:text-lg font-semibold mb-4 flex items-center space-x-2',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            <Database className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>System Configuration</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className={cn(
                'block text-sm font-medium mb-1',
                darkMode ? 'text-secondary-300' : 'text-secondary-700'
              )}>
                Asterisk Host
              </label>
              <input
                type="text"
                value={settings.asteriskHost}
                onChange={(e) => handleSettingChange('asteriskHost', e.target.value)}
                className={cn(
                  'w-full px-3 py-2 text-sm rounded border',
                  darkMode
                    ? 'bg-secondary-700 border-secondary-600 text-white'
                    : 'bg-white border-secondary-300 text-secondary-900'
                )}
              />
            </div>

            <div>
              <label className={cn(
                'block text-sm font-medium mb-1',
                darkMode ? 'text-secondary-300' : 'text-secondary-700'
              )}>
                Backend Host
              </label>
              <input
                type="text"
                value={settings.backendHost}
                onChange={(e) => handleSettingChange('backendHost', e.target.value)}
                className={cn(
                  'w-full px-3 py-2 text-sm rounded border',
                  darkMode
                    ? 'bg-secondary-700 border-secondary-600 text-white'
                    : 'bg-white border-secondary-300 text-secondary-900'
                )}
              />
            </div>

            <div>
              <label className={cn(
                'block text-sm font-medium mb-1',
                darkMode ? 'text-secondary-300' : 'text-secondary-700'
              )}>
                SIP Port
              </label>
              <input
                type="text"
                value={settings.sipPort}
                onChange={(e) => handleSettingChange('sipPort', e.target.value)}
                className={cn(
                  'w-full px-3 py-2 text-sm rounded border',
                  darkMode
                    ? 'bg-secondary-700 border-secondary-600 text-white'
                    : 'bg-white border-secondary-300 text-secondary-900'
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className={cn(
                'text-sm font-medium',
                darkMode ? 'text-secondary-300' : 'text-secondary-700'
              )}>
                Debug Mode
              </label>
              <input
                type="checkbox"
                checked={settings.enableDebugMode}
                onChange={(e) => handleSettingChange('enableDebugMode', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Data Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'p-4 sm:p-6 rounded-xl border',
          darkMode
            ? 'bg-secondary-800 border-secondary-700'
            : 'bg-white border-secondary-200'
        )}
      >
        <h3 className={cn(
          'text-base sm:text-lg font-semibold mb-4 flex items-center space-x-2',
          darkMode ? 'text-white' : 'text-secondary-900'
        )}>
          <Database className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Data Management</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <label className={cn(
              'text-xs sm:text-sm font-medium',
              darkMode ? 'text-secondary-300' : 'text-secondary-700'
            )}>
              Max Call Logs
            </label>
            <input
              type="number"
              min="100"
              max="10000"
              value={settings.maxCallLogs}
              onChange={(e) => handleSettingChange('maxCallLogs', parseInt(e.target.value))}
              className={cn(
                'w-full sm:w-24 px-2 py-1 text-sm rounded border',
                darkMode
                  ? 'bg-secondary-700 border-secondary-600 text-white'
                  : 'bg-white border-secondary-300 text-secondary-900'
              )}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <label className={cn(
              'text-xs sm:text-sm font-medium',
              darkMode ? 'text-secondary-300' : 'text-secondary-700'
            )}>
              Session Timeout (hours)
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={settings.sessionTimeout}
              onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
              className={cn(
                'w-full sm:w-20 px-2 py-1 text-sm rounded border',
                darkMode
                  ? 'bg-secondary-700 border-secondary-600 text-white'
                  : 'bg-white border-secondary-300 text-secondary-900'
              )}
            />
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 md:col-span-2 xl:col-span-1">
            <button
              onClick={async () => {
                try {
                  console.log('[AdminDashboard] Exporting call logs from Settings tab');
                  await adminService.exportCallLogs('csv');
                  toast.success('Call logs exported successfully');
                } catch (error) {
                  console.error('[AdminDashboard] Settings export failed:', error);
                  toast.error(`Failed to export call logs: ${error.message}`);
                }
              }}
              className="flex-1 btn-secondary text-xs sm:text-sm flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-1 sm:mr-2" />
              <span>Export Logs</span>
            </button>
            <button
              onClick={() => {
                setSettings({
                  autoRefresh: true,
                  refreshInterval: 30,
                  enableNotifications: true,
                  enableAudioAlerts: false,
                  maxCallLogs: 1000,
                  sessionTimeout: 24,
                  enableDebugMode: false,
                  asteriskHost: '172.20.10.6',
                  backendHost: '172.20.10.4',
                  sipPort: '8088',
                });
                toast.success('Settings reset to default');
              }}
              className="flex-1 btn-primary text-xs sm:text-sm flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
