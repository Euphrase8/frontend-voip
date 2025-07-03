import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Phone,
  Favorite,
  Contacts,
  History,
} from "@mui/icons-material";
import HomePage from "./HomePage";
import FavoritesPage from "./FavouritesPage";
import ContactsPage from "./ContactsPage";
import CallLogsPage from "./CallLogsPage";
import CallingPage from "./CallingPage";
import IncomingCallPage from "./IncomingCallPage";
import VoipPhone from "../components/VoipPhone";
import Sidebar from "../components/sidebar";
import TopNav from "../components/TopNav";
import { call, answerCall, hangupCall } from "../services/call";
import webrtcCallService from "../services/webrtcCallService";
import ConnectionStatus from "../components/ConnectionStatus";

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

const BottomNav = ({ currentPage, onNavigate }) => {
  const navItems = [
    { id: "keypad", label: "Keypad", icon: <Phone /> },
    { id: "favorites", label: "Favorites", icon: <Favorite /> },
    { id: "contacts", label: "Contacts", icon: <Contacts /> },
    { id: "calllogs", label: "Call Logs", icon: <History /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 p-2 flex justify-between bg-gray-800/80 shadow-2xl md:hidden z-40">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`p-3 flex flex-col items-center rounded-lg transition-all ${
            currentPage === item.id
              ? "text-white bg-blue-500/30"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {item.icon}
          <span className="text-xs">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

const DashboardPage = ({ user, onLogout, darkMode, toggleDarkMode, setIncomingCall }) => {
  const [contacts, setContacts] = useState(initialContacts);
  const [callStatus, setCallStatus] = useState(null);
  const [activeCallContact, setActiveCallContact] = useState(null);
  const [currentPage, setCurrentPage] = useState("keypad");
  const [notification, setNotification] = useState(null);
  const [incomingCall, setLocalIncomingCall] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

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
      const { message, priority, channel } = await call(contact.extension);
      setCallStatus("Connected");
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
      } catch (error) {
        console.error("[Dashboard] End call error:", error);
        setNotification({ message: "Failed to end call", type: "error" });
      }
    }
    setCallStatus(null);
    setActiveCallContact(null);
    setCurrentPage("keypad");
    navigate("/dashboard");
  };

  const toggleFavorite = (contactId) => {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId ? { ...c, isFavorite: !c.isFavorite } : c
      )
    );
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

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    try {
      setCallStatus(`Connecting to ${incomingCall.caller}...`);
      const { message } = await answerCall(incomingCall.channel);
      setCallStatus("Connected");
      setActiveCallContact({
        name: `Caller ${incomingCall.caller}`,
        extension: incomingCall.caller,
      });
      setCurrentPage("calling");
      navigate("/calling", {
        state: {
          contact: {
            name: `Caller ${incomingCall.caller}`,
            extension: incomingCall.caller,
          },
          callStatus: "Connected",
          isOutgoing: false,
          channel: incomingCall.channel,
        },
      });
    } catch (error) {
      console.error("[Dashboard] Accept call error:", error);
      setNotification({ message: error.message || "Failed to accept call", type: "error" });
    }
    setLocalIncomingCall(null);
    setIncomingCall(null);
  };

  const handleDeclineCall = async () => {
    if (!incomingCall) return;
    try {
      await hangupCall(incomingCall.channel);
      setNotification({
        message: `Declined call from ${incomingCall.caller}`,
        type: "info",
      });
    } catch (error) {
      console.error("[Dashboard] Decline call error:", error);
      setNotification({ message: "Failed to decline call", type: "error" });
    }
    setLocalIncomingCall(null);
    setIncomingCall(null);
  };

  return (
    <div
      className={`relative w-full min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 text-black"
      } overflow-hidden`}
    >
      {/* Animated Background Dots */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ top: "20%", left: "30%" }} />
        <div className="absolute w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-1000" style={{ top: "40%", right: "25%" }} />
        <div className="absolute w-4 h-4 bg-indigo-400 rounded-full animate-pulse delay-2000" style={{ bottom: "15%", left: "45%" }} />
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-16 right-4 z-50 p-3 rounded-lg shadow-lg ${
            notification.type === "success"
              ? "bg-green-500/80"
              : notification.type === "error"
              ? "bg-red-500/80"
              : "bg-blue-500/80"
          }`}
        >
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

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

      {/* Header & Sidebar */}
      <TopNav
        username={user?.username || "Guest"}
        extension={user?.extension}
        callStatus={callStatus}
        onLogout={handleLogout}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} darkMode={darkMode} />

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

      {/* Page Body */}
      <div className="flex-grow px-4 md:pl-[280px] py-4 pb-[60px]">
        <div className="glass-effect p-6 rounded-2xl shadow-xl mb-6 max-w-4xl mx-auto mt-12">
          <h1 className="text-2xl font-bold mb-2">
            Welcome{user?.extension ? ` (Ext: ${user.extension})` : ""}!
          </h1>
          <p>
            {callStatus
              ? `You're currently ${callStatus.toLowerCase()}.`
              : "Ready to make a call? Use the keypad or quick dial."}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {currentPage === "keypad" && (
            <div className="glass-effect p-6 rounded-2xl shadow-xl animate-fadeIn">
              <HomePage onCall={startCall} darkMode={darkMode} />
            </div>
          )}
          {currentPage === "favorites" && (
            <FavoritesPage
              contacts={contacts}
              onCall={startCall}
              onToggleFavorite={toggleFavorite}
              darkMode={darkMode}
            />
          )}
          {currentPage === "contacts" && (
            <ContactsPage
              onCall={startCall}
              darkMode={darkMode}
              userID={user?.username}
            />
          )}
          {currentPage === "calllogs" && <CallLogsPage darkMode={darkMode} />}
          {currentPage === "calling" && activeCallContact && (
            <CallingPage
              contact={activeCallContact}
              callStatus={callStatus}
              onEndCall={endCall}
              channel={`PJSIP/${activeCallContact.extension}`}
              darkMode={darkMode}
            />
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Connection Status Monitor */}
      <ConnectionStatus />
    </div>
  );
};

export default DashboardPage;
