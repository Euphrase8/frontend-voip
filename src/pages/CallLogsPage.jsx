import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPhone as Phone,
  FiPhoneCall as PhoneCall,
  FiPhoneIncoming as PhoneIncoming,
  FiPhoneOutgoing as PhoneOutgoing,
  FiClock as Clock,
  FiUser as User,
  FiUsers as Users,
  FiTrash2 as Trash2,
  FiDownload as Download,
  FiRefreshCw as Refresh,
  FiSearch as Search,
  FiFilter as Filter,
  FiMoreVertical as MoreVertical,
  FiCheckCircle as CheckCircle,
  FiXCircle as XCircle,
  FiAlertTriangle as AlertTriangle,
  FiInfo as Info
} from 'react-icons/fi';
import { getDetailedCallLogs, deleteCallLog, bulkDeleteCallLogs, exportCallLogs } from '../services/logs';
import { cn } from '../utils/ui';
import notificationService from '../utils/notificationService';
import toast from 'react-hot-toast';

// Enhanced Call Log Item Component
const CallLogItem = ({ log, index, darkMode, onCall, onDelete, isAdmin, isSelected, onSelect }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'answered':
      case 'ended':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success-500" />;
      case 'failed':
      case 'busy':
      case 'no answer':
        return <XCircle className="w-4 h-4 text-danger-500" />;
      case 'ringing':
      case 'initiated':
        return <AlertTriangle className="w-4 h-4 text-warning-500" />;
      default:
        return <Info className="w-4 h-4 text-primary-500" />;
    }
  };

  const getDirectionIcon = (direction) => {
    return direction === 'outbound' ?
      <PhoneOutgoing className="w-4 h-4 text-primary-500" /> :
      <PhoneIncoming className="w-4 h-4 text-success-500" />;
  };

  const formatStatus = (status) => {
    return status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "border rounded-lg transition-all duration-200 hover:shadow-md",
        darkMode ? "bg-secondary-800 border-secondary-700" : "bg-white border-secondary-200",
        isSelected && "ring-2 ring-primary-500"
      )}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {/* Selection checkbox for admin */}
            {isAdmin && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(log.id, e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
            )}

            {/* Direction Icon */}
            <div className="flex-shrink-0">
              {getDirectionIcon(log.call?.direction)}
            </div>

            {/* Call Information */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className={cn(
                  "font-medium truncate",
                  darkMode ? "text-white" : "text-secondary-900"
                )}>
                  {log.display?.participants}
                </h3>
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  log.call?.direction === 'outbound'
                    ? "bg-primary-100 text-primary-700"
                    : "bg-success-100 text-success-700"
                )}>
                  {log.call?.direction}
                </span>
              </div>
              <div className="flex items-center space-x-4 mt-1">
                <span className={cn(
                  "text-sm",
                  darkMode ? "text-secondary-400" : "text-secondary-600"
                )}>
                  {log.display?.extensions}
                </span>
                <span className={cn(
                  "text-sm",
                  darkMode ? "text-secondary-400" : "text-secondary-600"
                )}>
                  {log.display?.time}
                </span>
                <span className={cn(
                  "text-sm font-mono",
                  darkMode ? "text-secondary-400" : "text-secondary-600"
                )}>
                  {log.timing?.formattedDuration}
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2">
              {getStatusIcon(log.call?.status)}
              <span className={cn(
                "text-sm font-medium",
                darkMode ? "text-secondary-300" : "text-secondary-700"
              )}>
                {formatStatus(log.call?.status)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                darkMode ? "hover:bg-secondary-700" : "hover:bg-secondary-100"
              )}
              title="Toggle details"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {onCall && (
              <button
                onClick={() => onCall(log.callee?.extension || log.caller?.extension)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm"
                title="Call back"
              >
                <PhoneCall className="w-3 h-3" />
                <span>Call</span>
              </button>
            )}

            {isAdmin && onDelete && (
              <button
                onClick={() => onDelete(log.id)}
                className="p-2 rounded-lg text-danger-600 hover:bg-danger-50 transition-colors"
                title="Delete log"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Expandable Details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={cn(
                "mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4 text-sm",
                darkMode ? "border-secondary-700" : "border-secondary-200"
              )}>
                <div>
                  <h4 className={cn(
                    "font-medium mb-2",
                    darkMode ? "text-white" : "text-secondary-900"
                  )}>
                    Call Details
                  </h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className={cn(darkMode ? "text-secondary-400" : "text-secondary-600")}>
                        Channel:
                      </span>
                      <span className={cn(
                        "font-mono text-xs",
                        darkMode ? "text-secondary-300" : "text-secondary-700"
                      )}>
                        {log.call?.channel || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={cn(darkMode ? "text-secondary-400" : "text-secondary-600")}>
                        Priority:
                      </span>
                      <span className={cn(darkMode ? "text-secondary-300" : "text-secondary-700")}>
                        {log.call?.priority || 'Normal'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={cn(darkMode ? "text-secondary-400" : "text-secondary-600")}>
                        Start Time:
                      </span>
                      <span className={cn(darkMode ? "text-secondary-300" : "text-secondary-700")}>
                        {log.display?.timeOnly}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className={cn(
                    "font-medium mb-2",
                    darkMode ? "text-white" : "text-secondary-900"
                  )}>
                    Participants
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <PhoneOutgoing className="w-3 h-3 text-primary-500" />
                      <span className={cn(darkMode ? "text-secondary-300" : "text-secondary-700")}>
                        {log.caller?.username} ({log.caller?.extension})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <PhoneIncoming className="w-3 h-3 text-success-500" />
                      <span className={cn(darkMode ? "text-secondary-300" : "text-secondary-700")}>
                        {log.callee?.username} ({log.callee?.extension})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const CallLogsPage = ({ darkMode = false, user, onCall }) => {
  const [callLogs, setCallLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [selectedLogs, setSelectedLogs] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const scrollContainerRef = useRef(null);

  const isAdmin = user?.role === 'admin';

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const logs = await getDetailedCallLogs(200);
      setCallLogs(logs);
      setFilteredLogs(logs);

      notificationService.addNotification(
        'success',
        'Call Logs Loaded',
        `Loaded ${logs.length} call logs`
      );
    } catch (err) {
      console.error("Failed to load logs:", err);
      setCallLogs([]);
      setFilteredLogs([]);

      notificationService.addNotification(
        'error',
        'Failed to Load Call Logs',
        err.message || 'Unknown error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs based on search and filters
  useEffect(() => {
    let filtered = callLogs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.caller?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.callee?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.caller?.extension?.includes(searchTerm) ||
        log.callee?.extension?.includes(searchTerm) ||
        log.display?.participants?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.call?.status?.toLowerCase() === statusFilter);
    }

    // Direction filter
    if (directionFilter !== 'all') {
      filtered = filtered.filter(log => log.call?.direction === directionFilter);
    }

    setFilteredLogs(filtered);
  }, [callLogs, searchTerm, statusFilter, directionFilter]);

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this call log?')) {
      return;
    }

    try {
      await deleteCallLog(logId);
      await fetchLogs();

      notificationService.addNotification(
        'success',
        'Call Log Deleted',
        'Call log has been successfully deleted'
      );
    } catch (error) {
      notificationService.addNotification(
        'error',
        'Delete Failed',
        error.message || 'Failed to delete call log'
      );
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLogs.size === 0) {
      toast.error('No logs selected');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedLogs.size} call logs?`)) {
      return;
    }

    try {
      await bulkDeleteCallLogs(Array.from(selectedLogs));
      await fetchLogs();
      setSelectedLogs(new Set());

      notificationService.addNotification(
        'success',
        'Bulk Delete Completed',
        `Successfully deleted ${selectedLogs.size} call logs`
      );
    } catch (error) {
      notificationService.addNotification(
        'error',
        'Bulk Delete Failed',
        error.message || 'Failed to delete call logs'
      );
    }
  };

  const handleExport = async (format) => {
    try {
      await exportCallLogs(format);

      notificationService.addNotification(
        'success',
        'Export Completed',
        `Call logs exported as ${format.toUpperCase()}`
      );
    } catch (error) {
      notificationService.addNotification(
        'error',
        'Export Failed',
        error.message || 'Failed to export call logs'
      );
    }
  };

  const handleSelectLog = (logId, isSelected) => {
    const newSelected = new Set(selectedLogs);
    if (isSelected) {
      newSelected.add(logId);
    } else {
      newSelected.delete(logId);
    }
    setSelectedLogs(newSelected);
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedLogs(new Set(filteredLogs.map(log => log.id)));
    } else {
      setSelectedLogs(new Set());
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Phone className="w-6 h-6 text-primary-600" />
          <h1 className={cn(
            "text-2xl font-bold",
            darkMode ? "text-white" : "text-secondary-900"
          )}>
            Call Logs
          </h1>
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            darkMode ? "bg-secondary-700 text-secondary-300" : "bg-secondary-100 text-secondary-600"
          )}>
            {filteredLogs.length} logs
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Refresh className={cn("w-4 h-4", loading && "animate-spin")} />
            <span>Refresh</span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center space-x-2 px-3 py-2 bg-success-600 hover:bg-success-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>

              {selectedLogs.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center space-x-2 px-3 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete ({selectedLogs.size})</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search by username, extension, or participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2 rounded-lg border",
                darkMode
                  ? "bg-secondary-800 border-secondary-700 text-white placeholder-secondary-400"
                  : "bg-white border-secondary-300 text-secondary-900 placeholder-secondary-500"
              )}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors",
              showFilters
                ? "bg-primary-600 text-white border-primary-600"
                : darkMode
                  ? "bg-secondary-800 border-secondary-700 text-secondary-300 hover:bg-secondary-700"
                  : "bg-white border-secondary-300 text-secondary-700 hover:bg-secondary-50"
            )}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filter Options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={cn(
                "p-4 rounded-lg border",
                darkMode ? "bg-secondary-800 border-secondary-700" : "bg-secondary-50 border-secondary-200"
              )}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={cn(
                      "block text-sm font-medium mb-2",
                      darkMode ? "text-secondary-300" : "text-secondary-700"
                    )}>
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className={cn(
                        "w-full p-2 rounded-lg border",
                        darkMode
                          ? "bg-secondary-700 border-secondary-600 text-white"
                          : "bg-white border-secondary-300 text-secondary-900"
                      )}
                    >
                      <option value="all">All Status</option>
                      <option value="answered">Answered</option>
                      <option value="ended">Ended</option>
                      <option value="failed">Failed</option>
                      <option value="busy">Busy</option>
                      <option value="no answer">No Answer</option>
                    </select>
                  </div>

                  <div>
                    <label className={cn(
                      "block text-sm font-medium mb-2",
                      darkMode ? "text-secondary-300" : "text-secondary-700"
                    )}>
                      Direction
                    </label>
                    <select
                      value={directionFilter}
                      onChange={(e) => setDirectionFilter(e.target.value)}
                      className={cn(
                        "w-full p-2 rounded-lg border",
                        darkMode
                          ? "bg-secondary-700 border-secondary-600 text-white"
                          : "bg-white border-secondary-300 text-secondary-900"
                      )}
                    >
                      <option value="all">All Directions</option>
                      <option value="outbound">Outbound</option>
                      <option value="inbound">Inbound</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setDirectionFilter('all');
                      }}
                      className="w-full px-3 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bulk Actions for Admin */}
      {isAdmin && filteredLogs.length > 0 && (
        <div className="mb-4 flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedLogs.size === filteredLogs.length && filteredLogs.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className={cn(
              "text-sm",
              darkMode ? "text-secondary-300" : "text-secondary-700"
            )}>
              Select all ({filteredLogs.length})
            </span>
          </label>
        </div>
      )}

      {/* Call Logs List */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto space-y-3"
        >
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center space-x-2">
                <Refresh className="w-5 h-5 animate-spin text-primary-600" />
                <span className={cn(
                  "text-sm",
                  darkMode ? "text-secondary-400" : "text-secondary-600"
                )}>
                  Loading call logs...
                </span>
              </div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 space-y-2">
              <Phone className="w-12 h-12 text-secondary-400" />
              <p className={cn(
                "text-center",
                darkMode ? "text-secondary-400" : "text-secondary-600"
              )}>
                {callLogs.length === 0 ? "No call logs available" : "No logs match your filters"}
              </p>
              {callLogs.length > 0 && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDirectionFilter('all');
                  }}
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <CallLogItem
                key={log.id}
                log={log}
                index={index}
                darkMode={darkMode}
                onCall={onCall}
                onDelete={isAdmin ? handleDeleteLog : null}
                isAdmin={isAdmin}
                isSelected={selectedLogs.has(log.id)}
                onSelect={handleSelectLog}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CallLogsPage;