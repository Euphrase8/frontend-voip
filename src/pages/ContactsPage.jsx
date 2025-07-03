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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className={cn(
              'w-6 h-6',
              isDark ? 'text-primary-400' : 'text-primary-600'
            )} />
            <div>
              <h1 className={cn(
                'text-xl sm:text-2xl font-bold',
                isDark ? 'text-white' : 'text-secondary-900'
              )}>
                Contacts
              </h1>
              <p className={cn(
                'text-xs sm:text-sm',
                isDark ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            disabled={loading}
            className={cn(
              'p-2 rounded-lg transition-colors',
              loading && 'animate-spin',
              isDark
                ? 'bg-secondary-700 hover:bg-secondary-600 text-white'
                : 'bg-secondary-100 hover:bg-secondary-200 text-secondary-700'
            )}
            title="Refresh contacts"
          >
            <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b border-secondary-200 dark:border-secondary-700">
        <div className="relative">
          <Search className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5",
            isDark ? "text-secondary-400" : "text-secondary-500"
          )} />
          <input
            type="text"
            placeholder="Search contacts by name, extension, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 rounded-lg border transition-all duration-200",
              "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
              isDark
                ? "bg-secondary-800 border-secondary-600 text-white placeholder-secondary-400"
                : "bg-white border-secondary-300 text-secondary-900 placeholder-secondary-500"
            )}
          />
        </div>
      </div>

      {/* Contacts List - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-full overflow-y-auto"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
              <h3 className={cn(
                'text-lg font-medium mb-2',
                isDark ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                Loading contacts...
              </h3>
              <p className={cn(
                'text-sm',
                isDark ? 'text-secondary-500' : 'text-secondary-500'
              )}>
                Please wait while we fetch your contacts.
              </p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Users className={cn(
                "w-16 h-16 mb-4",
                isDark ? "text-secondary-600" : "text-secondary-400"
              )} />
              <h3 className={cn(
                "text-lg font-medium mb-2",
                isDark ? "text-secondary-400" : "text-secondary-600"
              )}>
                {searchTerm ? 'No contacts found' : 'No contacts available'}
              </h3>
              <p className={cn(
                "text-sm",
                isDark ? "text-secondary-500" : "text-secondary-500"
              )}>
                {searchTerm
                  ? 'Try adjusting your search terms or check the spelling.'
                  : 'No other users are currently registered in the system.'
                }
              </p>
            </div>
          ) : (
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {filteredContacts.map((contact) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: contact.id * 0.05 }}
                  className={cn(
                    'p-4 rounded-xl border transition-all duration-200 hover:shadow-md',
                    isDark
                      ? 'bg-secondary-800 border-secondary-700 hover:bg-secondary-750'
                      : 'bg-white border-secondary-200 hover:bg-secondary-50'
                  )}
                >
                  <Contact
                    contact={contact}
                    onCall={handleCall}
                    darkMode={isDark}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ContactsPage;