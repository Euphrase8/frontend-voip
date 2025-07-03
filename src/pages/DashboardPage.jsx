import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiPhone as Phone,
  FiSettings as Settings,
  FiUsers as Users,
  FiClock as Clock,
  FiGrid as Grid,
  FiLogOut as LogOut,
  FiBell as Bell,

} from "react-icons/fi";
import HomePage from "./HomePage";
import SettingsPage from "./SettingsPage";
import ContactsPage from "./ContactsPage";
import CallLogsPage from "./CallLogsPage";
import CallingPage from "./CallingPage";
import IncomingCallPage from "./IncomingCallPage";
import SettingsModal from "../components/SettingsModal";
import NotificationsPage from "./NotificationsPage";

import { call, hangupCall } from "../services/call";
import webrtcCallService from "../services/webrtcCallService";
import ConnectionStatus from "../components/ConnectionStatus";
import { useTheme } from "../contexts/ThemeContext";
import notificationService from "../utils/notificationService";
import { cn } from "../utils/ui";

const initialContacts = [
  {
    id: 1,
    name: "John Doe",
    priority: "high",
    status: "online",
    avatar: null,
    isFavorite: true,
    extension: "1001",
  },
  {
    id: 2,
    name: "Jane Smith",
    priority: "medium",
    status: "offline",
    avatar: null,
    isFavorite: false,
    extension: "1002",
  },
  {
    id: 3,
    name: "Alice Brown",
    priority: "low",
    status: "online",
    avatar: null,
    isFavorite: false,
    extension: "1003",
  },
];

const BottomNav = ({ currentPage, onNavigate, isDarkMode }) => {
  const navItems = [
    { id: "keypad", label: "Keypad", icon: Phone },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "calllogs", label: "Call Logs", icon: Clock },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 lg:hidden z-40 safe-area-bottom",
        "border-t",
        isDarkMode
          ? "bg-secondary-900 border-secondary-700"
          : "bg-white border-secondary-200"
      )}
    >
      <div className="flex justify-around items-center py-2 px-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1",
                isActive
                  ? cn(
                      "bg-primary-500 text-white",
                      isDarkMode && "bg-primary-600"
                    )
                  : cn(
                      "text-secondary-500 hover:text-primary-600 hover:bg-primary-50",
                      isDarkMode && "text-secondary-400 hover:text-primary-400 hover:bg-secondary-800"
                    )
              )}
            >
              <Icon className="w-4 h-4 mb-1 flex-shrink-0" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

const DashboardPage = ({ user, onLogout, darkMode, setIncomingCall }) => {
  const { darkMode: themeDarkMode, toggleDarkMode } = useTheme();
  const [contacts, setContacts] = useState(initialContacts);
  const [callStatus, setCallStatus] = useState(null);
  const [activeCallContact, setActiveCallContact] = useState(null);
  const [currentPage, setCurrentPage] = useState("keypad");
  const [notification, setNotification] = useState(null);
  const [incomingCall, setLocalIncomingCall] = useState(null);
  const [showSettings, setShowSettings] = useState(false);


  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Use theme context dark mode if available, fallback to prop
  const isDarkMode = themeDarkMode !== undefined ? themeDarkMode : darkMode;

  // Update unread notification count
  useEffect(() => {
    const updateUnreadCount = () => {
      setUnreadCount(notificationService.getUnreadCount());
    };

    // Initial count
    updateUnreadCount();

    // Listen for changes
    const unsubscribe = notificationService.addListener(() => {
      updateUnreadCount();
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (location.state?.success) {
      setNotification({
        message: `${location.state.success}${user?.extension ? ` (Ext: ${user.extension})` : ""}`,
        type: "success",
      });
      setTimeout(() => setNotification(null), 3000);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, user?.extension]);

  // Initialize WebRTC service
  useEffect(() => {
    if (user?.extension) {
      console.log('[Dashboard] Initializing WebRTC service for extension:', user.extension);

      webrtcCallService.initialize(
        user.extension,
        (incomingCallData) => {
          console.log('[Dashboard] Incoming WebRTC call:', incomingCallData);
          setLocalIncomingCall(incomingCallData);
          setNotification({
            message: `Incoming call from ${incomingCallData.fromUsername || incomingCallData.from}`,
            type: "info"
          });
        },
        (status) => {
          console.log('[Dashboard] WebRTC call status:', status);
          setCallStatus(status);
        }
      );

      return () => {
        webrtcCallService.cleanup();
      };
    }
  }, [user?.extension]);

  useEffect(() => {
    const interval = setInterval(() => {
      setContacts((prev) =>
        prev.map((contact) => ({
          ...contact,
          status: Math.random() > 0.5 ? "online" : "offline",
        }))
      );
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (callStatus) {
      const type =
        callStatus === "Connected"
          ? "success"
          : callStatus === "Call failed"
          ? "error"
          : "info";
      setNotification({ message: callStatus, type });
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [callStatus]);

  const startCall = async (contact) => {
    setActiveCallContact(contact);
    try {
      setCallStatus(`Initiating call to ${contact.name}...`);

      // Add notification for call attempt
      notificationService.addNotification(
        'info',
        'Initiating Call',
        `Calling ${contact.name || contact.extension}...`
      );

      const { channel } = await call(contact.extension);
      setCallStatus("Connected");

      // Add notification for successful connection
      notificationService.callConnected(contact.extension);

      setCurrentPage("calling");
      navigate("/calling", {
        state: {
          contact,
          callStatus: "Connected",
          isOutgoing: true,
          channel,
        },
      });
    } catch (error) {
      console.error("[Dashboard] Call error:", error);
      setCallStatus("Call failed");

      // Add notification for call failure
      notificationService.callFailed(contact.extension, error.message);

      setTimeout(() => {
        setCallStatus(null);
        setActiveCallContact(null);
        setCurrentPage("keypad");
      }, 2000);
    }
  };

  const endCall = async () => {
    if (activeCallContact && callStatus) {
      try {
        await hangupCall(`PJSIP/${activeCallContact.extension}`);

        // Add notification for call ended
        notificationService.callEnded(activeCallContact.extension, 'Unknown duration');
      } catch (error) {
        console.error("[Dashboard] End call error:", error);
        setNotification({ message: "Failed to end call", type: "error" });

        // Add notification for end call failure
        notificationService.addNotification(
          'error',
          'End Call Failed',
          `Failed to end call with ${activeCallContact.extension}: ${error.message}`
        );
      }
    }
    setCallStatus(null);
    setActiveCallContact(null);
    setCurrentPage("keypad");
    navigate("/dashboard");
  };



  const handleLogout = () => {
    localStorage.removeItem("token");
    setContacts(initialContacts);
    setCallStatus(null);
    setActiveCallContact(null);
    setCurrentPage("keypad");
    setNotification({ message: "Logged out successfully", type: "info" });
    setTimeout(() => {
      if (typeof onLogout === "function") onLogout();
      navigate("/login");
    }, 1000);
  };



  return (
    <div className={cn(
      "h-screen w-screen overflow-hidden flex flex-col",
      isDarkMode
        ? "bg-secondary-900"
        : "bg-slate-50"
    )}>
      {/* Incoming Call UI */}
      {incomingCall && (
        <IncomingCallPage
          callData={{
            from: (incomingCall?.caller || incomingCall?.from),
            channel: (incomingCall?.channel || incomingCall?.callId),
            priority: (incomingCall?.priority || 'normal'),
            transport: (incomingCall?.transport || 'transport-ws')
          }}
          contacts={contacts}
          user={user}
          darkMode={darkMode}
          onCallAccepted={() => {
            setLocalIncomingCall(null);
            if (setIncomingCall) setIncomingCall(null);
          }}
          onCallRejected={() => {
            setLocalIncomingCall(null);
            if (setIncomingCall) setIncomingCall(null);
          }}
        />
      )}

      {/* Fixed Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "flex-shrink-0 z-30 border-b",
          isDarkMode
            ? "bg-secondary-900 border-secondary-700"
            : "bg-white border-secondary-200"
        )}
      >
        <div className="flex items-center justify-between px-4 lg:px-6 py-3 h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className={cn(
                "text-lg font-semibold",
                isDarkMode ? "text-white" : "text-secondary-900"
              )}>
                VoIP Dashboard
              </h1>
              <p className={cn(
                "text-xs",
                isDarkMode ? "text-secondary-400" : "text-secondary-600"
              )}>
                {user?.username} (Ext: {user?.extension})
              </p>
            </div>
          </div>

          {/* Center Section - Call Status */}
          {callStatus && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium",
                callStatus.includes("Connected")
                  ? "bg-success-100 text-success-700"
                  : "bg-warning-100 text-warning-700"
              )}
            >
              <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
              <span>{callStatus}</span>
            </motion.div>
          )}

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage("notifications")}
              className={cn(
                "p-2 rounded-lg transition-colors relative",
                currentPage === "notifications"
                  ? "bg-primary-100 text-primary-600"
                  : isDarkMode
                    ? "hover:bg-secondary-800 text-secondary-400 hover:text-white"
                    : "hover:bg-secondary-100 text-secondary-600 hover:text-secondary-900"
              )}
              title="Notifications & Logs"
            >
              <Bell className="w-4 h-4" />
              {/* Notification badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isDarkMode
                  ? "hover:bg-secondary-800 text-secondary-400 hover:text-white"
                  : "hover:bg-secondary-100 text-secondary-600 hover:text-secondary-900"
              )}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg transition-colors text-danger-600 hover:bg-danger-50"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Notification Display */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            "fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm",
            notification.type === 'success' ? 'bg-success-500 text-white' :
            notification.type === 'error' ? 'bg-danger-500 text-white' :
            'bg-primary-500 text-white'
          )}
        >
          <p className="text-sm font-medium">{notification.message}</p>
        </motion.div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Fixed Sidebar */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={cn(
            "hidden lg:flex flex-col w-64 border-r flex-shrink-0",
            isDarkMode
              ? "bg-secondary-900 border-secondary-700"
              : "bg-white border-secondary-200"
          )}
        >
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {[
              { id: "keypad", label: "Keypad", icon: Grid },
              { id: "settings", label: "Settings", icon: Settings },
              { id: "contacts", label: "Contacts", icon: Users },
              { id: "calllogs", label: "Call Logs", icon: Clock },
              { id: "notifications", label: "Notifications", icon: Bell },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left text-sm",
                    isActive
                      ? cn(
                          "bg-primary-500 text-white shadow-md",
                          isDarkMode && "bg-primary-600"
                        )
                      : cn(
                          "text-secondary-600 hover:text-primary-600 hover:bg-primary-50",
                          isDarkMode && "text-secondary-400 hover:text-primary-400 hover:bg-secondary-800"
                        )
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </motion.button>
              );
            })}
          </nav>
        </motion.aside>

        {/* Incoming Call Modal */}
        {incomingCall && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4">
              <div className="text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Phone className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Incoming Call</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {incomingCall.fromUsername || `Extension ${incomingCall.from}`}
                  </p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      incomingCall.onAccept();
                      setLocalIncomingCall(null);
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => {
                      incomingCall.onReject();
                      setLocalIncomingCall(null);
                    }}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full min-h-0"
            >
              {currentPage === "keypad" && (
                <div className={cn(
                  "h-full rounded-xl border overflow-hidden",
                  isDarkMode
                    ? "bg-secondary-800 border-secondary-700"
                    : "bg-white border-secondary-200"
                )}>
                  <div className="p-4 lg:p-6 h-full overflow-hidden">
                    <HomePage onCall={startCall} darkMode={isDarkMode} />
                  </div>
                </div>
              )}
              {currentPage === "settings" && (
                <div className={cn(
                  "h-full rounded-xl border",
                  isDarkMode
                    ? "bg-secondary-800 border-secondary-700"
                    : "bg-white border-secondary-200"
                )}>
                  <SettingsPage
                    darkMode={isDarkMode}
                    onToggleDarkMode={toggleDarkMode}
                    user={user}
                  />
                </div>
              )}
              {currentPage === "contacts" && (
                <div className={cn(
                  "h-full rounded-xl border",
                  isDarkMode
                    ? "bg-secondary-800 border-secondary-700"
                    : "bg-white border-secondary-200"
                )}>
                  <div className="p-4 lg:p-6 h-full">
                    <ContactsPage
                      onCall={startCall}
                      darkMode={isDarkMode}
                      userID={user?.username}
                    />
                  </div>
                </div>
              )}
              {currentPage === "calllogs" && (
                <div className={cn(
                  "h-full rounded-xl border",
                  isDarkMode
                    ? "bg-secondary-800 border-secondary-700"
                    : "bg-white border-secondary-200"
                )}>
                  <div className="p-4 lg:p-6 h-full">
                    <CallLogsPage darkMode={isDarkMode} user={user} onCall={(extension) => startCall({ extension, name: `Extension ${extension}` })} />
                  </div>
                </div>
              )}
              {currentPage === "notifications" && (
                <div className={cn(
                  "h-full rounded-xl border",
                  isDarkMode
                    ? "bg-secondary-800 border-secondary-700"
                    : "bg-white border-secondary-200"
                )}>
                  <NotificationsPage darkMode={isDarkMode} user={user} />
                </div>
              )}
              {currentPage === "calling" && activeCallContact && (
                <CallingPage
                  contact={activeCallContact}
                  callStatus={callStatus}
                  onEndCall={endCall}
                  channel={`PJSIP/${activeCallContact.extension}`}
                  darkMode={isDarkMode}
                />
              )}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} isDarkMode={isDarkMode} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        darkMode={isDarkMode}
      />





      {/* Connection Status Monitor */}
      <ConnectionStatus />
    </div>
  );
};

export default DashboardPage;
