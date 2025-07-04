import React, { useState } from 'react';
import { FiMic, FiMicOff, FiSettings } from 'react-icons/fi';
import { testMicrophoneAccess } from '../utils/microphoneDiagnostics';
import { cn } from '../utils/ui';

const MicrophoneTestButton = ({ onShowFix, className = '' }) => {
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micStatus, setMicStatus] = useState(null);

  const testMicrophone = async () => {
    setIsTestingMic(true);
    try {
      const result = await testMicrophoneAccess();
      setMicStatus(result);
      
      // Auto-hide success message after 3 seconds
      if (result.success) {
        setTimeout(() => setMicStatus(null), 3000);
      }
    } catch (error) {
      setMicStatus({
        success: false,
        message: 'Test failed: ' + error.message
      });
    } finally {
      setIsTestingMic(false);
    }
  };

  const getStatusColor = () => {
    if (!micStatus) return 'bg-blue-600 hover:bg-blue-700';
    return micStatus.success 
      ? 'bg-green-600 hover:bg-green-700' 
      : 'bg-red-600 hover:bg-red-700';
  };

  const getStatusIcon = () => {
    if (isTestingMic) return <FiMic className="w-4 h-4 animate-pulse" />;
    if (!micStatus) return <FiMic className="w-4 h-4" />;
    return micStatus.success 
      ? <FiMic className="w-4 h-4" />
      : <FiMicOff className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (isTestingMic) return 'Testing...';
    if (!micStatus) return 'Test Microphone';
    return micStatus.success ? 'Microphone OK' : 'Microphone Issue';
  };

  return (
    <div className={cn('flex flex-col space-y-2', className)}>
      <button
        onClick={testMicrophone}
        disabled={isTestingMic}
        className={cn(
          'flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          getStatusColor()
        )}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </button>

      {micStatus && !micStatus.success && (
        <div className="flex flex-col space-y-2">
          <p className="text-sm text-red-600">{micStatus.message}</p>
          {onShowFix && (
            <button
              onClick={onShowFix}
              className="flex items-center justify-center space-x-2 px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
            >
              <FiSettings className="w-3 h-3" />
              <span>Fix Issues</span>
            </button>
          )}
        </div>
      )}

      {micStatus && micStatus.success && (
        <p className="text-sm text-green-600">
          ✓ Found {micStatus.tracks} audio track(s)
        </p>
      )}
    </div>
  );
};

export default MicrophoneTestButton;
