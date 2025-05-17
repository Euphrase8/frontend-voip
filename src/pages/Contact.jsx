import React from 'react';
import { Avatar } from '@mui/material';

const Contact = ({ contact, onCall, onToggleFavorite }) => {
  const priorityColor = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  return (
    <div className="flex items-center justify-between p-3 sm:p-4 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm mb-3 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      <div className="flex items-center space-x-3 sm:space-x-4">
        
           
        <Avatar alt={`${contact.name}'s avatar`} src="/static/images/avatar/2.jpg" 
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
        />
      
        <div>
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${priorityColor[contact.priority]} animate-pulse`} aria-hidden="true"></span>
            <span className="text-gray-900 font-medium text-base sm:text-lg font-sans">{contact.name}</span>
          </div>
          <span className={`text-sm sm:text-base font-sans ${contact.status === 'online' ? 'text-green-600' : 'text-gray-500'}`}>
            {contact.status}
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-3">
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(contact.id)}
            className={`p-2 rounded-full ${contact.isFavorite ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500`}
            aria-label={contact.isFavorite ? `Remove ${contact.name} from favorites` : `Add ${contact.name} to favorites`}
          >
            <span className="text-lg sm:text-xl">⭐</span>
          </button>
        )}
        <button
          onClick={() => onCall(contact)}
          className={`px-4 py-2 rounded-full text-white text-sm sm:text-base font-semibold font-sans flex items-center space-x-2 ${
            contact.status === 'online'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              : 'bg-gray-400 cursor-not-allowed'
          } transition-all duration-300 transform hover:scale-105 active:scale-95`}
          disabled={contact.status !== 'online'}
          aria-label={`Call ${contact.name}`}
        >
          <span className="animate-pulse">📞</span>
          <span>Call</span>
        </button>
      </div>
    </div>
  );
};

export default Contact;