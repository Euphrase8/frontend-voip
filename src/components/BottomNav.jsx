import React from 'react';

const BottomNav = ({ currentPage, onNavigate }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-[#F5DEB3] backdrop-blur-md p-2 sm:p-2 flex justify-around items-center shadow-lg z-10">
    <button
      onClick={() => onNavigate('favorites')}
      className={`flex flex-col items-center p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        currentPage === 'favorites' ? 'text-blue-600 bg-blue-100' : 'text-gray-600 hover:text-blue-600'
      } transition-all duration-300`}
      aria-label="Navigate to Favorites"
    >
      <span className="text-lg sm:text-xl">⭐</span>
      <span className="text-xs sm:text-sm font-sans hidden sm:block">Favorites</span>
    </button>
    <button
      onClick={() => onNavigate('recents')}
      className={`flex flex-col items-center p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        currentPage === 'recents' ? 'text-blue-600 bg-blue-100' : 'text-gray-600 hover:text-blue-600'
      } transition-all duration-300`}
      aria-label="Navigate to Recents"
    >
      <span className="text-lg sm:text-xl">🕒</span>
      <span className="text-xs sm:text-sm font-sans hidden sm:block">Recents</span>
    </button>
    <button
      onClick={() => onNavigate('contacts')}
      className={`flex flex-col items-center p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        currentPage === 'contacts' ? 'text-blue-600 bg-blue-100' : 'text-gray-600 hover:text-blue-600'
      } transition-all duration-300`}
      aria-label="Navigate to Contacts"
    >
      <span className="text-lg sm:text-xl">👤</span>
      <span className="text-xs sm:text-sm font-sans hidden sm:block">Contacts</span>
    </button>
    <button
      onClick={() => onNavigate('keypad')}
      className={`flex flex-col items-center p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        currentPage === 'keypad' ? 'text-blue-600 bg-blue-100' : 'text-gray-600 hover:text-blue-600'
      } transition-all duration-300`}
      aria-label="Navigate to Keypad"
    >
      <span className="text-lg sm:text-xl">⌨️</span>
      <span className="text-xs sm:text-sm font-sans hidden sm:block">Keypad</span>
    </button>
  </div>
);

export default BottomNav;