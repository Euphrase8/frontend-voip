import React, { useEffect, useState, useRef } from 'react';
import { TextField, Tooltip } from '@mui/material';
import { Phone } from '@mui/icons-material';
import { getLogs } from '../services/logs';

const CallLog = ({ log, index, darkMode }) => (
  <div
    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-xl glass-effect border border-white/20 transform transition-all duration-300 hover:shadow-[0_0_10px_rgba(59,130,246,0.4)] hover:scale-[1.02] animate-[fadeInUp_1.2s_ease-out_forwards] mb-3 sm:mb-4 ${
      darkMode ? 'bg-gray-800/30' : 'bg-white/20'
    }`}
    style={{ animationDelay: `${index * 0.1}s` }}
  >
    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 md:space-x-6">
      <span className={`text-sm sm:text-base md:text-lg font-semibold ${darkMode ? 'text-white' : 'text-white'}`}>
        {log.contact}
      </span>
      <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-200'}`}>
        Ext: <span className="font-medium">{log.extension}</span>
      </span>
      <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-200'}`}>
        {log.time}
      </span>
      <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-200'}`}>
        {log.duration}
      </span>
      <span
        className={`text-xs sm:text-sm font-medium ${
          log.status === 'Completed' ? 'text-green-400 animate-pulse' : 'text-red-400 animate-pulse'
        }`}
      >
        {log.status}
      </span>
    </div>
    <Tooltip title={`Call ${log.contact}`}>
      <button
        className={`mt-2 sm:mt-0 px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-white text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md hover:shadow-[0_0_8px_rgba(59,130,246,0.5)] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700`}
        aria-label={`Call ${log.contact}`}
      >
        <Phone className="text-sm sm:text-base animate-pulse" />
        <span>Call</span>
      </button>
    </Tooltip>
  </div>
);

const CallLogsPage = ({ darkMode = false }) => {
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logs = await getLogs();
        setCallLogs(logs);
      } catch (err) {
        console.error("Failed to load logs:", err);
        setCallLogs([]);
        setNotification({ message: 'Failed to load call logs', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-[fadeInUp_0.6s_ease-out_forwards]');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const items = scrollContainerRef.current?.querySelectorAll('.call-log-item');
    items?.forEach((item) => observer.observe(item));

    return () => {
      items?.forEach((item) => observer.unobserve(item));
    };
  }, [callLogs]);

  return (
    <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-4xl mx-auto animate-[fadeInUp_0.6s_ease-out_forwards]">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-20 right-4 sm:right-6 z-50 glass-effect p-3 sm:p-4 rounded-lg shadow-lg animate-[fadeInUp_0.6s_ease-out_forwards] ${
            notification.type === 'error' ? 'bg-red-500/80' : 'bg-blue-500/80'
          }`}
        >
          <span className="text-xs sm:text-sm font-medium text-white">{notification.message}</span>
        </div>
      )}

      <div
        className="glass-effect p-4 sm:p-6 md:p-8 rounded-2xl shadow-xl border border-white/20 animate-[fadeInUp_0.8s_ease-out_forwards]"
        style={{ background: darkMode ? 'rgba(30, 30, 30, 0.25)' : 'rgba(255, 255, 255, 0.2)' }}
      >
        <h2
          className={`text-lg sm:text-xl md:text-2xl font-semibold mb-4 sm:mb-6 flex items-center space-x-2 ${
            darkMode ? 'text-white' : 'text-white'
          } animate-[fadeInUp_1s_ease-out_forwards]`}
        >
          <Phone className="animate-bounce" />
          <span>Call Logs</span>
        </h2>

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6 animate-[fadeInUp_1.2s_ease-out_forwards]">
          <TextField
            variant="outlined"
            fullWidth
            placeholder="Search call logs..."
            className="glass-effect rounded-lg"
            InputProps={{
              className: `text-white text-sm sm:text-base ${darkMode ? 'bg-gray-800/50' : 'bg-gray-700/50'}`,
              'aria-label': 'Search call logs',
            }}
            disabled // Placeholder for future functionality
          />
        </div>

        <div
          ref={scrollContainerRef}
          className="max-h-96 overflow-y-auto no-scrollbar"
          style={{ scrollBehavior: 'smooth' }}
        >
          {loading ? (
            <p className={`text-center text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-200'}`}>
              Loading...
            </p>
          ) : callLogs.length === 0 ? (
            <p className={`text-center text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-200'}`}>
              No call logs available.
            </p>
          ) : (
            callLogs.map((log, index) => (
              <div key={log.id} className="call-log-item opacity-0">
                <CallLog log={log} index={index} darkMode={darkMode} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CallLogsPage;