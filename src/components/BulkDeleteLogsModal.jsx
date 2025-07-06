import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Calendar, Filter, Clock } from 'lucide-react';
import { cn } from '../utils/ui';

const BulkDeleteLogsModal = ({ 
  isOpen, 
  onClose, 
  onDeleteSelected, 
  onClearAll, 
  onDeleteByFilter,
  selectedCount = 0,
  totalCount = 0,
  darkMode = false 
}) => {
  const [deleteMode, setDeleteMode] = useState('selected'); // 'selected', 'all', 'filter'
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    direction: '',
    date_from: '',
    date_to: '',
    older_than: ''
  });

  if (!isOpen) return null;

  const handleDeleteSelected = async () => {
    if (selectedCount === 0) return;
    
    setIsLoading(true);
    try {
      await onDeleteSelected();
      onClose();
    } catch (error) {
      console.error('Error deleting selected logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    setIsLoading(true);
    try {
      await onClearAll();
      onClose();
    } catch (error) {
      console.error('Error clearing all logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteByFilter = async () => {
    // Remove empty filters
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '')
    );

    if (Object.keys(cleanFilters).length === 0) {
      alert('Please specify at least one filter');
      return;
    }

    setIsLoading(true);
    try {
      await onDeleteByFilter(cleanFilters);
      onClose();
    } catch (error) {
      console.error('Error deleting logs by filter:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    switch (deleteMode) {
      case 'selected':
        handleDeleteSelected();
        break;
      case 'all':
        handleClearAll();
        break;
      case 'filter':
        handleDeleteByFilter();
        break;
    }
  };

  const getButtonText = () => {
    switch (deleteMode) {
      case 'selected':
        return `Delete ${selectedCount} Selected`;
      case 'all':
        return `Clear All ${totalCount} Logs`;
      case 'filter':
        return 'Delete Filtered Logs';
      default:
        return 'Delete';
    }
  };

  const getWarningText = () => {
    switch (deleteMode) {
      case 'selected':
        return `This will permanently delete ${selectedCount} selected call logs.`;
      case 'all':
        return `This will permanently delete ALL ${totalCount} call logs. This action cannot be undone.`;
      case 'filter':
        return 'This will permanently delete all call logs matching the specified filters.';
      default:
        return 'This action cannot be undone.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={cn(
        'w-full max-w-2xl rounded-lg shadow-xl',
        darkMode ? 'bg-secondary-800' : 'bg-white'
      )}>
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between p-6 border-b',
          darkMode ? 'border-secondary-700' : 'border-secondary-200'
        )}>
          <div className="flex items-center space-x-3">
            <Trash2 className="w-6 h-6 text-red-500" />
            <h2 className={cn(
              'text-xl font-semibold',
              darkMode ? 'text-white' : 'text-secondary-900'
            )}>
              Bulk Delete Call Logs
            </h2>
          </div>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg transition-colors',
              darkMode 
                ? 'hover:bg-secondary-700 text-secondary-400' 
                : 'hover:bg-secondary-100 text-secondary-600'
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Delete Mode Selection */}
          <div className="space-y-4">
            <h3 className={cn(
              'text-lg font-medium',
              darkMode ? 'text-white' : 'text-secondary-900'
            )}>
              Choose deletion method:
            </h3>

            <div className="space-y-3">
              {/* Selected Logs */}
              <label className={cn(
                'flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors',
                deleteMode === 'selected'
                  ? darkMode 
                    ? 'border-primary-500 bg-primary-900/20' 
                    : 'border-primary-500 bg-primary-50'
                  : darkMode 
                    ? 'border-secondary-600 hover:bg-secondary-700' 
                    : 'border-secondary-200 hover:bg-secondary-50',
                selectedCount === 0 && 'opacity-50 cursor-not-allowed'
              )}>
                <input
                  type="radio"
                  name="deleteMode"
                  value="selected"
                  checked={deleteMode === 'selected'}
                  onChange={(e) => setDeleteMode(e.target.value)}
                  disabled={selectedCount === 0}
                  className="text-primary-600"
                />
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className={cn(
                      'font-medium',
                      darkMode ? 'text-white' : 'text-secondary-900'
                    )}>
                      Delete Selected Logs ({selectedCount})
                    </div>
                    <div className={cn(
                      'text-sm',
                      darkMode ? 'text-secondary-400' : 'text-secondary-600'
                    )}>
                      Delete only the logs you have selected
                    </div>
                  </div>
                </div>
              </label>

              {/* All Logs */}
              <label className={cn(
                'flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors',
                deleteMode === 'all'
                  ? darkMode 
                    ? 'border-red-500 bg-red-900/20' 
                    : 'border-red-500 bg-red-50'
                  : darkMode 
                    ? 'border-secondary-600 hover:bg-secondary-700' 
                    : 'border-secondary-200 hover:bg-secondary-50'
              )}>
                <input
                  type="radio"
                  name="deleteMode"
                  value="all"
                  checked={deleteMode === 'all'}
                  onChange={(e) => setDeleteMode(e.target.value)}
                  className="text-red-600"
                />
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div>
                    <div className={cn(
                      'font-medium',
                      darkMode ? 'text-white' : 'text-secondary-900'
                    )}>
                      Clear All Logs ({totalCount})
                    </div>
                    <div className={cn(
                      'text-sm',
                      darkMode ? 'text-secondary-400' : 'text-secondary-600'
                    )}>
                      Delete all call logs permanently
                    </div>
                  </div>
                </div>
              </label>

              {/* Filter-based */}
              <label className={cn(
                'flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors',
                deleteMode === 'filter'
                  ? darkMode 
                    ? 'border-orange-500 bg-orange-900/20' 
                    : 'border-orange-500 bg-orange-50'
                  : darkMode 
                    ? 'border-secondary-600 hover:bg-secondary-700' 
                    : 'border-secondary-200 hover:bg-secondary-50'
              )}>
                <input
                  type="radio"
                  name="deleteMode"
                  value="filter"
                  checked={deleteMode === 'filter'}
                  onChange={(e) => setDeleteMode(e.target.value)}
                  className="text-orange-600"
                />
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  <div>
                    <div className={cn(
                      'font-medium',
                      darkMode ? 'text-white' : 'text-secondary-900'
                    )}>
                      Delete by Filters
                    </div>
                    <div className={cn(
                      'text-sm',
                      darkMode ? 'text-secondary-400' : 'text-secondary-600'
                    )}>
                      Delete logs matching specific criteria
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Filter Options */}
          {deleteMode === 'filter' && (
            <div className={cn(
              'p-4 rounded-lg border',
              darkMode ? 'border-secondary-600 bg-secondary-700/50' : 'border-secondary-200 bg-secondary-50'
            )}>
              <h4 className={cn(
                'text-md font-medium mb-4',
                darkMode ? 'text-white' : 'text-secondary-900'
              )}>
                Filter Options
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status Filter */}
                <div>
                  <label className={cn(
                    'block text-sm font-medium mb-2',
                    darkMode ? 'text-secondary-300' : 'text-secondary-700'
                  )}>
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border',
                      darkMode 
                        ? 'bg-secondary-800 border-secondary-600 text-white' 
                        : 'bg-white border-secondary-300 text-secondary-900'
                    )}
                  >
                    <option value="">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="missed">Missed</option>
                    <option value="busy">Busy</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Direction Filter */}
                <div>
                  <label className={cn(
                    'block text-sm font-medium mb-2',
                    darkMode ? 'text-secondary-300' : 'text-secondary-700'
                  )}>
                    Direction
                  </label>
                  <select
                    value={filters.direction}
                    onChange={(e) => setFilters(prev => ({ ...prev, direction: e.target.value }))}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border',
                      darkMode 
                        ? 'bg-secondary-800 border-secondary-600 text-white' 
                        : 'bg-white border-secondary-300 text-secondary-900'
                    )}
                  >
                    <option value="">All Directions</option>
                    <option value="incoming">Incoming</option>
                    <option value="outgoing">Outgoing</option>
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className={cn(
                    'block text-sm font-medium mb-2',
                    darkMode ? 'text-secondary-300' : 'text-secondary-700'
                  )}>
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border',
                      darkMode 
                        ? 'bg-secondary-800 border-secondary-600 text-white' 
                        : 'bg-white border-secondary-300 text-secondary-900'
                    )}
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className={cn(
                    'block text-sm font-medium mb-2',
                    darkMode ? 'text-secondary-300' : 'text-secondary-700'
                  )}>
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border',
                      darkMode 
                        ? 'bg-secondary-800 border-secondary-600 text-white' 
                        : 'bg-white border-secondary-300 text-secondary-900'
                    )}
                  />
                </div>

                {/* Older Than */}
                <div className="md:col-span-2">
                  <label className={cn(
                    'block text-sm font-medium mb-2',
                    darkMode ? 'text-secondary-300' : 'text-secondary-700'
                  )}>
                    Delete logs older than (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g., 30"
                    value={filters.older_than}
                    onChange={(e) => setFilters(prev => ({ ...prev, older_than: e.target.value }))}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border',
                      darkMode 
                        ? 'bg-secondary-800 border-secondary-600 text-white' 
                        : 'bg-white border-secondary-300 text-secondary-900'
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className={cn(
            'flex items-start space-x-3 p-4 rounded-lg',
            deleteMode === 'all' 
              ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
              : 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
          )}>
            <AlertTriangle className={cn(
              'w-5 h-5 mt-0.5',
              deleteMode === 'all' ? 'text-red-500' : 'text-yellow-500'
            )} />
            <div>
              <div className={cn(
                'font-medium',
                deleteMode === 'all' 
                  ? 'text-red-800 dark:text-red-300' 
                  : 'text-yellow-800 dark:text-yellow-300'
              )}>
                Warning
              </div>
              <div className={cn(
                'text-sm mt-1',
                deleteMode === 'all' 
                  ? 'text-red-700 dark:text-red-400' 
                  : 'text-yellow-700 dark:text-yellow-400'
              )}>
                {getWarningText()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={cn(
          'flex items-center justify-end space-x-3 p-6 border-t',
          darkMode ? 'border-secondary-700' : 'border-secondary-200'
        )}>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              darkMode 
                ? 'bg-secondary-700 text-secondary-300 hover:bg-secondary-600' 
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || (deleteMode === 'selected' && selectedCount === 0)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2',
              deleteMode === 'all'
                ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400'
                : 'bg-orange-600 text-white hover:bg-orange-700 disabled:bg-orange-400'
            )}
          >
            {isLoading && <Clock className="w-4 h-4 animate-spin" />}
            <span>{getButtonText()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkDeleteLogsModal;
