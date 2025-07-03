import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Settings,
  Server,
  Wifi,
  CheckCircle,
  XCircle,
  Loader2,
  Network,
  ArrowRight,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

const IPConfigurationPage = ({ darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    backend: { status: 'untested', message: '' },
    asterisk: { status: 'untested', message: '' }
  });

  const [config, setConfig] = useState({
    backendHost: '172.20.10.4',
    backendPort: '8080',
    asteriskHost: '172.20.10.2',
    asteriskPort: '8088',
    asteriskAMIPort: '5038'
  });

  useEffect(() => {
    // Check if configuration already exists
    const existingConfig = localStorage.getItem('voipIPConfig');
    if (existingConfig) {
      try {
        const parsed = JSON.parse(existingConfig);
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse existing config:', error);
      }
    }
  }, []);

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset connection status when config changes
    setConnectionStatus({
      backend: { status: 'untested', message: '' },
      asterisk: { status: 'untested', message: '' }
    });
  };

  const testBackendConnection = async () => {
    const backendUrl = `http://${config.backendHost}:${config.backendPort}`;
    
    try {
      const response = await fetch(`${backendUrl}/config`, {
        method: 'GET',
        timeout: 5000,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return { status: 'success', message: 'Backend connection successful' };
        }
      }
      return { status: 'error', message: 'Backend responded but config endpoint failed' };
    } catch (error) {
      return { 
        status: 'error', 
        message: `Backend connection failed: ${error.message}` 
      };
    }
  };

  const testAsteriskConnection = async () => {
    try {
      // Test multiple Asterisk endpoints to ensure connectivity
      const testResults = [];

      // 1. Test HTTP interface (if enabled)
      try {
        const httpUrl = `http://${config.asteriskHost}:${config.asteriskPort}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const httpResponse = await fetch(httpUrl, {
          method: 'GET',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        testResults.push({ method: 'HTTP', success: true, status: httpResponse.status });
      } catch (httpError) {
        testResults.push({ method: 'HTTP', success: false, error: httpError.message });
      }

      // 2. Test WebSocket connectivity (basic connection test)
      try {
        const wsUrl = `ws://${config.asteriskHost}:${config.asteriskPort}/ws`;
        const wsTestPromise = new Promise((resolve, reject) => {
          const ws = new WebSocket(wsUrl);
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('WebSocket connection timeout'));
          }, 3000);

          ws.onopen = () => {
            clearTimeout(timeout);
            ws.close();
            resolve({ method: 'WebSocket', success: true });
          };

          ws.onerror = (error) => {
            clearTimeout(timeout);
            reject(new Error('WebSocket connection failed'));
          };
        });

        const wsResult = await wsTestPromise;
        testResults.push(wsResult);
      } catch (wsError) {
        testResults.push({ method: 'WebSocket', success: false, error: wsError.message });
      }

      // 3. Test basic TCP connectivity to AMI port
      try {
        // We can't directly test TCP from browser, but we can try a fetch to the AMI port
        // This will likely fail but gives us info about host reachability
        const amiUrl = `http://${config.asteriskHost}:${config.asteriskAMIPort}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        await fetch(amiUrl, {
          method: 'GET',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        testResults.push({ method: 'AMI', success: true });
      } catch (amiError) {
        // AMI port might not respond to HTTP, but if we get a specific error, host is reachable
        if (amiError.message.includes('Failed to fetch')) {
          testResults.push({ method: 'AMI', success: false, error: 'Port not accessible via HTTP (expected for AMI)' });
        } else {
          testResults.push({ method: 'AMI', success: false, error: amiError.message });
        }
      }

      // Evaluate results
      const successfulTests = testResults.filter(test => test.success);
      const hasHttpSuccess = testResults.some(test => test.method === 'HTTP' && test.success);
      const hasWsSuccess = testResults.some(test => test.method === 'WebSocket' && test.success);

      if (hasHttpSuccess || hasWsSuccess) {
        return {
          status: 'success',
          message: `Asterisk server is reachable (${successfulTests.map(t => t.method).join(', ')})`,
          details: testResults
        };
      } else {
        // Check if any test suggests the host is reachable but services are not configured
        const hostReachable = testResults.some(test =>
          test.error && !test.error.includes('Failed to fetch') && !test.error.includes('timeout')
        );

        if (hostReachable) {
          return {
            status: 'warning',
            message: 'Host reachable but Asterisk services may not be properly configured',
            details: testResults
          };
        } else {
          return {
            status: 'error',
            message: `Cannot reach Asterisk server at ${config.asteriskHost}`,
            details: testResults
          };
        }
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Asterisk connection test failed: ${error.message}`
      };
    }
  };

  const testConnections = async () => {
    setTestingConnection(true);
    
    try {
      // Test backend connection
      setConnectionStatus(prev => ({
        ...prev,
        backend: { status: 'testing', message: 'Testing backend connection...' }
      }));
      
      const backendResult = await testBackendConnection();
      setConnectionStatus(prev => ({
        ...prev,
        backend: backendResult
      }));

      // Test Asterisk connection
      setConnectionStatus(prev => ({
        ...prev,
        asterisk: { status: 'testing', message: 'Testing Asterisk connection...' }
      }));
      
      const asteriskResult = await testAsteriskConnection();
      setConnectionStatus(prev => ({
        ...prev,
        asterisk: asteriskResult
      }));

      // Show overall result
      if (backendResult.status === 'success' && asteriskResult.status === 'success') {
        toast.success('All connections successful!');
      } else {
        toast.error('Some connections failed. Please check the configuration.');
      }

    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error('Connection test failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const saveConfiguration = async () => {
    setIsLoading(true);
    
    try {
      // Validate configuration
      if (!config.backendHost || !config.backendPort || !config.asteriskHost || !config.asteriskPort) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Save to localStorage
      localStorage.setItem('voipIPConfig', JSON.stringify(config));
      localStorage.setItem('voipConfigured', 'true');
      
      toast.success('Configuration saved successfully!');
      
      // Navigate to login page
      setTimeout(() => {
        navigate('/login');
      }, 1000);

    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'testing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'testing':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className={`w-full max-w-2xl ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } rounded-2xl shadow-2xl p-8`}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full ${
              darkMode ? 'bg-blue-900/50' : 'bg-blue-100'
            }`}>
              <Settings className={`w-8 h-8 ${
                darkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            VoIP Configuration
          </h1>
          <p className={`text-lg ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Configure your backend and Asterisk server connections
          </p>
        </div>

        {/* Configuration Form */}
        <div className="space-y-6">
          
          {/* Backend Configuration */}
          <div className={`p-6 rounded-xl border ${
            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center mb-4">
              <Server className={`w-5 h-5 mr-2 ${
                darkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <h3 className={`text-lg font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Backend Server
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Backend Host/IP
                </label>
                <input
                  type="text"
                  value={config.backendHost}
                  onChange={(e) => handleInputChange('backendHost', e.target.value)}
                  placeholder="172.20.10.4"
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Backend Port
                </label>
                <input
                  type="text"
                  value={config.backendPort}
                  onChange={(e) => handleInputChange('backendPort', e.target.value)}
                  placeholder="8080"
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>

            {/* Backend Status */}
            <div className="mt-4 flex items-center space-x-2">
              {getStatusIcon(connectionStatus.backend.status)}
              <span className={`text-sm ${getStatusColor(connectionStatus.backend.status)}`}>
                {connectionStatus.backend.message || 'Not tested'}
              </span>
            </div>
          </div>

          {/* Asterisk Configuration */}
          <div className={`p-6 rounded-xl border ${
            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center mb-4">
              <Network className={`w-5 h-5 mr-2 ${
                darkMode ? 'text-green-400' : 'text-green-600'
              }`} />
              <h3 className={`text-lg font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Asterisk Server
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Asterisk Host/IP
                </label>
                <input
                  type="text"
                  value={config.asteriskHost}
                  onChange={(e) => handleInputChange('asteriskHost', e.target.value)}
                  placeholder="172.20.10.2"
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode
                      ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  SIP Port
                </label>
                <input
                  type="text"
                  value={config.asteriskPort}
                  onChange={(e) => handleInputChange('asteriskPort', e.target.value)}
                  placeholder="8088"
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode
                      ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  AMI Port
                </label>
                <input
                  type="text"
                  value={config.asteriskAMIPort}
                  onChange={(e) => handleInputChange('asteriskAMIPort', e.target.value)}
                  placeholder="5038"
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode
                      ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>

            {/* Asterisk Status */}
            <div className="mt-4 flex items-center space-x-2">
              {getStatusIcon(connectionStatus.asterisk.status)}
              <span className={`text-sm ${getStatusColor(connectionStatus.asterisk.status)}`}>
                {connectionStatus.asterisk.message || 'Not tested'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={testConnections}
              disabled={testingConnection}
              className={`flex-1 flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors ${
                testingConnection
                  ? 'bg-gray-400 cursor-not-allowed'
                  : darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {testingConnection ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Wifi className="w-5 h-5 mr-2" />
              )}
              Test Connections
            </button>

            <button
              onClick={saveConfiguration}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : connectionStatus.backend.status === 'error'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : darkMode
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5 mr-2" />
              )}
              {connectionStatus.backend.status === 'error' ? 'Save Anyway' : 'Save & Continue'}
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex justify-center pt-4">
            <button
              onClick={toggleDarkMode}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPConfigurationPage;
