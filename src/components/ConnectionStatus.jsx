import React, { useState, useEffect } from 'react';
import configService from '../services/configService';

const ConnectionStatus = ({ onConfigChange }) => {
  const [status, setStatus] = useState({
    backend: { healthy: false, checking: true },
    asterisk: { healthy: false, checking: true },
    config: null,
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkConnections();
    const interval = setInterval(checkConnections, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkConnections = async () => {
    try {
      // Check backend health
      const backendHealth = await configService.healthCheck();
      
      // Get current configuration
      const config = configService.getConfig();
      
      // Check Asterisk connectivity (simplified)
      const asteriskHealth = await checkAsteriskHealth(config);
      
      const newStatus = {
        backend: backendHealth,
        asterisk: asteriskHealth,
        config: config,
      };
      
      setStatus(newStatus);
      
      // Notify parent component of config changes
      if (onConfigChange) {
        onConfigChange(config);
      }
      
    } catch (error) {
      console.error('[ConnectionStatus] Health check failed:', error);
    }
  };

  const checkAsteriskHealth = async (config) => {
    // Simple check - in a real implementation, you might ping the Asterisk server
    try {
      if (config && config.asterisk && config.asterisk.host) {
        return {
          healthy: true,
          status: 'configured',
          host: config.asterisk.host,
        };
      }
      return {
        healthy: false,
        error: 'Not configured',
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  };

  const getStatusColor = (healthy, checking) => {
    if (checking) return 'text-yellow-500';
    return healthy ? 'text-green-500' : 'text-red-500';
  };

  const getStatusIcon = (healthy, checking) => {
    if (checking) return '⏳';
    return healthy ? '✅' : '❌';
  };

  const reloadConfig = async () => {
    setStatus(prev => ({
      ...prev,
      backend: { ...prev.backend, checking: true },
      asterisk: { ...prev.asterisk, checking: true },
    }));
    
    await configService.reload();
    await checkConnections();
  };

  if (!showDetails) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowDetails(true)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            status.backend.healthy && status.asterisk.healthy
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-red-100 text-red-800 hover:bg-red-200'
          }`}
        >
          {getStatusIcon(status.backend.healthy && status.asterisk.healthy, 
                        status.backend.checking || status.asterisk.checking)} 
          Connection Status
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-4 max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Connection Status</h3>
        <button
          onClick={() => setShowDetails(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-sm">
        {/* Backend Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-300">Backend:</span>
          <span className={getStatusColor(status.backend.healthy, status.backend.checking)}>
            {getStatusIcon(status.backend.healthy, status.backend.checking)} 
            {status.backend.checking ? 'Checking...' : 
             status.backend.healthy ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Asterisk Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-300">Asterisk:</span>
          <span className={getStatusColor(status.asterisk.healthy, status.asterisk.checking)}>
            {getStatusIcon(status.asterisk.healthy, status.asterisk.checking)} 
            {status.asterisk.checking ? 'Checking...' : 
             status.asterisk.healthy ? 'Configured' : 'Not Available'}
          </span>
        </div>

        {/* Configuration Source */}
        {status.config && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300">Config:</span>
            <span className="text-blue-600 dark:text-blue-400 text-xs">
              {status.config._source || 'Unknown'}
            </span>
          </div>
        )}
      </div>

      {/* Configuration Details */}
      {status.config && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div>API: {status.config.api_url}</div>
            <div>WS: {status.config.ws_url}</div>
            {status.config.asterisk && (
              <div>Asterisk: {status.config.asterisk.host}</div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex space-x-2">
        <button
          onClick={reloadConfig}
          className="flex-1 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
        >
          Reload Config
        </button>
        <button
          onClick={checkConnections}
          className="flex-1 px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
        >
          Check Now
        </button>
      </div>

      {/* Error Details */}
      {(!status.backend.healthy || !status.asterisk.healthy) && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
          {!status.backend.healthy && (
            <div>Backend: {status.backend.error}</div>
          )}
          {!status.asterisk.healthy && (
            <div>Asterisk: {status.asterisk.error}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
