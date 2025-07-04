import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiMic,
  FiMicOff,
  FiPlay,
  FiStopCircle,
  FiRefreshCw,
  FiSettings,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo
} from 'react-icons/fi';
import { 
  testMicrophoneAccess, 
  quickMicrophonePermissionCheck,
  MicrophoneDiagnostics 
} from '../utils/microphoneDiagnostics';
import MicrophoneTroubleshooter from '../components/MicrophoneTroubleshooter';
import { cn } from '../utils/ui';

const MicrophoneTestPage = ({ darkMode }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [testResult, setTestResult] = useState(null);
  const [permissionState, setPermissionState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);

  useEffect(() => {
    checkPermissions();
    return () => {
      // Cleanup
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  const checkPermissions = async () => {
    try {
      const permission = await quickMicrophonePermissionCheck();
      setPermissionState(permission);
    } catch (error) {
      console.error('Permission check failed:', error);
    }
  };

  const testMicrophone = async () => {
    setIsLoading(true);
    try {
      const result = await testMicrophoneAccess();
      setTestResult(result);
      
      if (result.success) {
        await checkPermissions(); // Update permission state
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Test failed: ' + error.message,
        error: error.name
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Set up audio level monitoring
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyserNode = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      
      setAudioContext(audioCtx);
      setAnalyser(analyserNode);

      // Start monitoring audio levels
      const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
      const updateAudioLevel = () => {
        if (analyserNode) {
          analyserNode.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(Math.min(100, (average / 255) * 100));
          
          if (isRecording) {
            requestAnimationFrame(updateAudioLevel);
          }
        }
      };
      updateAudioLevel();

      // Set up media recorder
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setIsRecording(true);

      recorder.start();
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Audio data recorded:', event.data.size, 'bytes');
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setAudioLevel(0);
        if (audioCtx) {
          audioCtx.close();
        }
      };

    } catch (error) {
      console.error('Failed to start recording:', error);
      setTestResult({
        success: false,
        message: 'Recording failed: ' + error.message,
        error: error.name
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  };

  const getPermissionColor = () => {
    if (!permissionState) return 'gray';
    switch (permissionState.state) {
      case 'granted': return 'green';
      case 'denied': return 'red';
      case 'prompt': return 'yellow';
      default: return 'gray';
    }
  };

  const getPermissionIcon = () => {
    if (!permissionState) return <FiInfo />;
    switch (permissionState.state) {
      case 'granted': return <FiCheckCircle />;
      case 'denied': return <FiAlertTriangle />;
      case 'prompt': return <FiInfo />;
      default: return <FiInfo />;
    }
  };

  return (
    <div className={cn(
      'min-h-screen p-6',
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    )}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-4">Microphone Test Center</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test your microphone functionality and troubleshoot issues
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Permission Status */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              'p-6 rounded-lg border',
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            )}
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              {getPermissionIcon()}
              <span className="ml-2">Permission Status</span>
            </h2>
            
            {permissionState ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Current State:</span>
                  <span className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    getPermissionColor() === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    getPermissionColor() === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    getPermissionColor() === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  )}>
                    {permissionState.state || 'Unknown'}
                  </span>
                </div>
                
                <button
                  onClick={checkPermissions}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiRefreshCw className="w-4 h-4 inline mr-2" />
                  Refresh Status
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">Checking permissions...</p>
              </div>
            )}
          </motion.div>

          {/* Quick Test */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              'p-6 rounded-lg border',
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            )}
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiMic className="mr-2" />
              Quick Test
            </h2>
            
            <div className="space-y-4">
              <button
                onClick={testMicrophone}
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <FiRefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <FiPlay className="w-4 h-4 inline mr-2" />
                    Test Microphone Access
                  </>
                )}
              </button>

              {testResult && (
                <div className={cn(
                  'p-4 rounded-lg border',
                  testResult.success 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                )}>
                  <div className="flex items-start space-x-2">
                    {testResult.success ? (
                      <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    ) : (
                      <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    )}
                    <div>
                      <p className={cn(
                        'font-medium',
                        testResult.success 
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-red-800 dark:text-red-200'
                      )}>
                        {testResult.success ? 'Success!' : 'Failed'}
                      </p>
                      <p className={cn(
                        'text-sm',
                        testResult.success 
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      )}>
                        {testResult.message}
                      </p>
                      {testResult.details && (
                        <div className="mt-2 text-xs">
                          <p>Method: {testResult.details.method}</p>
                          <p>Tracks: {testResult.tracks}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Live Recording Test */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'p-6 rounded-lg border lg:col-span-2',
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            )}
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiMic className="mr-2" />
              Live Recording Test
            </h2>
            
            <div className="text-center space-y-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FiMic className="w-5 h-5 inline mr-2" />
                  Start Recording Test
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <FiStopCircle className="w-5 h-5 inline mr-2" />
                  Stop Recording
                </button>
              )}

              {isRecording && (
                <div className="space-y-4">
                  <p className="text-green-600 dark:text-green-400 font-medium">
                    🔴 Recording... Speak into your microphone
                  </p>
                  
                  {/* Audio Level Indicator */}
                  <div className="max-w-md mx-auto">
                    <div className="flex items-center space-x-2">
                      <FiMic className="w-4 h-4" />
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                        <div 
                          className="bg-green-500 h-4 rounded-full transition-all duration-100"
                          style={{ width: `${audioLevel}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono w-12">
                        {Math.round(audioLevel)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Troubleshooter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'p-6 rounded-lg border lg:col-span-2',
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            )}
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiSettings className="mr-2" />
              Troubleshooting
            </h2>
            
            <div className="text-center space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Having microphone issues? Use our comprehensive troubleshooter to diagnose and fix problems.
              </p>
              
              <button
                onClick={() => setShowTroubleshooter(true)}
                className="bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FiSettings className="w-5 h-5 inline mr-2" />
                Open Troubleshooter
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Troubleshooter Modal */}
      <MicrophoneTroubleshooter
        isOpen={showTroubleshooter}
        onClose={() => setShowTroubleshooter(false)}
        onFixed={() => {
          setShowTroubleshooter(false);
          testMicrophone();
          checkPermissions();
        }}
      />
    </div>
  );
};

export default MicrophoneTestPage;
