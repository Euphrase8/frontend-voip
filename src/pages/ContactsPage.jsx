import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiPhone as Phone,
  FiSearch as Search,
  FiUser as User,
  FiUsers as Users,
  FiPhoneCall as PhoneCall,
  FiStar as Star,
  FiMoreVertical as MoreVertical
} from 'react-icons/fi';
import { getUsers } from '../services/users';
import { getExtension } from '../services/login';
import { call } from '../services/call';
import { useTheme } from '../contexts/ThemeContext';
import { cn, getInitials, getAvatarColor } from '../utils/ui';
import toast from 'react-hot-toast';

const Contact = ({ contact, onCall, darkMode }) => {
  const { darkMode: themeDarkMode } = useTheme();
  const isDark = darkMode || themeDarkMode;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "p-4 rounded-xl border transition-all duration-200 cursor-pointer",
        isDark
          ? "bg-secondary-800 border-secondary-700 hover:bg-secondary-700"
          : "bg-white border-secondary-200 hover:bg-secondary-50 shadow-sm hover:shadow-md"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold",
            getAvatarColor(contact.username || contact.name)
          )}>
            {getInitials(contact.username || contact.name)}
          </div>
          <div>
            <h3 className={cn(
              "font-semibold",
              isDark ? "text-white" : "text-secondary-900"
            )}>
              {contact.username || contact.name}
            </h3>
            <p className={cn(
              "text-sm",
              isDark ? "text-secondary-400" : "text-secondary-600"
            )}>
              Extension: {contact.extension}
            </p>
            {contact.email && (
              <p className={cn(
                "text-xs",
                isDark ? "text-secondary-500" : "text-secondary-500"
              )}>
                {contact.email}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onCall(contact.extension)}
            className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-full transition-colors duration-200 shadow-lg hover:shadow-xl"
            aria-label={`Call ${contact.username || contact.name}`}
          >
            <PhoneCall className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const ContactsPage = ({ darkMode = false, onCall, userID }) => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { darkMode: themeDarkMode } = useTheme();
  const isDark = darkMode || themeDarkMode;

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const currentUserExtension = getExtension();
        const users = await getUsers();

        const filtered = users
          .filter((user) => `${user.extension}` !== `${currentUserExtension}`)
          .map((user) => ({
            ...user,
            channel: `PJSIP/${user.extension}`,
            avatar: user.avatar || null,
          }));

        setContacts(filtered);
      } catch (error) {
        console.error('Error fetching users:', error.message);
        toast.error('Failed to load contacts');
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const handleCall = async (extension) => {
    try {
      if (onCall) {
        onCall(extension);
      } else {
        await call(extension);
        toast.success(`Calling ${extension}...`);
        navigate('/calling', { state: { extension } });
      }
    } catch (error) {
      console.error('Error initiating call:', error.message);
      toast.error('Failed to initiate call');
    }
  };

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact =>
    contact.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.extension?.includes(searchTerm) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className={cn(
          "text-2xl font-bold mb-2",
          isDark ? "text-white" : "text-secondary-900"
        )}>
          Contacts
        </h2>
        <p className={cn(
          "text-sm",
          isDark ? "text-secondary-400" : "text-secondary-600"
        )}>
          {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} available
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative"
      >
        <Search className={cn(
          "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5",
          isDark ? "text-secondary-400" : "text-secondary-500"
        )} />
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={cn(
            "w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200",
            "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
            isDark
              ? "bg-secondary-800 border-secondary-600 text-white placeholder-secondary-400"
              : "bg-white border-secondary-300 text-secondary-900 placeholder-secondary-500"
          )}
        />
      </motion.div>

      {/* Contacts List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={cn(
          "rounded-2xl border",
          isDark
            ? "bg-secondary-800 border-secondary-700"
            : "bg-white border-secondary-200"
        )}
      >
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className={cn(
              "text-sm",
              isDark ? "text-secondary-400" : "text-secondary-600"
            )}>
              Loading contacts...
            </p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-8 text-center">
            <Users className={cn(
              "w-12 h-12 mx-auto mb-4",
              isDark ? "text-secondary-500" : "text-secondary-400"
            )} />
            <h3 className={cn(
              "text-lg font-medium mb-2",
              isDark ? "text-white" : "text-secondary-900"
            )}>
              {searchTerm ? 'No contacts found' : 'No contacts available'}
            </h3>
            <p className={cn(
              "text-sm",
              isDark ? "text-secondary-400" : "text-secondary-600"
            )}>
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'No other users are currently available'
              }
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
            {filteredContacts.map((contact) => (
              <Contact
                key={contact.id}
                contact={contact}
                onCall={handleCall}
                darkMode={darkMode}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ContactsPage;