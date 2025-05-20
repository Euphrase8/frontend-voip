import React, { useState, useEffect, useCallback } from 'react';
import { TextField } from '@mui/material';
import { Phone } from '@mui/icons-material';
import { call } from '../services/call';
import CallingPage from './CallingPage';

const HomePage = ({ darkMode = false }) => {
  const [extension, setExtension] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCallingPage, setShowCallingPage] = useState(false);
  const [notification, setNotification] = useState(null);

  const initiateCall = useCallback(async (ext) => {
    setLoading(true);
    setError('');

    try {
      await call(ext);
      setNotification({ message: `Dialing ${ext}...`, type: 'info' });
      setShowCallingPage(true);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setError('Failed to initiate call. Please try again.');
      setNotification({ message: 'Call failed', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCall = useCallback(() => {
    if (!extension || !/^\d{4}$/.test(extension)) {
      setError('Please enter a valid 4-digit extension');
      setNotification({ message: 'Invalid extension', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    initiateCall(extension);
  }, [extension, initiateCall]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Backspace') {
        setExtension((prev) => prev.slice(0, -1));
        return;
      }

      if (/\d/.test(e.key) && extension.length < 4) {
        const newExtension = extension + e.key;
        setExtension(newExtension);
        setError('');

        if (newExtension.length === 4) {
          initiateCall(newExtension);
        }
      } else if (e.key === 'Enter') {
        handleCall();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [extension, handleCall, initiateCall]);

  const handleKeypadClick = (value) => {
    if (extension.length < 4) {
      const newExtension = extension + value;
      setExtension(newExtension);
      setError('');

      if (newExtension.length === 4) {
        initiateCall(newExtension);
      }
    }
  };

  const handleClear = () => {
    setExtension('');
    setError('');
  };

  const handleEndCall = () => {
    setExtension('');
    setShowCallingPage(false);
    setNotification({ message: 'Call ended', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const keypadButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  if (showCallingPage) {
    return (
      <CallingPage
        contact={{ name: `Extension ${extension}`, extension }}
        callStatus="Dialing..."
        onEndCall={handleEndCall}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div className="relative w-full max-w-[90vw] xs:max-w-[85vw] sm:max-w-[80vw] md:max-w-md mx-auto overflow-hidden">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-16 right-2 xs:right-4 z-50 glass-effect p-2 xs:p-3 rounded-lg shadow-lg animate-[fadeInUp_0.6s_ease-out_forwards] ${
            notification.type === 'success'
              ? 'bg-green-500/80'
              : notification.type === 'error'
              ? 'bg-red-500/80'
              : 'bg-blue-500/80'
          }`}
          role="alert"
          aria-live="polite"
        >
          <span className={`text-xs xs:text-sm sm:text-base font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
            {notification.message}
          </span>
        </div>
      )}

      <div
        className="glass-effect p-4 xs:p-5 sm:p-6 rounded-3xl shadow-2xl transform transition-all duration-500 animate-[fadeInUp_0.6s_ease-out_forwards] min-h-[400px] max-h-[80vh]"
        style={{ background: darkMode ? 'rgba(30, 30, 30, 0.2)' : 'rgba(239, 246, 255, 0.8)' }}
      >
        <h2
          className={`text-lg xs:text-xl sm:text-2xl font-bold mb-4 text-center flex items-center justify-center ${
            darkMode ? 'text-white' : 'text-black'
          } animate-[fadeInUp_0.8s_ease-out_forwards]`}
        >
          <Phone
            className={`mr-2 w-5 h-5 xs:w-6 xs:h-6 animate-bounce ${
              darkMode ? 'text-white' : 'text-black'
            }`}
          />
          Dial Extension
        </h2>

        {error && (
          <div
            className={`${
              darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100/80 text-red-900'
            } p-2 xs:p-3 rounded-lg mb-4 text-xs xs:text-sm sm:text-base animate-[fadeInUp_1s_ease-out_forwards]`}
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="mb-4 relative animate-[fadeInUp_1s_ease-out_forwards]">
          <TextField
            type="text"
            value={extension}
            readOnly
            variant="outlined"
            fullWidth
            placeholder="Enter extension"
            className="glass-effect rounded-lg"
            InputProps={{
              className: `text-center text-xs xs:text-sm sm:text-base ${
                darkMode ? 'bg-gray-800/50 text-white' : 'bg-blue-100/80 text-black'
              }`,
              'aria-label': 'Current extension',
            }}
          />
          {/* Dial Indicator */}
          {extension && (
            <div className="absolute top-1/2 right-2 xs:right-4 transform -translate-y-1/2 flex space-x-1">
              {[...extension].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-blue-400 rounded-full"
                  style={{ animationDelay: `${i * 0.2}s` }}
                ></div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1 xs:gap-2 sm:gap-3 mb-4 animate-[fadeInUp_1.2s_ease-out_forwards]">
          {keypadButtons.map((btn) => (
            <button
              key={btn}
              onClick={() => handleKeypadClick(btn)}
              className={`p-4 xs:p-4 sm:p-5 rounded-full text-xs xs:text-sm sm:text-base font-semibold transition-all duration-300 transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[44px] min-h-[44px] shadow-md hover:shadow-lg ${
                darkMode
                  ? 'bg-gray-800/50 hover:bg-gray-700/50 text-white'
                  : 'bg-blue-100/80 hover:bg-blue-200/80 text-black'
              }`}
              aria-label={`Dial ${btn}`}
            >
              {btn}
            </button>
          ))}
        </div>

        <div className="flex space-x-1 xs:space-x-2 sm:space-x-3 animate-[fadeInUp_1.4s_ease-out_forwards]">
          <button
            onClick={handleClear}
            className={`flex-1 p-3 xs:p-4 sm:p-4 rounded-lg text-xs xs:text-sm sm:text-base font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-500 shadow-md hover:shadow-lg min-w-[100px] min-h-[44px] ${
              darkMode
                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                : 'bg-blue-200 hover:bg-blue-300 text-black'
            }`}
            aria-label="Clear extension"
          >
            Clear
          </button>
          <button
            onClick={handleCall}
            disabled={loading}
            className={`flex-1 p-3 xs:p-4 sm:p-4 rounded-lg text-xs xs:text-sm sm:text-base font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md hover:shadow-lg min-w-[100px] min-h-[44px] ${
              loading
                ? 'opacity-50 cursor-not-allowed'
                : darkMode
                ? 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-black'
            }`}
            aria-label="Make call"
          >
            {loading ? 'Calling...' : 'Call'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;