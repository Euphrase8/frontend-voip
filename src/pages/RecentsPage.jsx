// src/pages/RecentsPage.jsx
import React from 'react';
import CallLog from '../pages/CallLogsPage';

const RecentsPage = ({ callLogs }) => (
  <div className="">
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-200 font-sans flex items-center space-x-2">
        <span className="animate-bounce">🕒</span>
        <span>Recents</span>
      </h2>
      <div className="space-y-3 bg-white/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl shadow-sm max-h-96 overflow-y-auto custom-scrollbar">
        {callLogs.map((log) => (
          <CallLog key={log.id} log={log} />
        ))}
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  </div>
);

export default RecentsPage;
