import React from 'react';
import Avatar from '@mui/material/Avatar';

const CallingPage = ({ contact, callStatus, onEndCall }) => (
  <div className="flex-1 p-4 sm:p-6 bg-gradient-to-br from-gray-100 to-blue-50 flex items-center justify-center">
    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md bg-white p-6 sm:p-8 rounded-2xl shadow-2xl transform transition-all duration-300 hover:shadow-3xl animate-slide-up">
      <div className="flex items-center space-x-4 mb-4">
      <Avatar alt={`${contact.name}'s avatar`} src="/static/images/avatar/10.jpg" 
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
        />
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{callStatus}</h3>
          <p className="text-sm text-gray-600">Calling {contact.name || `Ext ${contact.extension}`}</p>
        </div>
      </div>
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <button
        onClick={onEndCall}
        className="w-full bg-red-500 text-white p-3 sm:p-4 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base font-semibold transition-all duration-200 transform hover:scale-105"
        aria-label="End call"
      >
        End Call
      </button>
    </div>
  </div>
);

export default CallingPage;