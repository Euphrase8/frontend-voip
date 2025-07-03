import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, TextField, Tooltip } from '@mui/material';
import { Phone } from '@mui/icons-material';
import { getUsers } from '../services/users';
import { getExtension } from '../services/login';
import { call } from '../services/call';

const Contact = ({ contact, onCall, darkMode }) => {
  const priorityColor = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl glass-effect border border-white/20 transform transition-all duration-300 hover:shadow-[0_0_10px_rgba(59,130,246,0.4)] hover:scale-105 mb-3 ${
        darkMode ? 'bg-gray-800/30' : 'bg-white/20'
      }`}
    >
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Avatar
            alt={`${contact.name}'s avatar`}
            src={contact.avatar}
            className="w-10 h-10 rounded-full object-cover border-2 border-white/40 shadow-md"
          />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-50 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${priorityColor[contact.priority]} animate-pulse`} />
            <span className={`text-base font-medium ${darkMode ? 'text-white' : 'text-white'}`}>
              {contact.name}
            </span>
          </div>
          <span
            className={`block text-sm ${
              contact.status === 'online' ? 'text-green-400 animate-pulse' : 'text-gray-400'
            }`}
          >
            {contact.status}
          </span>
        </div>
      </div>
      <Tooltip title={contact.status === 'online' ? `Call ${contact.name}` : 'Contact is offline'}>
        <button
          onClick={() => contact.status === 'online' && onCall(contact)}
          className={`px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center space-x-2 transition-all duration-300 hover:scale-110 ${
            contact.status === 'online'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              : 'bg-gray-500 cursor-not-allowed'
          }`}
          disabled={contact.status !== 'online'}
        >
          <Phone className="text-base animate-pulse" />
          <span>Call</span>
        </button>
      </Tooltip>
    </div>
  );
};

const ContactsPage = ({ darkMode = false }) => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const currentUserExtension = getExtension();
        const users = await getUsers();

        const filtered = users
          .filter(
            (user) =>
              user.status === 'online' &&
              `${user.extension}` !== `${currentUserExtension}`
          )
          .map((user) => ({
            ...user,
            channel: `PJSIP/${user.extension}`,
            avatar: user.avatar || null,
          }));

        setContacts(filtered);
      } catch (error) {
        console.error('Error fetching users:', error.message);
        setNotification({ message: 'Failed to load contacts', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
      }
    };

    fetchContacts();
  }, []);

  const handleCall = async (contact) => {
    try {
      await call(contact.extension);
      setNotification({ message: `Calling ${contact.name}...`, type: 'info' });
      navigate('/calling', {
        state: {
          contact: {
            name: contact.name,
            extension: contact.extension,
            avatar: contact.avatar,
          },
          callStatus: 'Dialing...',
          isOutgoing: true,
        },
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Call error:', error.message);
      setNotification({ message: `Failed to call ${contact.name}`, type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {notification && (
        <div
          className={`fixed top-20 right-4 z-50 p-3 rounded-lg shadow-lg ${
            notification.type === 'info'
              ? 'bg-blue-500/80'
              : notification.type === 'error'
              ? 'bg-red-500/80'
              : 'bg-green-500/80'
          }`}
        >
          <span className="text-sm font-medium text-white">
            {notification.message}
          </span>
        </div>
      )}

      <div
        className="glass-effect p-6 rounded-2xl shadow-xl border border-white/20"
        style={{
          background: darkMode
            ? 'rgba(30, 30, 30, 0.25)'
            : 'rgba(255, 255, 255, 0.2)',
        }}
      >
        <h2
          className={`text-xl font-semibold mb-6 flex items-center space-x-2 ${
            darkMode ? 'text-white' : 'text-white'
          }`}
        >
          <Phone className="animate-bounce" />
          <span>Contacts</span>
        </h2>

        <TextField
          variant="outlined"
          fullWidth
          placeholder="Search contacts..."
          className="glass-effect mb-4"
          InputProps={{
            className: `text-white ${
              darkMode ? 'bg-gray-800/50' : 'bg-gray-700/50'
            }`,
          }}
          disabled
        />

        <div className="space-y-4 max-h-96 overflow-y-auto no-scrollbar">
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <Contact
                key={contact.id}
                contact={contact}
                onCall={handleCall}
                darkMode={darkMode}
              />
            ))
          ) : (
            <p className="text-center text-white">No contacts available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactsPage;