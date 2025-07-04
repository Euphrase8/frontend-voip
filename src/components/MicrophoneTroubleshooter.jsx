import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMic, 
  FiMicOff, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiRefreshCw,
  FiSettings,
  FiInfo,
  FiX,
  FiPlay,
  FiVolume2
} from 'react-icons/fi';
import { 
  testMicrophoneAccess, 
  quickMicrophonePermissionCheck,
  MicrophoneDiagnostics 
} from '../utils/microphoneDiagnostics';
import { cn } from '../utils/ui';

const MicrophoneTroubleshooter = ({ isOpen, onClose, onFixed }) => {
  const [step, setStep] = useState('initial');
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [permissionState, setPermissionState] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [selectedFix, setSelectedFix] = useState(null);

  useEffect(() => {
    if (isOpen) {
      checkPermissions();
    }
  }, [isOpen]);

  const checkPermissions = async () => {
    try {
      const permission = await quickMicrophonePermissionCheck();
      setPermissionState(permission);
      console.log('🔐 Permission state:', permission);
    } catch (error) {
      console.error('Permission check failed:', error);
    }
  };

  const runFullDiagnostics = async () => {
    setIsRunning(true);
    setStep('diagnostics');
    
    try {
      const diagnosticsInstance = new MicrophoneDiagnostics();
      const result = await diagnosticsInstance.runDiagnostics();
      setDiagnostics(result);
      console.log('🔍 Full diagnostics result:', result);
      
      if (result.success) {
        setStep('success');
      } else {
        setStep('fixes');
      }
    } catch (error) {
      console.error('Diagnostics failed:', error);
      setStep('error');
    } finally {
      setIsRunning(false);
    }
  };

  const testMicrophone = async () => {
    setIsRunning(true);
    setStep('testing');
    
    try {
      const result = await testMicrophoneAccess();
      setTestResult(result);
      console.log('🎤 Microphone test result:', result);
      
      if (result.success) {
        setStep('success');
        if (onFixed) {
          setTimeout(() => onFixed(), 2000);
        }
      } else {
        setStep('fixes');
      }
    } catch (error) {
      console.error('Microphone test failed:', error);
      setTestResult({
        success: false,
        message: 'Test failed: ' + error.message,
        error: error.name
      });
      setStep('fixes');
    } finally {
      setIsRunning(false);
    }
  };

  const getStepContent = () => {
    switch (step) {
      case 'initial':
        return (
          <div className="text-center py-8">
            <FiMic className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h3 className="text-xl font-semibold mb-4">Microphone Troubleshooter</h3>
            <p className="text-gray-600 mb-6">
              Let's diagnose and fix your microphone issues step by step.
            </p>
            
            {permissionState && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Current Permission Status:</h4>
                <span className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  permissionState.granted ? 'bg-green-100 text-green-800' :
                  permissionState.denied ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                )}>
                  {permissionState.state || 'Unknown'}
                </span>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={testMicrophone}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlay className="w-5 h-5 inline mr-2" />
                Quick Microphone Test
              </button>
              
              <button
                onClick={runFullDiagnostics}
                className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FiSettings className="w-5 h-5 inline mr-2" />
                Full System Diagnostics
              </button>
            </div>
          </div>
        );

      case 'testing':
      case 'diagnostics':
        return (
          <div className="text-center py-8">
            <FiRefreshCw className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-spin" />
            <h3 className="text-xl font-semibold mb-4">
              {step === 'testing' ? 'Testing Microphone...' : 'Running Diagnostics...'}
            </h3>
            <p className="text-gray-600">
              {step === 'testing' 
                ? 'Please allow microphone access when prompted.'
                : 'Checking browser support, permissions, and device availability...'
              }
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <FiCheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-semibold mb-4 text-green-800">Microphone Working!</h3>
            <p className="text-gray-600 mb-6">
              Your microphone is now accessible and ready for calls.
            </p>
            
            {testResult?.details && (
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium mb-2">Test Results:</h4>
                <ul className="text-sm text-left space-y-1">
                  <li>✅ {testResult.tracks} audio track(s) detected</li>
                  <li>✅ Method: {testResult.details.method}</li>
                  {testResult.details.trackInfo?.map((track, index) => (
                    <li key={index}>✅ {track.label || `Microphone ${index + 1}`}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <button
              onClick={() => onFixed && onFixed()}
              className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
            >
              Continue to App
            </button>
          </div>
        );

      case 'fixes':
        return (
          <div className="py-6">
            <div className="text-center mb-6">
              <FiAlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
              <h3 className="text-xl font-semibold mb-2">Microphone Issues Detected</h3>
              <p className="text-gray-600">
                Here are some solutions to try:
              </p>
            </div>

            {testResult && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Error Details:</h4>
                <p className="text-red-700 text-sm">{testResult.message}</p>
                {testResult.error && (
                  <p className="text-red-600 text-xs mt-1">Error Code: {testResult.error}</p>
                )}
              </div>
            )}

            <div className="space-y-4">
              {(testResult?.fixes || []).map((fix, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5',
                      fix.priority === 'high' ? 'bg-red-500' :
                      fix.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">{fix.title}</h4>
                      <p className="text-gray-600 text-sm mb-3">{fix.description}</p>
                      {fix.steps && (
                        <ol className="text-sm space-y-1 list-decimal list-inside text-gray-700">
                          {fix.steps.map((step, stepIndex) => (
                            <li key={stepIndex}>{step}</li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={testMicrophone}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiRefreshCw className="w-5 h-5 inline mr-2" />
                Test Again
              </button>
              
              <button
                onClick={() => setStep('initial')}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Start
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <FiAlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h3 className="text-xl font-semibold mb-4 text-red-800">Diagnostics Failed</h3>
            <p className="text-gray-600 mb-6">
              Unable to complete the diagnostics. Please try refreshing the page or contact support.
            </p>
            
            <button
              onClick={() => setStep('initial')}
              className="bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        );

      default:
        return null;
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
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FiMic className="w-6 h-6" />
                <h2 className="text-xl font-semibold">Microphone Troubleshooter</h2>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            {getStepContent()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MicrophoneTroubleshooter;
