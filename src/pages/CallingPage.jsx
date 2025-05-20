import React, { useState, useEffect } from 'react';
import { Avatar, IconButton, Tooltip } from '@mui/material';
import { CallEnd, MicOff, VolumeUp, SignalCellularAlt, VolumeMute } from '@mui/icons-material';
import { hangup } from '../services/hang';

const CallingPage = ({ contact, callStatus, onEndCall, channel = "PJSIP/1002", darkMode = false }) => {
  const [callTime, setCallTime] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (callStatus === 'Connected') {
      setIsConnected(true);
      setNotification({ message: 'Call Connected', type: 'success' });
      const timer = setInterval(() => {
        setCallTime((prev) => prev + 1);
      }, 1000);
      console.log(`Tone produced for call to ${contact.name || 'Ext ' + contact.extension}`);
      setTimeout(() => setNotification(null), 3000);
      return () => clearInterval(timer);
    } else {
      setIsConnected(false);
      setCallTime(0);
      if (callStatus !== 'Dialing...') {
        setNotification({ message: `Call StatusWcStatus: ${callStatus}`, type: 'info' });
        setTimeout(() => setNotification(null), 3000);
      }
    }
  }, [callStatus, contact]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleEndCall = async () => {
    try {
      await hangup(channel);
      setNotification({ message: 'Call Ended', type: 'info' });
      onEndCall();
    } catch (error) {
      setNotification({ message: error.message, type: 'error' });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 md:p-8 animate-[fadeInUp_0.6s_ease-out_forwards] z-40 overflow-auto">
      {notification && (
        <div
          className={`fixed top-20 right-4 sm:right-6 z-50 glass-effect p-3 sm:p-4 rounded-lg shadow-lg animate-[fadeInUp_0.6s_ease-out_forwards] ${
            notification.type === 'success' ? 'bg-green-500/80' : notification.type === 'error' ? 'bg-red-500/80' : 'bg-blue-500/80'
          }`}
        >
          <span className="text-xs sm:text-sm font-medium text-white">{notification.message}</span>
        </div>
      )}

      <div
        className="w-full max-w-[90%] sm:max-w-xs md:max-w-sm lg:max-w-md glass-effect p-4 sm:p-6 md:p-8 rounded-2xl shadow-xl border border-white/20 transform transition-all duration-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-[fadeInUp_0.8s_ease-out_forwards] overflow-auto"
        style={{
          background: darkMode ? 'rgba(30, 30, 30, 0.25)' : 'rgba(255, 255, 255, 0.2)',
        }}
      >
        <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6 animate-[fadeInUp_1s_ease-out_forwards]">
          <div className="relative">
            <Avatar
              alt={`${contact.name || 'Contact'}'s avatar`}
              src={contact.avatar || '/static/images/avatar/2.jpg'}
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full object-cover border-3 border-white/40 shadow-md"
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-50 animate-[pulse_3s_infinite] shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3
                className={`text-lg sm:text-xl md:text-2xl font-bold ${
                  darkMode ? 'text-white' : 'text-white'
                } ${isConnected ? 'text-green-400 animate-pulse' : ''}`}
                aria-live="polite"
              >
                {callStatus}
              </h3>
              <VolumeMute className="text-gray-300 text-sm sm:text-base" aria-label="Audio call" title="Audio Call" />
            </div>
            <p className={`text-sm sm:text-base md:text-lg ${darkMode ? 'text-gray-300' : 'text-gray-200'} animate-[fadeInUp_1.2s_ease-out_forwards]`}>
              Calling {contact.name || `Ext ${contact.extension}`}
            </p>
            <p className={`text-xs sm:text-sm md:text-base ${darkMode ? 'text-gray-400' : 'text-gray-300'} mt-1 animate-[fadeInUp_1.4s_ease-out_forwards]`}>
              {isConnected ? formatTime(callTime) : '00:00'}
            </p>
          </div>
        </div>

        <div className="flex justify-center mb-4 animateivé[fadeInUp_1.6s_ease-out_forwards]">
          <Tooltip title="Call Quality">
            <div className="flex space-x-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-1.5 h-5 rounded-full ${isConnected ? 'bg-green-400 animate-[pulse_2s_infinite]' : 'bg-gray-500'}`}
                  style={{ animationDelay: `${i * 0.2}s` }}
                ></div>
              ))}
            </div>
          </Tooltip>
        </div>

        <div className="relative flex justify-center mb-4 animate-[fadeInUp_1.8s_ease-out_forwards]">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
            <div
              className={`absolute inset-0 rounded-full ${
                isConnected ? 'bg-green-500/30 animate-[wave_2s_infinite]' : 'bg-blue-500/30 animate-[pulse_2s_infinite]'
              }`}
            ></div>
            <div
              className={`absolute inset-2 rounded-full ${
                isConnected ? 'bg-green-500/20 animate-[wave_2s_infinite_0.5s]' : 'bg-blue-500/20 animate-[pulse_2s_infinite_0.5s]'
              }`}
            ></div>
          </div>
        </div>

        <div className="flex justify-center space-x-3 sm:space-x-4 mb-4 animate-[fadeInUp_2s_ease-out_forwards]">
          <Tooltip title="Mute Microphone">
            <IconButton
              className={`w-10 h-10 sm:w-12 sm:h-12 glass-effect text-white hover:bg-gray-600/70 transition-all transform hover:scale-110 focus:ring-2 focus:ring-blue-500 ${
                darkMode ? 'bg-gray-800/60' : 'bg-gray-700/60'
              }`}
              aria-label="Mute microphone"
            >
              <MicOff className="text-base sm:text-lg" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Toggle Speaker">
            <IconButton
              className={`w-10 h-10 sm:w-12 sm:h-12 glass-effect text-white hover:bg-gray-600/70 transition-all transform hover:scale-110 focus:ring-2 focus:ring-blue-500 ${
                darkMode ? 'bg-gray-800/60' : 'bg-gray-700/60'
              }`}
              aria-label="Toggle speaker"
            >
              <VolumeUp className="text-base sm:text-lg" />
            </IconButton>
          </Tooltip>
        </div>

        <button
          onClick={handleEndCall}
          className={`w-full bg-gradient-to-r from-red-700 to-red-900 text-white p-3 sm:p-4 md:p-5 rounded-xl hover:from-red-800 hover:to-red-950 focus:outline-none focus:ring-4 focus:ring-red-500/60 text-sm sm:text-base md:text-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center shadow-lg hover:shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-[fadeInUp_2.2s_ease-out_forwards] ${
            darkMode ? 'shadow-red-900/60' : 'shadow-red-700/60'
          }`}
          aria-label="End the current call"
        >
          <CallEnd className="mr-2 text-base sm:text-lg" /> End Call
        </button>
      </div>
    </div>
  );
};

export default CallingPage;