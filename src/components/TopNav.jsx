import React from 'react';

const TopNav = ({ username, callStatus, onLogout }) => (
  <div className="w-full bg-[#36454F] bg-opacity-90 backdrop-blur-md p-4 lg:p-6 min-h-20 lg:min-h-24 flex justify-between items-center text-white shadow-lg rounded-b-xl">
    <h1 className="text-lg lg:text-xl font-bold font-sans truncate">VoIP Dashboard</h1>
    <div className="flex items-center space-x-4 lg:space-x-6">
      {callStatus && (
        <span className="text-sm lg:text-base font-sans animate-pulse truncate max-w-[100px] sm:max-w-xs">
          📞 {callStatus}
        </span>
      )}
      <div className="flex items-center space-x-3 lg:space-x-4">
        <span className="text-sm lg:text-base font-sans truncate max-w-[100px] sm:max-w-xs">
          {username || 'Guest'}
        </span>
        <div
          className="w-6 h-6 lg:w-8 lg:h-8 bg-gray-300 rounded-full"
          aria-hidden="true"
        ></div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="px-3 py-1 lg:px-4 lg:py-2 bg-red-600 hover:bg-red-700 text-white text-xs lg:text-sm rounded-full transition-all duration-300 focus:ring-2 focus:ring-red-500"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  </div>
);

export default TopNav;
