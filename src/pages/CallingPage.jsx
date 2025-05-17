import React from 'react';
import { Avatar } from '@mui/material';

const CallingPage = ({ contact, callStatus, onEndCall }) => (
  <div className="fixed inset-0 pt-16 bg-gradient-to-b from-blue-100 to-white flex items-center justify-center p-4 sm:p-6">
    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-sm transform transition-all duration-300 animate-slide-up">
      <div className="flex items-center space-x-4 mb-4">
         
      <Avatar alt={`${contact.name}'s avatar`} src="/static/images/avatar/2.jpg" 
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
        />
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 font-sans">{callStatus}</h3>
          <p className="text-base sm:text-lg text-gray-600 font-sans">
            Calling {contact.name || `Ext ${contact.extension}`}
          </p>
        </div>
      </div>
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <button
        onClick={onEndCall}
        className="w-full bg-red-500 text-white p-3 sm:p-4 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base font-semibold font-sans transition-all duration-300 transform hover:scale-105 active:scale-95"
        aria-label="End call"
      >
        End Call
      </button>
    </div>
  </div>
);

export default CallingPage;