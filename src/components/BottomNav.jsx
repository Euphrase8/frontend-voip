import React from 'react';
import { Phone, Favorite, Contacts, History } from '@mui/icons-material';

const BottomNav = ({ currentPage, onNavigate, darkMode = false }) => {
  const navItems = [
    { id: "keypad", label: "Keypad", icon: <Phone /> },
    { id: "favorites", label: "Favorites", icon: <Favorite /> },
    { id: "contacts", label: "Contacts", icon: <Contacts /> },
    { id: "calllogs", label: "Call Logs", icon: <History /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-effect p-1 xs:p-2 sm:p-3 flex justify-between gap-0.5 xs:gap-1 sm:gap-2 bg-gray-800/90 shadow-2xl animate-[fadeInUp_0.8s_ease-out_forwards] md:hidden safe-area-bottom pb-safe">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`p-2 xs:p-3 sm:p-4 rounded-lg flex flex-col items-center justify-center transition-all transform active:scale-95 touch-target tap-highlight flex-1 max-w-[80px] ${
            currentPage === item.id
              ? "text-white bg-blue-500/40 shadow-lg"
              : darkMode
              ? "text-gray-300 hover:text-white hover:bg-white/10"
              : "text-gray-600 hover:text-white hover:bg-white/10"
          }`}
          aria-label={`Navigate to ${item.label}`}
          style={{ minHeight: '52px' }}
        >
          <div className="w-5 h-5 xs:w-6 xs:h-6 mb-1 flex items-center justify-center">
            {item.icon}
          </div>
          <span className="text-2xs xs:text-xs font-medium leading-tight text-center">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default BottomNav;