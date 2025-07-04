import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMic, 
  FiMicOff, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiRefreshCw,
  FiSettings,
  FiHelpCircle,
  FiX
} from 'react-icons/fi';
import { MicrophoneDiagnostics, quickMicrophoneCheck, testMicrophoneAccess } from '../utils/microphoneDiagnostics';
import { cn } from '../utils/ui';

const MicrophoneFix = ({ isOpen, onClose, onFixed }) => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [selectedFix, setSelectedFix] = useState(null);

  useEffect(() => {
    if (isOpen && !diagnostics) {
      runDiagnostics();
    }
  }, [isOpen]);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      const result = await quickMicrophoneCheck();
      setDiagnostics(result);
      console.log('🔍 Microphone diagnostics:', result);
    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const testMicrophone = async () => {
    setIsRunning(true);
    try {
      const result = await testMicrophoneAccess();
      setTestResult(result);
      
      if (result.success && onFixed) {
        setTimeout(() => onFixed(), 1000);
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Test failed: ' + error.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (passed) => {
    if (passed === true) return <FiCheckCircle className="w-5 h-5 text-green-500" />;
    if (passed === false) return <FiAlertTriangle className="w-5 h-5 text-red-500" />;
    return <FiHelpCircle className="w-5 h-5 text-gray-400" />;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FiMic className="w-6 h-6" />
                <h2 className="text-xl font-semibold">Microphone Troubleshooting</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-2 text-blue-100">
              Diagnose and fix microphone issues for your VoIP calls
            </p>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Quick Test Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Quick Microphone Test</h3>
                <button
                  onClick={testMicrophone}
                  disabled={isRunning}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors",
                    isRunning
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  {isRunning ? (
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiMic className="w-4 h-4" />
                  )}
                  <span>{isRunning ? 'Testing...' : 'Test Microphone'}</span>
                </button>
              </div>

              {testResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 rounded-lg border",
                    testResult.success
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  )}
                >
                  <div className="flex items-center space-x-2">
                    {testResult.success ? (
                      <FiCheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <FiMicOff className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium">{testResult.message}</span>
                  </div>
                  {testResult.tracks && (
                    <p className="mt-1 text-sm">Found {testResult.tracks} audio track(s)</p>
                  )}
                </motion.div>
              )}
            </div>

            {/* Diagnostics Section */}
            {diagnostics && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Diagnostic Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{diagnostics.summary.passed}</div>
                      <div className="text-sm text-gray-600">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{diagnostics.summary.failed}</div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{diagnostics.summary.unknown}</div>
                      <div className="text-sm text-gray-600">Unknown</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{diagnostics.summary.totalTests}</div>
                      <div className="text-sm text-gray-600">Total Tests</div>
                    </div>
                  </div>
                </div>

                {/* Test Results */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Test Results</h3>
                  <div className="space-y-3">
                    {Object.entries(diagnostics.results).map(([testName, result]) => (
                      <div key={testName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(result?.passed)}
                          <span className="font-medium capitalize">
                            {testName.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                        {result?.issues && result.issues.length > 0 && (
                          <div className="text-sm text-red-600">
                            {result.issues.length} issue(s)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fixes */}
                {diagnostics.fixes && diagnostics.fixes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Recommended Fixes</h3>
                    <div className="space-y-4">
                      {diagnostics.fixes.map((fix, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={cn(
                            "border rounded-lg p-4 cursor-pointer transition-all",
                            selectedFix === index
                              ? "border-blue-300 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                          onClick={() => setSelectedFix(selectedFix === index ? null : index)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={cn(
                                  "px-2 py-1 text-xs font-medium rounded-full",
                                  getPriorityColor(fix.priority)
                                )}>
                                  {fix.priority} priority
                                </span>
                                <span className="text-sm text-gray-500">{fix.category}</span>
                              </div>
                              <h4 className="font-semibold text-gray-800">{fix.title}</h4>
                              <p className="text-gray-600 text-sm mt-1">{fix.description}</p>
                            </div>
                            <FiSettings className="w-5 h-5 text-gray-400 ml-4" />
                          </div>

                          <AnimatePresence>
                            {selectedFix === index && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 pt-4 border-t border-gray-200"
                              >
                                <h5 className="font-medium text-gray-800 mb-2">Steps to fix:</h5>
                                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                                  {fix.actions.map((action, actionIndex) => (
                                    <li key={actionIndex}>{action}</li>
                                  ))}
                                </ol>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {diagnostics.recommendations && diagnostics.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">General Recommendations</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <ul className="space-y-2">
                        {diagnostics.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm text-blue-800">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loading State */}
            {isRunning && !diagnostics && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FiRefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Running diagnostics...</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <button
              onClick={runDiagnostics}
              disabled={isRunning}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors",
                isRunning
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-600 text-white hover:bg-gray-700"
              )}
            >
              <FiRefreshCw className={cn("w-4 h-4", isRunning && "animate-spin")} />
              <span>Re-run Diagnostics</span>
            </button>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              {testResult?.success && (
                <button
                  onClick={onFixed}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MicrophoneFix;
