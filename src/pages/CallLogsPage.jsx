import React from 'react';

const callLogs = [
  { id: 1, contact: 'John Doe', extension: '1001', time: '2025-05-04 10:30', duration: '5m 23s', status: 'Completed' },
  { id: 2, contact: 'Jane Smith', extension: '1002', time: '2025-05-04 09:15', duration: '3m 10s', status: 'Missed' },
  { id: 3, contact: 'Alice Brown', extension: '1003', time: '2025-05-04 08:45', duration: '4m 12s', status: 'Completed' },
];

const CallLog = ({ log }) => (
  <div className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-xl shadow-md mb-3 animate-fade-in">
    <div className="flex items-center space-x-3 sm:space-x-4">
      <span className="text-gray-800 font-medium text-sm sm:text-base">{log.contact}</span>
      <span className="text-xs sm:text-sm text-gray-500">Ext: {log.extension}</span>
      <span className="text-xs sm:text-sm text-gray-500">{log.time}</span>
    </div>
    <div className="flex items-center space-x-2 sm:space-x-4">
      <span className="text-xs sm:text-sm text-gray-600">{log.duration}</span>
      <span className={`text-xs sm:text-sm ${log.status === 'Completed' ? 'text-green-600' : 'text-red-600'}`}>
        {log.status}
      </span>
    </div>
  </div>
);

const CallLogsPage = () => (
  <div className="flex-1 p-4 sm:p-6 bg-gradient-to-br from-gray-100 to-blue-50 overflow-y-auto">
    <div className="max-w-4xl mx-auto">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 flex items-center space-x-2">
        <span className="animate-bounce">📜</span>
        <span>Call Logs</span>
      </h2>
      <div className="space-y-3">
        {callLogs.map((log) => (
          <CallLog key={log.id} log={log} />
        ))}
      </div>
    </div>
  </div>
);

export default CallLogsPage;