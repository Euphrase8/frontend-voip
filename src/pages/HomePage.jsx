import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FiPhoneCall as PhoneCall,
  FiDelete as Delete,
  FiTrash2 as Trash2,
  FiUser as User,
  FiUsers as Users
} from 'react-icons/fi';
import { call } from '../services/call';
import CallingPage from './CallingPage';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../utils/ui';
import toast from 'react-hot-toast';

const HomePage = ({ darkMode = false, onCall }) => {
  const [extension, setExtension] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCallingPage, setShowCallingPage] = useState(false);
  const [callData, setCallData] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const { darkMode: themeDarkMode } = useTheme();
  const isDark = darkMode || themeDarkMode;

  const initiateCall = useCallback(async (ext) => {
    setLoading(true);

    try {
      const callResult = await call(ext);
      console.log('[HomePage] Call initiated with result:', callResult);

      // Store call data including channel information
      setCallData({
        channel: callResult.apiChannel || callResult.appChannel || callResult.call_id,
        method: callResult.method || 'webrtc',
        callId: callResult.call_id,
        extension: ext
      });

      toast.success(`Dialing ${ext}...`);
      setShowCallingPage(true);

      // Add to recent calls
      const newCall = {
        extension: ext,
        timestamp: new Date(),
        type: 'outgoing'
      };
      setRecentCalls(prev => [newCall, ...prev.slice(0, 4)]);

      // Call parent handler if provided
      if (onCall) {
        onCall(ext);
      }
    } catch (err) {
      console.error('[HomePage] Call initiation failed:', err);
      toast.error('Failed to initiate call. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [onCall]);

  const handleCall = useCallback(() => {
    if (!extension || !/^\d{3,6}$/.test(extension)) {
      toast.error('Please enter a valid extension (3-6 digits)');
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
    if (value === 'delete') {
      setExtension(prev => prev.slice(0, -1));
      return;
    }

    if (extension.length < 6) {
      const newExtension = extension + value;
      setExtension(newExtension);
    }
  };

  const handleClear = () => {
    setExtension('');
    setError('');
  };

  const handleEndCall = () => {
    setExtension('');
    setShowCallingPage(false);
    setCallData(null);
    setNotification({ message: 'Call ended', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const keypadButtons = [
    { value: '1', label: '1', sub: '' },
    { value: '2', label: '2', sub: 'ABC' },
    { value: '3', label: '3', sub: 'DEF' },
    { value: '4', label: '4', sub: 'GHI' },
    { value: '5', label: '5', sub: 'JKL' },
    { value: '6', label: '6', sub: 'MNO' },
    { value: '7', label: '7', sub: 'PQRS' },
    { value: '8', label: '8', sub: 'TUV' },
    { value: '9', label: '9', sub: 'WXYZ' },
    { value: '*', label: '*', sub: '' },
    { value: '0', label: '0', sub: '+' },
    { value: '#', label: '#', sub: '' },
  ];

  if (showCallingPage) {
    return (
      <CallingPage
        contact={{ name: `Extension ${extension}`, extension }}
        callStatus="Dialing..."
        isOutgoing={true}
        channel={callData?.channel}
        transport={callData?.method === 'webrtc' ? 'transport-ws' : 'transport-sip'}
        onEndCall={handleEndCall}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header Section - Compact on mobile */}
      <div className="flex-shrink-0 p-3 sm:p-4 lg:p-6 border-b border-secondary-200 dark:border-secondary-700">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
            <PhoneCall className={cn(
              'w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8',
              isDark ? 'text-primary-400' : 'text-primary-600'
            )} />
            <h1 className={cn(
              "text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold",
              isDark ? "text-white" : "text-secondary-900"
            )}>
              VoIP Dialer
            </h1>
          </div>
          <p className={cn(
            "text-xs sm:text-sm lg:text-base",
            isDark ? "text-secondary-400" : "text-secondary-600"
          )}>
            Professional Voice Communication System
          </p>
        </div>
      </div>

      {/* Main Content - No scrolling on desktop, optimized for mobile */}
      <div className="flex-1 overflow-hidden lg:overflow-visible">
        <div className="h-full flex flex-col lg:items-center lg:justify-center p-3 sm:p-4 lg:p-6">
          {/* Responsive Container */}
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl mx-auto flex flex-col space-y-4 sm:space-y-6 lg:space-y-8 h-full lg:h-auto">

            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h2 className={cn(
                "text-lg sm:text-xl lg:text-2xl font-semibold mb-2",
                isDark ? "text-white" : "text-secondary-900"
              )}>
                Make a Call
              </h2>
              <p className={cn(
                "text-sm sm:text-base",
                isDark ? "text-secondary-400" : "text-secondary-600"
              )}>
                Enter a 4-digit extension number to connect with other users
              </p>
            </motion.div>

            {/* Extension Display - Compact and Responsive */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl border shadow-lg flex-shrink-0",
                isDark
                  ? "bg-secondary-800 border-secondary-700"
                  : "bg-white border-secondary-200"
              )}
            >
              {/* Status Indicator */}
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                <div className={cn(
                  'w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full mr-1.5 sm:mr-2',
                  isDark ? 'bg-primary-500' : 'bg-primary-600'
                )} />
                <span className={cn(
                  'text-xs sm:text-sm font-medium',
                  isDark ? 'text-secondary-300' : 'text-secondary-700'
                )}>
                  Ready to dial
                </span>
              </div>

              <div className="mb-3 sm:mb-4 lg:mb-6">
                <label className={cn(
                  "block text-xs sm:text-sm lg:text-base font-semibold mb-2 sm:mb-3",
                  isDark ? "text-secondary-300" : "text-secondary-700"
                )}>
                  Extension Number
                </label>
                <div className={cn(
                  "text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-mono font-bold min-h-[2.5rem] sm:min-h-[3rem] lg:min-h-[4rem] flex items-center justify-center p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-200",
                  extension
                    ? (isDark
                        ? "text-white border-primary-500 bg-secondary-700 shadow-inner"
                        : "text-secondary-900 border-primary-500 bg-primary-50 shadow-inner")
                    : (isDark
                        ? "text-secondary-500 border-secondary-600 bg-secondary-700"
                        : "text-secondary-400 border-secondary-300 bg-secondary-50")
                )}>
                  {extension || "----"}
                </div>
                {error && (
                  <p className="text-danger-600 text-xs sm:text-sm mt-2 text-center">{error}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleCall}
                  disabled={!extension || loading}
                  className={cn(
                    "flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg border-2 text-sm sm:text-base",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "active:scale-95 transform transition-transform duration-100",
                    !extension || loading
                      ? (isDark ? "bg-secondary-700 text-secondary-500 border-secondary-600" : "bg-secondary-300 text-secondary-500 border-secondary-200")
                      : "bg-success-500 hover:bg-success-600 text-white border-success-400 hover:border-success-500 hover:shadow-xl"
                  )}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Calling...</span>
                    </>
                  ) : (
                    <>
                      <PhoneCall className="w-4 h-4" />
                      <span>Call Extension</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setExtension('')}
                  disabled={!extension}
                  className={cn(
                    "flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg border-2 text-sm sm:text-base",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "active:scale-95 transform transition-transform duration-100",
                    !extension
                      ? (isDark ? "bg-secondary-700 text-secondary-500 border-secondary-600" : "bg-secondary-300 text-secondary-500 border-secondary-200")
                      : "bg-danger-500 hover:bg-danger-600 text-white border-danger-400 hover:border-danger-500 hover:shadow-xl"
                  )}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              </div>
            </motion.div>

            {/* Professional Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div className={cn(
                "p-4 rounded-xl border text-center",
                isDark ? "bg-secondary-800 border-secondary-700" : "bg-white border-secondary-200"
              )}>
                <PhoneCall className={cn(
                  "w-8 h-8 mx-auto mb-2",
                  isDark ? "text-primary-400" : "text-primary-600"
                )} />
                <h3 className={cn(
                  "font-semibold text-sm",
                  isDark ? "text-white" : "text-secondary-900"
                )}>
                  HD Voice Quality
                </h3>
                <p className={cn(
                  "text-xs mt-1",
                  isDark ? "text-secondary-400" : "text-secondary-600"
                )}>
                  Crystal clear audio
                </p>
              </div>

              <div className={cn(
                "p-4 rounded-xl border text-center",
                isDark ? "bg-secondary-800 border-secondary-700" : "bg-white border-secondary-200"
              )}>
                <User className={cn(
                  "w-8 h-8 mx-auto mb-2",
                  isDark ? "text-success-400" : "text-success-600"
                )} />
                <h3 className={cn(
                  "font-semibold text-sm",
                  isDark ? "text-white" : "text-secondary-900"
                )}>
                  Instant Connect
                </h3>
                <p className={cn(
                  "text-xs mt-1",
                  isDark ? "text-secondary-400" : "text-secondary-600"
                )}>
                  Fast call setup
                </p>
              </div>

              <div className={cn(
                "p-4 rounded-xl border text-center",
                isDark ? "bg-secondary-800 border-secondary-700" : "bg-white border-secondary-200"
              )}>
                <Users className={cn(
                  "w-8 h-8 mx-auto mb-2",
                  isDark ? "text-warning-400" : "text-warning-600"
                )} />
                <h3 className={cn(
                  "font-semibold text-sm",
                  isDark ? "text-white" : "text-secondary-900"
                )}>
                  Multi-Device
                </h3>
                <p className={cn(
                  "text-xs mt-1",
                  isDark ? "text-secondary-400" : "text-secondary-600"
                )}>
                  Works everywhere
                </p>
              </div>
            </motion.div>

            {/* Recent Calls */}
            {recentCalls.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={cn(
                  "p-4 rounded-xl border",
                  isDark ? "bg-secondary-800 border-secondary-700" : "bg-white border-secondary-200"
                )}
              >
                <h3 className={cn(
                  "font-semibold mb-3 flex items-center space-x-2",
                  isDark ? "text-white" : "text-secondary-900"
                )}>
                  <PhoneCall className="w-4 h-4" />
                  <span>Recent Calls</span>
                </h3>
                <div className="space-y-2">
                  {recentCalls.slice(0, 3).map((call, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg",
                        isDark ? "bg-secondary-700" : "bg-secondary-50"
                      )}
                    >
                      <span className={cn(
                        "font-mono text-sm",
                        isDark ? "text-white" : "text-secondary-900"
                      )}>
                        {call.extension}
                      </span>
                      <span className={cn(
                        "text-xs",
                        isDark ? "text-secondary-400" : "text-secondary-600"
                      )}>
                        {call.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Responsive Professional Keypad */}
            <div className={cn(
              "flex-1 lg:flex-none p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl lg:rounded-3xl border-2 shadow-lg flex flex-col min-h-0",
              isDark
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-indigo-100"
            )}>
              {/* Decorative header bar */}
              <div className={cn(
                'h-1 rounded-full mb-2 sm:mb-3 lg:mb-4 mx-auto w-10 sm:w-12 lg:w-16 flex-shrink-0',
                isDark ? 'bg-indigo-600' : 'bg-indigo-500'
              )}></div>

              <h3 className={cn(
                "text-sm sm:text-base lg:text-lg font-bold mb-3 sm:mb-4 lg:mb-6 text-center flex-shrink-0",
                isDark ? "text-white" : "text-slate-800"
              )}>
                Keypad
              </h3>

              {/* Keypad Grid - Responsive and Centered */}
              <div className="flex-1 flex flex-col justify-center lg:justify-start min-h-0">
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 lg:gap-3 mb-2 sm:mb-3 lg:mb-4 w-full max-w-[240px] sm:max-w-xs mx-auto">
                  {keypadButtons.map((btn) => (
                    <button
                      key={btn.value}
                      onClick={() => handleKeypadClick(btn.value)}
                      className={cn(
                        "relative p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl lg:rounded-2xl font-bold transition-all duration-200 shadow-lg border-2 touch-target",
                        "focus:outline-none focus:ring-2 focus:ring-indigo-500",
                        "aspect-square flex flex-col items-center justify-center text-center",
                        "active:scale-95 transform transition-transform duration-100 hover:scale-105",
                        "min-h-[48px] sm:min-h-[56px] lg:min-h-[64px]", // Ensure minimum touch target
                        isDark
                          ? "bg-slate-700 hover:bg-slate-600 text-white border-slate-600 hover:border-slate-500"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 hover:border-slate-300 hover:shadow-xl"
                      )}
                      aria-label={`Dial ${btn.value}`}
                    >
                      <span className="text-base sm:text-lg lg:text-xl font-bold leading-none">{btn.label}</span>
                      {btn.sub && (
                        <span className={cn(
                          "text-xs font-medium leading-none mt-0.5",
                          isDark ? "text-slate-400" : "text-slate-500"
                        )}>
                          {btn.sub}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Delete Button */}
                <div className="w-full max-w-[240px] sm:max-w-xs mx-auto">
                  <button
                    onClick={() => handleKeypadClick('delete')}
                    disabled={!extension}
                    className={cn(
                      "w-full p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl lg:rounded-2xl font-semibold transition-all duration-200 shadow-lg border-2 touch-target",
                      "focus:outline-none focus:ring-2 focus:ring-indigo-500",
                      "flex items-center justify-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm lg:text-base",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "active:scale-95 transform transition-transform duration-100",
                      "min-h-[44px] sm:min-h-[48px] lg:min-h-[52px]", // Ensure minimum touch target
                      !extension
                        ? "bg-slate-200 text-slate-400 border-slate-100"
                        : "bg-red-500 hover:bg-red-600 text-white border-red-400 hover:border-red-500 hover:shadow-xl"
                    )}
                  >
                    <Delete className="w-3.5 sm:w-4 lg:w-5 h-3.5 sm:h-4 lg:h-5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;