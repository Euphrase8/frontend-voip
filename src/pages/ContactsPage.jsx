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
import {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveCard,
  ResponsiveText,
  ResponsiveFlex,
  ResponsiveButton
} from '../components/ResponsiveLayout';

const Contact = ({ contact, onCall, darkMode }) => {
  const { darkMode: themeDarkMode } = useTheme();
  const isDark = darkMode || themeDarkMode;
  const isOnline = contact.status === 'online';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative rounded-xl border shadow-sm p-4 transition-all duration-300",
        "hover:shadow-lg cursor-pointer group",
        isDark
          ? "bg-secondary-800 border-secondary-700 hover:border-secondary-600"
          : "bg-white border-secondary-200 hover:border-secondary-300"
      )}
    >
      {/* Online Status Indicator */}
      <div className={cn(
        "absolute top-3 right-3 w-3 h-3 rounded-full border-2",
        isOnline
          ? "bg-green-500 border-white dark:border-secondary-800"
          : "bg-secondary-400 border-white dark:border-secondary-800"
      )} />

      <div className="flex items-center space-x-3 mb-3">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm",
          getAvatarColor(contact.username || contact.name)
        )}>
          {getInitials(contact.username || contact.name)}
        </div>
        <div className="flex-1 min-w-0">
          <ResponsiveText
            variant="bodyMedium"
            weight="semibold"
            className={cn(
              "truncate",
              isDark ? "text-white" : "text-secondary-900"
            )}
          >
            {contact.username || contact.name}
          </ResponsiveText>
          <ResponsiveText
            variant="caption"
            className={cn(
              "flex items-center space-x-1",
              isDark ? "text-secondary-400" : "text-secondary-600"
            )}
          >
            <Phone className="w-3 h-3" />
            <span>Ext: {contact.extension}</span>
          </ResponsiveText>
        </div>
      </div>

      {contact.email && (
        <ResponsiveText
          variant="caption"
          className={cn(
            "truncate mb-3 flex items-center space-x-1",
            isDark ? "text-secondary-500" : "text-secondary-500"
          )}
        >
          <User className="w-3 h-3" />
          <span>{contact.email}</span>
        </ResponsiveText>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isOnline ? "bg-green-500" : "bg-secondary-400"
          )} />
          <ResponsiveText
            variant="caption"
            className={cn(
              "text-xs font-medium",
              isOnline
                ? "text-green-600 dark:text-green-400"
                : "text-secondary-500"
            )}
          >
            {isOnline ? 'Online' : 'Offline'}
          </ResponsiveText>
        </div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <ResponsiveButton
            onClick={() => onCall(contact.extension)}
            variant="primary"
            size="sm"
            className={cn(
              "shadow-sm hover:shadow-md transition-all duration-200",
              "group-hover:scale-105"
            )}
            aria-label={`Call ${contact.username || contact.name}`}
          >
            <PhoneCall className="w-4 h-4" />
          </ResponsiveButton>
        </motion.div>
      </div>
    </motion.div>
  );
};

const ContactsPage = ({ darkMode = false, onCall, userID }) => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { darkMode: themeDarkMode } = useTheme();
  const isDark = darkMode || themeDarkMode;

  useEffect(() => {
    fetchContacts();
  }, []);

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
          status: user.online ? 'online' : 'offline', // Add status based on online field
        }));

      setContacts(filtered);
    } catch (error) {
      console.error('Error fetching users:', error.message);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchContacts();
    setRefreshing(false);
    toast.success('Contacts refreshed');
  };

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
    <div className="h-full flex flex-col">
      {/* Professional Search Bar */}
      <div className="flex-shrink-0 p-4 lg:p-6 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ResponsiveText variant="caption" color="muted">
              {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} available
            </ResponsiveText>
          </div>
          <ResponsiveButton
            onClick={handleRefresh}
            disabled={loading || refreshing}
            variant="secondary"
            size="sm"
            className={cn(
              (loading || refreshing) && 'animate-spin'
            )}
            title="Refresh contacts"
          >
            <PhoneCall className="w-4 h-4" />
          </ResponsiveButton>
        </div>

        <div className="relative">
          <Search className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4",
            isDark ? "text-secondary-400" : "text-secondary-500"
          )} />
          <input
            type="text"
            placeholder="Search contacts by name, extension, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-lg border transition-all duration-200",
              "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
              "text-sm",
              isDark
                ? "bg-secondary-900 border-secondary-600 text-white placeholder-secondary-400"
                : "bg-white border-secondary-300 text-secondary-900 placeholder-secondary-500"
            )}
          />
        </div>
      </div>

      {/* Contacts List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6">
          {loading ? (
            <ResponsiveFlex direction="col" align="center" justify="center" className="h-64 text-center">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
              <ResponsiveText variant="bodyMedium" className={cn(
                'mb-2',
                isDark ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                Loading contacts...
              </ResponsiveText>
              <ResponsiveText variant="caption" className={isDark ? 'text-secondary-500' : 'text-secondary-500'}>
                Please wait while we fetch your contacts.
              </ResponsiveText>
            </ResponsiveFlex>
          ) : filteredContacts.length === 0 ? (
            <ResponsiveFlex direction="col" align="center" justify="center" className="h-64 text-center">
              <Users className={cn(
                "w-16 h-16 mb-4",
                isDark ? "text-secondary-600" : "text-secondary-400"
              )} />
              <ResponsiveText variant="bodyMedium" className={cn(
                "mb-2",
                isDark ? "text-secondary-400" : "text-secondary-600"
              )}>
                {searchTerm ? 'No contacts found' : 'No contacts available'}
              </ResponsiveText>
              <ResponsiveText variant="caption" className={isDark ? "text-secondary-500" : "text-secondary-500"}>
                {searchTerm
                  ? 'Try adjusting your search terms or check the spelling.'
                  : 'No other users are currently registered in the system.'
                }
              </ResponsiveText>
            </ResponsiveFlex>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredContacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
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
        </div>
      </div>
    </div>
  );
};

export default ContactsPage;