import React from 'react';
import Avatar from '@mui/material/Avatar';


const contacts = [
  { id: 1, name: 'John Doe', extension: '1001', priority: 'high', status: 'online', avatar: 'https://via.placeholder.com/40/ef4444/fff?text=JD' },
  { id: 2, name: 'Jane Smith', extension: '1002', priority: 'medium', status: 'offline', avatar: 'https://via.placeholder.com/40/facc15/fff?text=JS' },
  { id: 3, name: 'Alice Brown', extension: '1003', priority: 'low', status: 'online', avatar: 'https://via.placeholder.com/40/22c55e/fff?text=AB' },
];

const Contact = ({ contact, onCall }) => {
  const priorityColor = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  return (
    <div className="flex items-center justify-between p-3 sm:p-4  rounded-xl shadow-md mb-3 transform transition-all duration-200 hover:shadow-lg animate-fade-in">
      <div className="flex items-center space-x-3 sm:space-x-4">
        
        <Avatar alt={`${contact.name}'s avatar`} src="/static/images/avatar/2.jpg" 
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
        />
        <div>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${priorityColor[contact.priority]} animate-pulse`} aria-hidden="true"></span>
            <span className="text-gray-800 font-medium text-sm sm:text-base">{contact.name}</span>
          </div>
          <span className="text-xs sm:text-sm text-gray-500">Ext: {contact.extension}</span>
          <span className={`block text-xs sm:text-sm ${contact.status === 'online' ? 'text-green-600' : 'text-gray-500'}`}>
            {contact.status}
          </span>
        </div>
      </div>
      <button
        onClick={() => onCall(contact)}
        className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-white text-xs sm:text-sm font-semibold flex items-center space-x-2 ${
          contact.status === 'online'
            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
            : 'bg-gray-400 cursor-not-allowed'
        } transition-all duration-200 transform hover:scale-105`}
        disabled={contact.status !== 'online'}
        aria-label={`Call ${contact.name}`}
      >
        <span className="animate-pulse">📞</span>
        <span>Call</span>
      </button>
    </div>
  );
};

const ContactsPage = ({ onCall }) => (
  <div className="">
    <div className="max-w-4xl mx-auto">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-300 flex items-center space-x-2">
        <span className="animate-bounce">📇</span>
        <span>Contacts</span>
      </h2>
      <div className="space-y-3 bg-white/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl shadow-sm max-h-96 overflow-y-auto">
  {contacts.map((contact) => (
    <Contact key={contact.id} contact={contact} onCall={onCall} />
  ))}
</div>

    </div>
  </div>
);

export default ContactsPage;