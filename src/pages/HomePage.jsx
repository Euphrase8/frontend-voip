import { useState, useEffect, useCallback } from 'react';
import {
  FiPhoneCall as PhoneCall,
  FiDelete as Delete,
  FiTrash2 as Trash2
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
    <div className="h-full flex flex-col lg:items-center lg:justify-center">
      {/* Desktop: Centered Container, Mobile: Full Height */}
      <div className="w-full lg:max-w-md lg:mx-auto h-full lg:h-auto flex flex-col lg:space-y-6">
        {/* Header */}
        <div className="text-center mb-4 lg:mb-6 flex-shrink-0">
          <h2 className={cn(
            "text-xl lg:text-2xl font-bold mb-2",
            isDark ? "text-white" : "text-slate-800"
          )}>
            Make a Call
          </h2>
          <p className={cn(
            "text-xs lg:text-sm font-medium",
            isDark ? "text-slate-300" : "text-slate-600"
          )}>
            Enter an extension to start calling
          </p>
        </div>

        {/* Extension Display */}
        <div className={cn(
          "p-4 lg:p-6 rounded-2xl lg:rounded-3xl border-2 text-center shadow-lg flex-shrink-0",
          isDark
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-indigo-100"
        )}>
          {/* Decorative header bar */}
          <div className={cn(
            'h-1 rounded-full mb-3 lg:mb-4 mx-auto w-12 lg:w-16',
            isDark ? 'bg-indigo-600' : 'bg-indigo-500'
          )}></div>

          <div className="mb-3 lg:mb-4">
            <label className={cn(
              "block text-xs lg:text-sm font-semibold mb-2 lg:mb-3",
              isDark ? "text-slate-300" : "text-slate-700"
            )}>
              Extension Number
            </label>
            <div className={cn(
              "text-2xl lg:text-3xl font-mono font-bold min-h-[2.5rem] lg:min-h-[3rem] flex items-center justify-center p-3 lg:p-4 rounded-xl lg:rounded-2xl border-2 shadow-inner",
              isDark
                ? "text-white border-slate-600 bg-slate-700"
                : "text-slate-800 border-slate-200 bg-slate-50"
            )}>
              {extension || "Enter extension"}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 lg:gap-3 justify-center">
            <button
              onClick={handleCall}
              disabled={!extension || loading}
              className={cn(
                "flex items-center space-x-1 lg:space-x-2 px-4 lg:px-6 py-2 lg:py-3 rounded-xl lg:rounded-2xl font-semibold transition-all duration-200 shadow-lg border-2 text-sm lg:text-base",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "active:scale-95 transform transition-transform duration-100",
                !extension || loading
                  ? "bg-slate-300 text-slate-500 border-slate-200"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400 hover:border-emerald-500 hover:shadow-xl"
              )}
            >
              {loading ? (
                <>
                  <div className="w-3 lg:w-4 h-3 lg:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Calling...</span>
                </>
              ) : (
                <>
                  <PhoneCall className="w-3 lg:w-4 h-3 lg:h-4" />
                  <span>Call</span>
                </>
              )}
            </button>

            <button
              onClick={() => setExtension('')}
              disabled={!extension}
              className={cn(
                "flex items-center space-x-1 lg:space-x-2 px-3 lg:px-4 py-2 lg:py-3 rounded-xl lg:rounded-2xl font-semibold transition-all duration-200 shadow-lg border-2 text-sm lg:text-base",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "active:scale-95 transform transition-transform duration-100",
                !extension
                  ? "bg-slate-200 text-slate-400 border-slate-100"
                  : "bg-red-500 hover:bg-red-600 text-white border-red-400 hover:border-red-500"
              )}
            >
              <Trash2 className="w-3 lg:w-4 h-3 lg:h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Static Professional Keypad */}
        <div className={cn(
          "flex-1 lg:flex-none p-4 lg:p-6 rounded-2xl lg:rounded-3xl border-2 shadow-lg flex flex-col",
          isDark
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-indigo-100"
        )}>
          {/* Decorative header bar */}
          <div className={cn(
            'h-1 rounded-full mb-3 lg:mb-4 mx-auto w-12 lg:w-16 flex-shrink-0',
            isDark ? 'bg-indigo-600' : 'bg-indigo-500'
          )}></div>

          <h3 className={cn(
            "text-base lg:text-lg font-bold mb-4 lg:mb-6 text-center flex-shrink-0",
            isDark ? "text-white" : "text-slate-800"
          )}>
            Keypad
          </h3>

          {/* Keypad Grid - Static and Centered */}
          <div className="flex-1 flex flex-col justify-center lg:justify-start">
            <div className="grid grid-cols-3 gap-2 lg:gap-3 mb-3 lg:mb-4 max-w-xs mx-auto">
              {keypadButtons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => handleKeypadClick(btn.value)}
                  className={cn(
                    "relative p-3 lg:p-4 rounded-xl lg:rounded-2xl font-bold transition-all duration-200 shadow-lg border-2 touch-target",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-500",
                    "w-16 h-16 lg:w-20 lg:h-20 flex flex-col items-center justify-center",
                    "active:scale-95 transform transition-transform duration-100 hover:scale-105",
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600 text-white border-slate-600 hover:border-slate-500"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 hover:border-slate-300 hover:shadow-xl"
                  )}
                  aria-label={`Dial ${btn.value}`}
                >
                  <span className="text-lg lg:text-xl font-bold">{btn.label}</span>
                  {btn.sub && (
                    <span className={cn(
                      "text-xs font-medium",
                      isDark ? "text-slate-400" : "text-slate-500"
                    )}>
                      {btn.sub}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Delete Button */}
            <div className="max-w-xs mx-auto w-full">
              <button
                onClick={() => handleKeypadClick('delete')}
                disabled={!extension}
                className={cn(
                  "w-full p-3 lg:p-4 rounded-xl lg:rounded-2xl font-semibold transition-all duration-200 shadow-lg border-2 touch-target",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500",
                  "flex items-center justify-center space-x-2 text-sm lg:text-base",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "active:scale-95 transform transition-transform duration-100",
                  !extension
                    ? "bg-slate-200 text-slate-400 border-slate-100"
                    : "bg-red-500 hover:bg-red-600 text-white border-red-400 hover:border-red-500 hover:shadow-xl"
                )}
              >
                <Delete className="w-4 lg:w-5 h-4 lg:h-5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;