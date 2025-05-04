import React from 'react';

const Sidebar = ({ user, onLogout, onNavigate, activePage }) => (
  <div className="fixed w-8 sm:w-64 bg-gray-900 text-white h-screen p-2 sm:p-4 flex flex-col z-10">
    <div className="mb-4 sm:mb-6">
      <h2 className="text-lg sm:text-xl font-bold hidden sm:block">VoIP App</h2>
      <p className="text-xs sm:text-sm text-gray-400 truncate">{user.username}</p>
    </div>
    <nav className="flex-1">
      <ul className="space-y-1 sm:space-y-2">
        <li>
          <button
            onClick={() => onNavigate('home')}
            className={`w-full text-left p-1 sm:p-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-base ${
              activePage === 'home' ? 'bg-gray-700' : ''
            }`}
            aria-label="Navigate to Home"
          >
            <span className="block sm:hidden animate-pulse">🏠</span>
            <span className="hidden sm:block">Home</span>
          </button>
        </li>
        <li>
          <button
            onClick={() => onNavigate('contacts')}
            className={`w-full text-left p-1 sm:p-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-base ${
              activePage === 'contacts' ? 'bg-gray-700' : ''
            }`}
            aria-label="Navigate to Contacts"
          >
            <span className="block sm:hidden animate-pulse">📇</span>
            <span className="hidden sm:block">Contacts</span>
          </button>
        </li>
        <li>
          <button
            onClick={() => onNavigate('callLogs')}
            className={`w-full text-left p-1 sm:p-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-base ${
              activePage === 'callLogs' ? 'bg-gray-700' : ''
            }`}
            aria-label="Navigate to Call Logs"
          >
            <span className="block sm:hidden animate-pulse">📜</span>
            <span className="hidden sm:block">Call Logs</span>
          </button>
        </li>
      </ul>
    </nav>
    <button
      onClick={onLogout}
      className="mt-auto bg-red-500 text-white p-1 sm:p-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs sm:text-base"
      aria-label="Log out"
    >
      <span className="block sm:hidden animate-pulse">🚪</span>
      <span className="hidden sm:block">Logout</span>
    </button>
  </div>
);

export default Sidebar;