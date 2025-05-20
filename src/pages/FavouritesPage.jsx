import React, { useState, useEffect, useRef } from 'react';
import { Avatar, TextField, Tooltip, IconButton } from '@mui/material';
import { Phone, Star, StarBorder } from '@mui/icons-material';

const Contact = ({ contact, onCall, onToggleFavorite, darkMode }) => {
  const priorityColor = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  return (
    <div
      className={`flex items-center justify-between p-3 sm:p-4 rounded-xl glass-effect border border-white/20 transform transition-all duration-300 hover:shadow-[0_0_10px_rgba(59,130,246,0.4)] hover:scale-105 animate-[fadeInUp_1.2s_ease-out_forwards] mb-3 sm:mb-4 ${
        darkMode ? 'bg-gray-800/30' : 'bg-white/20'
      }`}
    >
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="relative">
          <Avatar
            alt={`${contact.name}'s avatar`}
            src={contact.avatar || '/static/images/avatar/2.jpg'}
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-white/40 shadow-md"
          />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-50 animate-[pulse_3s_infinite] shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${priorityColor[contact.priority]} animate-pulse`}
              aria-hidden="true"
            ></span>
            <span className={`text-sm sm:text-base md:text-lg font-medium ${darkMode ? 'text-white' : 'text-white'}`}>
              {contact.name}
            </span>
          </div>
          <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-200'}`}>
            Ext: {contact.extension}
          </span>
          <span
            className={`block text-xs sm:text-sm ${
              contact.status === 'online' ? 'text-green-400 animate-pulse' : 'text-gray-400'
            }`}
          >
            {contact.status}
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Tooltip title={contact.status === 'online' ? `Call ${contact.name}` : 'Contact is offline'}>
          <span>
            <IconButton
              onClick={() => {
                if (contact.status === 'online') {
                  onCall(contact);
                }
              }}
              className={`p-2 text-white text-xs sm:text-sm transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                contact.status === 'online'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  : 'bg-gray-500 cursor-not-allowed'
              }`}
              disabled={contact.status !== 'online'}
              aria-label={`Call ${contact.name}`}
            >
              <Phone className="text-sm sm:text-base animate-pulse" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={contact.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}>
          <IconButton
            onClick={() => onToggleFavorite(contact)}
            className={`p-2 text-yellow-400 hover:text-yellow-300 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
              darkMode ? 'bg-gray-800/50' : 'bg-gray-700/50'
            }`}
            aria-label={contact.isFavorite ? `Remove ${contact.name} from favorites` : `Add ${contact.name} to favorites`}
          >
            {contact.isFavorite ? <Star className="text-sm sm:text-base" /> : <StarBorder className="text-sm sm:text-base" />}
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
};

const FavoritesPage = ({ contacts, onCall, onToggleFavorite, darkMode = false }) => {
  const [notification, setNotification] = useState(null);
  const scrollContainerRef = useRef(null);
  const favoriteContacts = contacts.filter((contact) => contact.isFavorite);

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

    const items = scrollContainerRef.current?.querySelectorAll('.favorite-contact-item');
    items?.forEach((item) => observer.observe(item));

    return () => {
      items?.forEach((item) => observer.unobserve(item));
    };
  }, [favoriteContacts]);

  const handleCall = (contact) => {
    onCall(contact);
    setNotification({ message: `Calling ${contact.name}...`, type: 'info' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleFavorite = (contact) => {
    onToggleFavorite(contact);
    setNotification({
      message: contact.isFavorite ? `Removed ${contact.name} from favorites` : `Added ${contact.name} to favorites`,
      type: 'info',
    });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-4xl mx-auto animate-[fadeInUp_0.6s_ease-out_forwards]">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-20 right-4 sm:right-6 z-50 glass-effect p-3 sm:p-4 rounded-lg shadow-lg animate-[fadeInUp_0.6s_ease-out_forwards] ${
            notification.type === 'info' ? 'bg-blue-500/80' : 'bg-green-500/80'
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
          <Star className="animate-bounce text-yellow-400" />
          <span>Favorites</span>
        </h2>

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6 animate-[fadeInUp_1.2s_ease-out_forwards]">
          <TextField
            variant="outlined"
            fullWidth
            placeholder="Search favorite contacts..."
            className="glass-effect rounded-lg"
            InputProps={{
              className: `text-white text-sm sm:text-base ${darkMode ? 'bg-gray-800/50' : 'bg-gray-700/50'}`,
              'aria-label': 'Search favorite contacts',
            }}
            disabled // Placeholder for future functionality
          />
        </div>

        <div
          ref={scrollContainerRef}
          className="max-h-96 overflow-y-auto no-scrollbar"
          style={{ scrollBehavior: 'smooth' }}
        >
          {favoriteContacts.length > 0 ? (
            favoriteContacts.map((contact, index) => (
              <div key={contact.id} className="favorite-contact-item opacity-0">
                <Contact
                  contact={contact}
                  onCall={handleCall}
                  onToggleFavorite={handleToggleFavorite}
                  darkMode={darkMode}
                  index={index}
                />
              </div>
            ))
          ) : (
            <p
              className={`text-sm sm:text-base text-center ${darkMode ? 'text-gray-300' : 'text-gray-200'} animate-[fadeInUp_1.4s_ease-out_forwards]`}
            >
              No favorite contacts yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoritesPage;