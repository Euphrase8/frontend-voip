import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Tooltip, Button } from '@mui/material';
import { Call, CallEnd } from '@mui/icons-material';
import { handleIncomingCall } from '../services/IncomingCallService';

const IncomingCallPage = ({
  callData,
  contacts,
  user,
  darkMode = false,
}) => {
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const audioContextRef = useRef(null);
  const timerRef = useRef(null);
  const callHandlerRef = useRef(null);

  // Find caller details
  const caller = contacts.find((c) => c.extension === callData.from) || {
    name: `Ext ${callData.from}`,
    extension: callData.from,
    avatar: 'https://via.placeholder.com/40/cccccc/fff?text=?',
  };

  useEffect(() => {
    // Initialize handleIncomingCall
    handleIncomingCall(
      callData,
      user,
      (stream, peerConnection) => {
        // On accept, navigate to /calling
        navigate('/calling', {
          state: {
            contact: caller,
            callStatus: 'Connected',
            isOutgoing: false,
            stream,
            peerConnection,
          },
        });
      },
      () => {
        // On reject, clear incoming call
        setNotification({ message: 'Call rejected', type: 'info' });
        setTimeout(() => setNotification(null), 3000);
      }
    ).then((handler) => {
      callHandlerRef.current = handler;
    }).catch((error) => {
      console.error('Failed to initialize incoming call:', error);
      setNotification({ message: 'Failed to handle incoming call', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    });

    // Start ringtone
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContextRef.current.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime);
    const gainNode = audioContextRef.current.createGain();
    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    oscillator.start();
    setTimeout(() => oscillator.stop(), 30000);

    // Start vibration
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }

    // Start timeout
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleReject();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (navigator.vibrate) {
        navigator.vibrate(0);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callData, user, contacts, navigate]);

  const handleAccept = async () => {
    if (!callHandlerRef.current) return;
    setIsLoading(true);
    try {
      await callHandlerRef.current.acceptCall();
      setNotification({ message: 'Call accepted', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error accepting call:', error);
      setNotification({ message: `Failed to answer call: ${error.message}`, type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!callHandlerRef.current) return;
    setIsLoading(true);
    try {
      await callHandlerRef.current.rejectCall();
    } catch (error) {
      console.error('Error rejecting call:', error);
      setNotification({ message: `Failed to reject call: ${error.message}`, type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAccept();
    } else if (e.key === 'Escape') {
      handleReject();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4 sm:p-6 animate-[fadeInUp_0.6s_ease-out_forwards]"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-label="Incoming call dialog"
    >
      {notification && (
        <div
          className={`fixed top-20 right-4 sm:right-6 z-50 glass-effect p-3 sm:p-4 rounded-lg shadow-lg animate-[fadeInUp_0.6s_ease-out_forwards] ${
            notification.type === 'success' ? 'bg-green-500/80' : notification.type === 'error' ? 'bg-red-500/80' : 'bg-blue-500/80'
          }`}
          role="alert"
          aria-live="polite"
        >
          <span className="text-xs sm:text-sm font-medium text-white">{notification.message}</span>
        </div>
      )}
      <div
        className="w-full max-w-[90%] sm:max-w-md glass-effect p-6 sm:p-8 rounded-2xl shadow-xl border border-white/20 transform transition-all duration-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-[fadeInUp_0.8s_ease-out_forwards]"
        style={{
          background: darkMode ? 'rgba(30, 30, 30, 0.25)' : 'rgba(255, 255, 255, 0.2)',
        }}
      >
        <div className="flex items-center space-x-4 mb-6 animate-[fadeInUp_1s_ease-out_forwards]">
          <Avatar
            alt={caller.name}
            src={caller.avatar}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-3 border-white/40 shadow-md"
          />
          <div>
            <h2
              className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-white'} animate-pulse`}
              aria-live="polite"
              style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
            >
              Incoming Call
            </h2>
            <p className={`text-base sm:text-lg ${darkMode ? 'text-gray-300' : 'text-gray-200'}`}>
              From: {caller.name} (Ext: {caller.extension})
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-300'} mt-1`}>
              Priority: {callData.priority || 'Normal'}
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-300'} mt-1`}>
              Time Left: {timeLeft}s
            </p>
          </div>
        </div>
        <div className="flex justify-center space-x-6 animate-[fadeInUp_1.2s_ease-out_forwards]">
          <Tooltip title="Accept Call">
            <Button
              variant="contained"
              onClick={handleAccept}
              disabled={isLoading}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 focus:ring-4 focus:ring-green-500/60 transition-all transform hover:scale-110 active:scale-95 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              } ${darkMode ? 'shadow-green-900/60' : 'shadow-green-700/60'}`}
              startIcon={<Call className="text-2xl" />}
              aria-label="Accept the incoming call"
            />
          </Tooltip>
          <Tooltip title="Reject Call">
            <Button
              variant="contained"
              onClick={handleReject}
              disabled={isLoading}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950 focus:ring-4 focus:ring-red-500/60 transition-all transform hover:scale-110 active:scale-95 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              } ${darkMode ? 'shadow-red-900/60' : 'shadow-red-700/60'}`}
              startIcon={<CallEnd className="text-2xl" />}
              aria-label="Reject the incoming call"
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallPage;