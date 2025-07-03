import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX as X,
  FiPhone as Phone,
  FiPhoneCall as PhoneCall,
  FiUsers as Users,
  FiSearch as Search,
  FiUser as User,
  FiActivity as Activity,
  FiWifi as Wifi,
  FiRefreshCw as Refresh
} from 'react-icons/fi';
import { cn } from '../utils/ui';
import { call } from '../services/call';
import adminService from '../services/adminService';
import notificationService from '../utils/notificationService';
import toast from 'react-hot-toast';

const AdminCallPanel = ({ isOpen, onClose, darkMode, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [calling, setCalling] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadSystemStatus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Filter users based on search term
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.extension?.includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [users, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers();
      if (response.success) {
        // Filter out current admin user
        const otherUsers = response.users.filter(user => user.id !== currentUser?.id);
        setUsers(otherUsers);
        setFilteredUsers(otherUsers);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const response = await adminService.getSystemStats();
      setSystemStatus(response);
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  const handleCall = async (targetUser) => {
    if (!targetUser.extension) {
      toast.error('User has no extension assigned');
      return;
    }

    try {
      setCalling(targetUser.id);
      
      notificationService.addNotification(
        'info',
        'Admin Call Initiated',
        `Calling ${targetUser.username} (${targetUser.extension})...`
      );

      const result = await call(targetUser.extension);
      
      notificationService.callConnected(targetUser.extension);
      toast.success(`Call initiated to ${targetUser.username}`);
      
      // Close panel after successful call
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('Call failed:', error);
      notificationService.callFailed(targetUser.extension, error.message);
      toast.error(`Failed to call ${targetUser.username}: ${error.message}`);
    } finally {
      setCalling(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'online':
        return 'text-success-500 bg-success-100';
      case 'busy':
        return 'text-warning-500 bg-warning-100';
      case 'offline':
        return 'text-secondary-500 bg-secondary-100';
      default:
        return 'text-secondary-500 bg-secondary-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'online':
        return <Activity className="w-3 h-3" />;
      case 'busy':
        return <Phone className="w-3 h-3" />;
      case 'offline':
        return <Wifi className="w-3 h-3 opacity-50" />;
      default:
        return <User className="w-3 h-3" />;
    }
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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
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
              <PhoneCall className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-bold">Admin Call Panel</h2>
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

          {/* System Status */}
          {systemStatus && (
            <div className={cn(
              "p-4 border-b",
              darkMode ? "border-secondary-700 bg-secondary-800" : "border-secondary-200 bg-secondary-50"
            )}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className={cn(
                    "font-semibold text-lg",
                    darkMode ? "text-white" : "text-secondary-900"
                  )}>
                    {systemStatus.metrics?.online_users || 0}
                  </div>
                  <div className={cn(
                    "text-xs",
                    darkMode ? "text-secondary-400" : "text-secondary-600"
                  )}>
                    Online Users
                  </div>
                </div>
                <div className="text-center">
                  <div className={cn(
                    "font-semibold text-lg",
                    darkMode ? "text-white" : "text-secondary-900"
                  )}>
                    {systemStatus.metrics?.active_calls || 0}
                  </div>
                  <div className={cn(
                    "text-xs",
                    darkMode ? "text-secondary-400" : "text-secondary-600"
                  )}>
                    Active Calls
                  </div>
                </div>
                <div className="text-center">
                  <div className={cn(
                    "font-semibold text-lg",
                    darkMode ? "text-white" : "text-secondary-900"
                  )}>
                    {systemStatus.metrics?.connected_extensions || 0}
                  </div>
                  <div className={cn(
                    "text-xs",
                    darkMode ? "text-secondary-400" : "text-secondary-600"
                  )}>
                    Connected
                  </div>
                </div>
                <div className="text-center">
                  <div className={cn(
                    "font-semibold text-lg",
                    darkMode ? "text-white" : "text-secondary-900"
                  )}>
                    {systemStatus.metrics?.calls_today || 0}
                  </div>
                  <div className={cn(
                    "text-xs",
                    darkMode ? "text-secondary-400" : "text-secondary-600"
                  )}>
                    Calls Today
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="p-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search users by name, extension, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-3 rounded-lg border",
                  darkMode
                    ? "bg-secondary-800 border-secondary-700 text-white placeholder-secondary-400"
                    : "bg-white border-secondary-300 text-secondary-900 placeholder-secondary-500"
                )}
              />
            </div>
          </div>

          {/* Users List */}
          <div className="px-6 pb-6">
            <div className="max-h-96 overflow-y-auto space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Refresh className="w-5 h-5 animate-spin text-primary-600 mr-2" />
                  <span className={cn(
                    "text-sm",
                    darkMode ? "text-secondary-400" : "text-secondary-600"
                  )}>
                    Loading users...
                  </span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-4 text-secondary-400" />
                  <p className={cn(
                    "text-sm",
                    darkMode ? "text-secondary-400" : "text-secondary-600"
                  )}>
                    {users.length === 0 ? "No users available" : "No users match your search"}
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md",
                      darkMode ? "bg-secondary-800 border-secondary-700" : "bg-white border-secondary-200"
                    )}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          darkMode ? "bg-secondary-700" : "bg-secondary-100"
                        )}>
                          <User className="w-5 h-5 text-secondary-500" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className={cn(
                            "font-medium truncate",
                            darkMode ? "text-white" : "text-secondary-900"
                          )}>
                            {user.username}
                          </h3>
                          <span className={cn(
                            "inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
                            getStatusColor(user.status)
                          )}>
                            {getStatusIcon(user.status)}
                            <span>{user.status || 'offline'}</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={cn(
                            "text-sm",
                            darkMode ? "text-secondary-400" : "text-secondary-600"
                          )}>
                            Ext: {user.extension || 'N/A'}
                          </span>
                          {user.email && (
                            <span className={cn(
                              "text-sm truncate",
                              darkMode ? "text-secondary-400" : "text-secondary-600"
                            )}>
                              {user.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCall(user)}
                      disabled={!user.extension || calling === user.id}
                      className={cn(
                        "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        calling === user.id
                          ? "bg-warning-600 text-white"
                          : "bg-primary-600 hover:bg-primary-700 text-white"
                      )}
                    >
                      {calling === user.id ? (
                        <>
                          <Refresh className="w-4 h-4 animate-spin" />
                          <span>Calling...</span>
                        </>
                      ) : (
                        <>
                          <PhoneCall className="w-4 h-4" />
                          <span>Call</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminCallPanel;
