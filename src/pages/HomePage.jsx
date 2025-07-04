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
      setCallData({
        channel: callResult.apiChannel || callResult.appChannel || callResult.call_id,
        method: callResult.method || 'webrtc',
        callId: callResult.call_id,
        extension: ext
      });
      toast.success(`Dialing ${ext}...`);
      setShowCallingPage(true);
      const newCall = {
        extension: ext,
        timestamp: new Date(),
        type: 'outgoing'
      };
      setRecentCalls(prev => [newCall, ...prev.slice(0, 4)]);
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
        callStatus="Initiating Call..."
        isOutgoing={true}
        channel={callData?.channel}
        transport={callData?.method === 'webrtc' ? 'transport-ws' : 'transport-sip'}
        onEndCall={handleEndCall}
        darkMode={darkMode}
        callAccepted={false}
        isWebRTCCall={callData?.method === 'webrtc'}
        callId={callData?.callId}
      />
    );
  }

  return (
    <div className="w-full min-h-[100dvh] flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 px-2 sm:px-4 py-2 sm:py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <PhoneCall className={cn(
              'w-4 sm:w-5 h-4 sm:h-5',
              isDark ? 'text-blue-400' : 'text-blue-600'
            )} />
            <h1 className={cn(
              "text-base sm:text-lg font-bold",
              isDark ? "text-white" : "text-gray-900"
            )}>
              VoIP Dialer
            </h1>
          </div>
          <p className={cn(
            "text-xs mt-1",
            isDark ? "text-gray-400" : "text-gray-600"
          )}>
            Professional Voice Communication
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="w-full max-w-[90vw] sm:max-w-md mx-auto space-y-3">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <h2 className={cn(
              "text-base font-semibold",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Make a Call
            </h2>
            <p className={cn(
              "text-xs mt-1",
              isDark ? "text-gray-400" : "text-gray-600"
            )}>
              Enter a 3-6 digit extension
            </p>
          </motion.div>

          {/* Extension Input */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className={cn(
              "p-2 sm:p-3 rounded-lg border shadow-sm",
              isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5">
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isDark ? 'bg-blue-500' : 'bg-blue-600'
                )} />
                <span className={cn(
                  'text-xs',
                  isDark ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Ready to dial
                </span>
              </div>
              <span className={cn(
                "text-xs font-semibold",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>
                Extension
              </span>
            </div>
            <div className={cn(
              "text-base font-mono font-bold min-h-[2rem] flex items-center justify-center px-2 py-1.5 rounded border-2 transition-all duration-200",
              extension
                ? (isDark
                    ? "text-white border-blue-500 bg-gray-700 shadow-inner"
                    : "text-gray-900 border-blue-500 bg-blue-50 shadow-inner")
                : (isDark
                    ? "text-gray-500 border-gray-600 bg-gray-700"
                    : "text-gray-400 border-gray-300 bg-gray-50")
            )}>
              {extension || "----"}
            </div>
            {error && (
              <p className="text-red-600 text-xs mt-2 text-center">{error}</p>
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCall}
                disabled={!extension || loading}
                className={cn(
                  "flex-1 flex items-center justify-center space-x-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md font-medium transition-all duration-200 shadow-sm border text-xs",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "active:scale-95 touch-manipulation min-h-[2.5rem]",
                  !extension || loading
                    ? (isDark ? "bg-gray-700 text-gray-500 border-gray-600" : "bg-gray-300 text-gray-500 border-gray-200")
                    : "bg-green-500 hover:bg-green-600 text-white border-green-400 hover:border-green-500"
                )}
              >
                {loading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Calling...</span>
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-3 h-3" />
                    <span>Call</span>
                  </>
                )}
              </button>
              <button
                onClick={handleClear}
                disabled={!extension}
                className={cn(
                  "flex-1 flex items-center justify-center space-x-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md font-medium transition-all duration-200 shadow-sm border text-xs",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "active:scale-95 touch-manipulation min-h-[2.5rem]",
                  !extension
                    ? (isDark ? "bg-gray-700 text-gray-500 border-gray-600" : "bg-gray-300 text-gray-500 border-gray-200")
                    : "bg-red-500 hover:bg-red-600 text-white border-red-400 hover:border-red-500"
                )}
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="grid grid-cols-3 gap-2"
          >
            <div className={cn(
              "p-2 rounded-lg border text-center",
              isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            )}>
              <PhoneCall className={cn(
                "w-4 h-4 mx-auto mb-1",
                isDark ? "text-blue-400" : "text-blue-600"
              )} />
              <h3 className={cn(
                "font-semibold text-xs",
                isDark ? "text-white" : "text-gray-900"
              )}>
                HD Voice
              </h3>
              <p className={cn(
                "text-xs mt-0.5",
                isDark ? "text-gray-400" : "text-gray-600"
              )}>
                Crystal clear
              </p>
            </div>
            <div className={cn(
              "p-2 rounded-lg border text-center",
              isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            )}>
              <User className={cn(
                "w-4 h-4 mx-auto mb-1",
                isDark ? "text-green-400" : "text-green-600"
              )} />
              <h3 className={cn(
                "font-semibold text-xs",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Instant
              </h3>
              <p className={cn(
                "text-xs mt-0.5",
                isDark ? "text-gray-400" : "text-gray-600"
              )}>
                Fast setup
              </p>
            </div>
            <div className={cn(
              "p-2 rounded-lg border text-center",
              isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            )}>
              <Users className={cn(
                "w-4 h-4 mx-auto mb-1",
                isDark ? "text-yellow-400" : "text-yellow-600"
              )} />
              <h3 className={cn(
                "font-semibold text-xs",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Multi-Device
              </h3>
              <p className={cn(
                "text-xs mt-0.5",
                isDark ? "text-gray-400" : "text-gray-600"
              )}>
                Everywhere
              </p>
            </div>
          </motion.div>

          {/* Recent Calls */}
          {recentCalls.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className={cn(
                "p-2 rounded-lg border",
                isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              )}
            >
              <h3 className={cn(
                "font-semibold mb-1.5 flex items-center space-x-1.5 text-xs",
                isDark ? "text-white" : "text-gray-900"
              )}>
                <PhoneCall className="w-3 h-3" />
                <span>Recent Calls</span>
              </h3>
              <div className="space-y-1">
                {recentCalls.slice(0, 3).map((call, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-1.5 rounded text-xs",
                      isDark ? "bg-gray-700" : "bg-gray-50"
                    )}
                  >
                    <span className={cn(
                      "font-mono",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      {call.extension}
                    </span>
                    <span className={cn(
                      "text-xs",
                      isDark ? "text-gray-400" : "text-gray-600"
                    )}>
                      {call.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Keypad */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className={cn(
              "p-2 rounded-lg border shadow-sm",
              isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            )}
          >
            <div className="flex items-center justify-center mb-1.5">
              <div className={cn(
                'w-6 h-0.5 rounded-full mr-1.5',
                isDark ? 'bg-blue-600' : 'bg-blue-500'
              )}></div>
              <h3 className={cn(
                "text-xs font-bold text-center",
                isDark ? "text-white" : "text-gray-800"
              )}>
                Keypad
              </h3>
              <div className={cn(
                'w-6 h-0.5 rounded-full ml-1.5',
                isDark ? 'bg-blue-600' : 'bg-blue-500'
              )}></div>
            </div>
            <div className="grid grid-cols-3 gap-1 w-full max-w-[85vw] sm:max-w-[18rem] mx-auto">
              {keypadButtons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => handleKeypadClick(btn.value)}
                  className={cn(
                    "p-2 rounded-md font-bold transition-all duration-200 shadow-sm border",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    "aspect-square flex flex-col items-center justify-center text-center",
                    "active:scale-95 touch-manipulation min-h-[2.25rem] sm:min-h-[2.75rem]",
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-white border-gray-600 hover:border-gray-500"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-200 hover:border-gray-300"
                  )}
                  aria-label={`Dial ${btn.value}`}
                >
                  <span className="text-sm font-bold leading-none">{btn.label}</span>
                  {btn.sub && (
                    <span className={cn(
                      "text-[0.6rem] font-medium leading-none mt-0.5",
                      isDark ? "text-gray-400" : "text-gray-500"
                    )}>
                      {btn.sub}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="w-full max-w-[85vw] sm:max-w-[18rem] mx-auto mt-2">
              <button
                onClick={() => handleKeypadClick('delete')}
                disabled={!extension}
                className={cn(
                  "w-full p-2 rounded-md font-medium transition-all duration-200 shadow-sm border",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "flex items-center justify-center space-x-1.5 text-xs",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "active:scale-95 touch-manipulation min-h-[2.25rem] sm:min-h-[2.75rem]",
                  !extension
                    ? "bg-gray-200 text-gray-400 border-gray-100"
                    : "bg-red-500 hover:bg-red-600 text-white border-red-400 hover:border-red-500"
                )}
              >
                <Delete className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;