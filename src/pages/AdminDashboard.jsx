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

  const deleteCallLog = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this call log?')) {
      return;
    }

    try {
      const result = await adminService.deleteCallLog(logId);

      if (result.success) {
        toast.success('Call log deleted successfully');
        loadCallLogs(); // Refresh call logs without full page reload
      } else {
        toast.error(result.error || 'Failed to delete call log');
      }
    } catch (error) {
      console.error('Failed to delete call log:', error);
      toast.error('Failed to delete call log');
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
      'min-h-screen',
      darkMode ? 'bg-secondary-900' : 'bg-secondary-50'
    )}>
      {/* Header */}
      <div className={cn(
        'border-b px-6 py-4',
        darkMode 
          ? 'bg-secondary-800 border-secondary-700' 
          : 'bg-white border-secondary-200'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className={cn(
                'text-2xl font-bold',
                darkMode ? 'text-white' : 'text-secondary-900'
              )}>
                Admin Dashboard
              </h1>
              <p className={cn(
                'text-sm',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                Welcome back, {user?.username}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAdminCall(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Phone className="w-4 h-4" />
              <span>Admin Call</span>
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
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={onLogout}
              className="btn-danger"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={cn(
        'border-b px-6',
        darkMode 
          ? 'bg-secondary-800 border-secondary-700' 
          : 'bg-white border-secondary-200'
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
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab stats={stats} darkMode={darkMode} />
        )}
        {activeTab === 'users' && (
          <UsersTab users={users} onDeleteUser={showDeleteConfirmation} darkMode={darkMode} />
        )}
        {activeTab === 'calls' && (
          <CallLogsTab callLogs={callLogs} onDeleteCallLog={deleteCallLog} darkMode={darkMode} />
        )}
        {activeTab === 'system' && (
          <SystemTab systemStatus={systemStatus} darkMode={darkMode} />
        )}
        {activeTab === 'notifications' && (
          <NotificationsPage darkMode={darkMode} user={user} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab darkMode={darkMode} />
        )}
      </div>

      {/* Admin Call Panel */}
      <AdminCallPanel
        isOpen={showAdminCall}
        onClose={() => setShowAdminCall(false)}
        darkMode={darkMode}
        currentUser={user}
      />

      {/* Delete Confirmation Modal */}
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
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ stats, darkMode }) => {
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={cn(
                'text-sm',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                WebSocket Connections
              </span>
              <span className={cn(
                'font-medium',
                darkMode ? 'text-white' : 'text-secondary-900'
              )}>
                {stats.ws_connections}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn(
                'text-sm',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                Database Status
              </span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success-500" />
                <span className="text-sm text-success-600">Connected</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
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
            <button className="w-full btn-primary flex items-center justify-center space-x-2">
              <UserPlus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
            <button className="w-full btn-secondary flex items-center justify-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Call Logs</span>
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
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-primary"
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
                  'text-left py-3 px-4 font-medium text-sm',
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
                  'text-left py-3 px-4 font-medium text-sm',
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
                        'font-medium',
                        darkMode ? 'text-white' : 'text-secondary-900'
                      )}>
                        {user.username}
                      </p>
                      <p className={cn(
                        'text-sm',
                        darkMode ? 'text-secondary-400' : 'text-secondary-600'
                      )}>
                        {user.email}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
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
                        'text-sm capitalize',
                        getStatusColor(user.status, 'text')
                      )}>
                        {user.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
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
      </motion.div>
    </div>
  );
};

// Call Logs Tab Component
const CallLogsTab = ({ callLogs, onDeleteCallLog, darkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredLogs = callLogs.filter(log => {
    const matchesSearch = log.caller?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.callee?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.caller?.extension?.includes(searchTerm) ||
                         log.callee?.extension?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search call logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-primary"
          />
        </div>
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
        <button className="btn-primary flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Call Logs Table */}
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
                        'font-medium',
                        darkMode ? 'text-white' : 'text-secondary-900'
                      )}>
                        {log.caller?.username} → {log.callee?.username}
                      </p>
                      <p className={cn(
                        'text-sm',
                        darkMode ? 'text-secondary-400' : 'text-secondary-600'
                      )}>
                        {log.caller?.extension} → {log.callee?.extension}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      'font-mono text-sm',
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
                      'text-sm',
                      darkMode ? 'text-secondary-300' : 'text-secondary-700'
                    )}>
                      {formatDate(log.created_at)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onDeleteCallLog(log.id)}
                      className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

// System Status Tab Component
const SystemTab = ({ systemStatus, darkMode }) => {
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            'p-6 rounded-xl border',
            darkMode
              ? 'bg-secondary-800 border-secondary-700'
              : 'bg-white border-secondary-200'
          )}
        >
          <h3 className={cn(
            'text-lg font-semibold mb-4 flex items-center space-x-2',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            <Wifi className="w-5 h-5" />
            <span>Connection Status</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={cn(
                'text-sm',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                Total Clients
              </span>
              <span className={cn(
                'font-medium',
                darkMode ? 'text-white' : 'text-secondary-900'
              )}>
                {systemStatus.total_clients}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn(
                'text-sm',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                Connected Extensions
              </span>
              <span className={cn(
                'font-medium',
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
            'p-6 rounded-xl border',
            darkMode
              ? 'bg-secondary-800 border-secondary-700'
              : 'bg-white border-secondary-200'
          )}
        >
          <h3 className={cn(
            'text-lg font-semibold mb-4 flex items-center space-x-2',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            <Database className="w-5 h-5" />
            <span>System Health</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={cn(
                'text-sm',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                Database
              </span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success-500" />
                <span className="text-sm text-success-600">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn(
                'text-sm',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                WebSocket Server
              </span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success-500" />
                <span className="text-sm text-success-600">Running</span>
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
        <div className="p-6 border-b border-secondary-200 dark:border-secondary-700">
          <h3 className={cn(
            'text-lg font-semibold',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            Extension Status Details
          </h3>
        </div>
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
                  'text-left py-3 px-4 font-medium text-sm',
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
                  'text-left py-3 px-4 font-medium text-sm',
                  darkMode ? 'text-secondary-400' : 'text-secondary-600'
                )}>
                  WebSocket
                </th>
                <th className={cn(
                  'text-left py-3 px-4 font-medium text-sm',
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
                    <span className={cn(
                      'font-mono text-sm',
                      darkMode ? 'text-secondary-300' : 'text-secondary-700'
                    )}>
                      {status.extension}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      'text-sm',
                      darkMode ? 'text-white' : 'text-secondary-900'
                    )}>
                      {status.username}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        getStatusColor(status.status, 'bg')
                      )} />
                      <span className={cn(
                        'text-sm capitalize',
                        getStatusColor(status.status, 'text')
                      )}>
                        {status.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
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
                  <td className="py-3 px-4">
                    <span className={cn(
                      'text-sm',
                      darkMode ? 'text-secondary-300' : 'text-secondary-700'
                    )}>
                      {status.client_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            'p-6 rounded-xl border',
            darkMode
              ? 'bg-secondary-800 border-secondary-700'
              : 'bg-white border-secondary-200'
          )}
        >
          <h3 className={cn(
            'text-lg font-semibold mb-4 flex items-center space-x-2',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            <Settings className="w-5 h-5" />
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
            'p-6 rounded-xl border',
            darkMode
              ? 'bg-secondary-800 border-secondary-700'
              : 'bg-white border-secondary-200'
          )}
        >
          <h3 className={cn(
            'text-lg font-semibold mb-4 flex items-center space-x-2',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            <Database className="w-5 h-5" />
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
          'p-6 rounded-xl border',
          darkMode
            ? 'bg-secondary-800 border-secondary-700'
            : 'bg-white border-secondary-200'
        )}
      >
        <h3 className={cn(
          'text-lg font-semibold mb-4 flex items-center space-x-2',
          darkMode ? 'text-white' : 'text-secondary-900'
        )}>
          <Database className="w-5 h-5" />
          <span>Data Management</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between">
            <label className={cn(
              'text-sm font-medium',
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
                'w-24 px-2 py-1 text-sm rounded border',
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
              Session Timeout (hours)
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={settings.sessionTimeout}
              onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
              className={cn(
                'w-20 px-2 py-1 text-sm rounded border',
                darkMode
                  ? 'bg-secondary-700 border-secondary-600 text-white'
                  : 'bg-white border-secondary-300 text-secondary-900'
              )}
            />
          </div>

          <div className="flex space-x-2">
            <button className="flex-1 btn-secondary text-sm">
              <Download className="w-4 h-4 mr-2" />
              Export Settings
            </button>
            <button className="flex-1 btn-primary text-sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Default
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
