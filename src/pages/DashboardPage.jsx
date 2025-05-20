import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  Phone,
  Favorite,
  Contacts,
  History,
  DarkMode,
 
} from "@mui/icons-material";
import HomePage from "./HomePage";
import FavoritesPage from "./FavouritesPage";
import ContactsPage from "./ContactsPage";
import CallLogsPage from "./CallLogsPage";
import CallingPage from "./CallingPage";
import VoipPhone from "../components/VoipPhone";
import IncomingCallPage from "./IncomingCallPage";
import Sidebar from "../components/sidebar";
import TopNav from "../components/TopNav";
// import VoipPhone from "../components/VoipPhone";

// Initial contact data for quick dial and favorites
const initialContacts = [
  {
    id: 1,
    name: "John Doe",
    priority: "high",
    status: "online",
    avatar: "https://via.placeholder.com/40/ef4444/fff?text=JD",
    isFavorite: true,
    extension: "1001",
  },
  {
    id: 2,
    name: "Jane Smith",
    priority: "medium",
    status: "offline",
    avatar: "https://via.placeholder.com/40/facc15/fff?text=JS",
    isFavorite: false,
    extension: "1002",
  },
  {
    id: 3,
    name: "Alice Brown",
    priority: "low",
    status: "online",
    avatar: "https://via.placeholder.com/40/22c55e/fff?text=AB",
    isFavorite: false,
    extension: "1003",
  },
];

// Initial call log data (unused but retained for reference)
const initialCallLogs = [
  {
    id: 1,
    contact: "John Doe",
    time: "2025-05-04 10:30",
    duration: "5m 23s",
    status: "Completed",
  },
  {
    id: 2,
    contact: "Jane Smith",
    time: "2025-05-04 09:15",
    duration: "3m 10s",
    status: "Missed",
  },
];

// TopNav: Top navigation bar with user info, quick dial, dark mode toggle, and logout
<TopNav />

// BottomNav: Navigation bar for small devices, visible below md breakpoint
const BottomNav = ({ currentPage, onNavigate }) => {
  const navItems = [
    { id: "keypad", label: "Keypad", icon: <Phone /> },
    { id: "favorites", label: "Favorites", icon: <Favorite /> },
    { id: "contacts", label: "Contacts", icon: <Contacts /> },
    { id: "calllogs", label: "Call Logs", icon: <History /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-effect p-2 xs:p-3 sm:p-3 flex justify-between gap-1 xs:gap-2 sm:gap-3 bg-gray-800/80 shadow-2xl animate-[fadeInUp_0.8s_ease-out_forwards] md:hidden">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`p-3 xs:p-3 sm:p-4 rounded-lg flex flex-col items-center transition-all transform hover:scale-110 min-w-[48px] min-h-[48px] ${
            currentPage === item.id
              ? "text-white bg-blue-500/30"
              : DarkMode
              ? "text-white hover:text-white"
              : "text-black hover:text-white"
          }`}
          aria-label={`Navigate to ${item.label}`}
        >
          {item.icon}
          <span className="text-xs xs:text-sm">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

// Sidebar: Sidebar for navigation, visible at md and above
<Sidebar />

// DashboardPage: Main dashboard component managing navigation and call states
const DashboardPage = ({ user, onLogout }) => {
  // State management
  const [contacts, setContacts] = useState(initialContacts);
  const [callStatus, setCallStatus] = useState(null);
  const [activeCallContact, setActiveCallContact] = useState(null);
  const [currentPage, setCurrentPage] = useState("keypad");
  const [darkMode, setDarkMode] = useState(false);
  const [notification, setNotification] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // WebSocket for incoming calls
  useEffect(() => {
    const ws = new WebSocket("ws://192.168.1.164:8080/ws?extension=" + user?.extension);
    ws.onopen = () => console.log("WebSocket connected");
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "offer" && message.to === user?.extension) {
        setIncomingCall({
          caller: message.from,
          channel: message.channel,
          offer: message.offer,
          priority: message.priority,
        });
      }
    };
    ws.onclose = () => console.log("WebSocket disconnected");
    // return () => ws.close();
  }, [user?.extension]);

  // Handle login success notification
  useEffect(() => {
    if (location.state?.success) {
      setNotification({
        message: `${location.state.success}${
          user?.extension ? ` (Ext: ${user.extension})` : ""
        }`,
        type: "success",
      });
      setTimeout(() => setNotification(null), 3000);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, user?.extension]);

  // Update contact statuses periodically
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

  // Show call status notifications
  useEffect(() => {
    if (callStatus) {
      setNotification({
        message: callStatus,
        type:
          callStatus === "Connected"
            ? "success"
            : callStatus === "Call failed"
            ? "error"
            : "info",
      });
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [callStatus]);

  // Initiate an outgoing call
  const startCall = async (contact) => {
    setActiveCallContact(contact);
    try {
      setCallStatus(`Initiating call to ${contact.name}...`);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
        ],
      });
      stream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, stream));

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // ICE candidate handling
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      setTimeout(() => {
        setCallStatus("Connected");
        setCurrentPage("calling");
      }, 2000);

      setTimeout(() => {
        stream.getTracks().forEach((track) => track.stop());
        peerConnection.close();
        setCallStatus(null);
        setActiveCallContact(null);
        setCurrentPage("keypad");
      }, 5000);
    } catch (error) {
      console.error("WebRTC error:", error);
      setCallStatus("Call failed");
      setTimeout(() => {
        setCallStatus(null);
        setActiveCallContact(null);
        setCurrentPage("keypad");
      }, 2000);
    }
  };

  // End an active call
  const endCall = () => {
    setCallStatus(null);
    setActiveCallContact(null);
    setCurrentPage("keypad");
  };

  // Toggle favorite status for a contact
  const toggleFavorite = (contactId) => {
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === contactId
          ? { ...contact, isFavorite: !contact.isFavorite }
          : contact
      )
    );
  };

  // Navigate to a page, mapping 'home' to 'keypad'
  const navigateTo = (page) => {
    setCurrentPage(page === "home" ? "keypad" : page);
  };

  // Toggle dark/light mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setContacts(initialContacts);
    setCallStatus(null);
    setActiveCallContact(null);
    setCurrentPage("keypad");
    setNotification({ message: "Logged out successfully", type: "info" });
    setTimeout(() => {
      if (typeof onLogout === "function") {
        onLogout();
      } else {
        console.warn("onLogout is not a function, skipping call");
      }
      navigate("/login");
    }, 1000);
  };

  // Handle incoming call acceptance
  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    try {
      setCallStatus(`Connecting to ${incomingCall.caller}...`);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
        ],
      });
      stream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, stream));

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      );
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // Send answer via WebSocket (implement server-side)
      console.log("Sending answer:", answer);

      setTimeout(() => {
        setCallStatus("Connected");
        setCurrentPage("calling");
        setActiveCallContact({
          name: `Caller ${incomingCall.caller}`,
          extension: incomingCall.caller,
        });
        setIncomingCall(null);
      }, 2000);
    } catch (error) {
      console.error("Accept call error:", error);
      setNotification({ message: "Failed to accept call", type: "error" });
      setIncomingCall(null);
    }
  };

  // Handle incoming call decline
  const handleDeclineCall = () => {
    setNotification({
      message: `Declined call from ${incomingCall.caller}`,
      type: "info",
    });
    setIncomingCall(null);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div
      className={`relative w-full min-h-screen ${
        darkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700"
      } ${darkMode ? "text-white" : "text-black"} overflow-hidden`}
    >
      {/* Decorative background dots */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute w-3 h-3 bg-blue-400 rounded-full animate-pulse"
          style={{ top: "20%", left: "30%" }}
        ></div>
        <div
          className="absolute w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-1000"
          style={{ top: "40%", right: "25%" }}
        ></div>
        <div
          className="absolute w-4 h-4 bg-indigo-400 rounded-full animate-pulse delay-2000"
          style={{ bottom: "15%", left: "45%" }}
        ></div>
      </div>
      {/* Notification toast for call status and login/logout */}
      {notification && (
        <div
          className={`fixed top-16 right-2 xs:right-4 z-50 glass-effect p-2 xs:p-3 rounded-lg shadow-lg animate-[fadeInUp_0.6s_ease-out_forwards] ${
            notification.type === "success"
              ? "bg-green-500/80"
              : notification.type === "error"
              ? "bg-red-500/80"
              : "bg-blue-500/80"
          }`}
          role="alert"
          aria-live="polite"
        >
          <span className={`text-xs xs:text-sm font-medium ${darkMode ? "text-white" : "text-black"}`}>
            {notification.message}
          </span>
        </div>
      )}
      {/* Incoming call modal */}
      {incomingCall && (
        <IncomingCallPage
          caller={incomingCall.caller}
          channel={incomingCall.channel}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
          darkMode={darkMode}
        />
      )}
      {/* Top navigation bar */}
      <TopNav
        username={user?.username || "Guest"}
        extension={user?.extension}
        callStatus={callStatus}
        onLogout={handleLogout}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onQuickDial={startCall}
        contacts={contacts}
      />
      {/* Sidebar for page navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigateTo}
        darkMode={darkMode}
      />
      {/* Main content area */}
      <div className="flex-grow px-4 xs:px-6 sm:px-8 md:pl-[280px] py-4 xs:py-5 sm:py-6 pb-[60px] overflow-y-auto">
        <div className="glass-effect p-4 xs:p-5 sm:p-6 rounded-2xl mt-12 shadow-xl mb-4 xs:mb-5 sm:mb-6 w-full max-w-[90vw] xs:max-w-[85vw] sm:max-w-[80vw] md:max-w-3xl mx-auto">
          <h1
            className={`text-xl xs:text-2xl sm:text-3xl font-bold mb-2 ${
              darkMode ? "text-white" : "text-black"
            }`}
          >
            Welcome{user?.extension ? ` (Ext: ${user.extension})` : ""}!
          </h1>
          <p
            className={`text-xs xs:text-sm sm:text-base ${
              darkMode ? "text-white" : "text-black"
            }`}
          >
            {callStatus
              ? `You're currently ${callStatus.toLowerCase()}.`
              : "Ready to make a call? Use the keypad or quick dial."}
          </p>
        </div>
        <div className="w-full max-w-[90vw] xs:max-w-[85vw] sm:max-w-[80vw] md:max-w-3xl mx-auto">
          {currentPage === "keypad" && (
            <div className="glass-effect p-4 xs:p-5 sm:p-6 rounded-2xl shadow-xl animate-[fadeInUp_1s_ease-out_forwards]">
              <HomePage onCall={startCall} darkMode={darkMode} />
            </div>
          )}
          {["favorites", "contacts", "calllogs"].includes(currentPage) && (
            <div className="glass-effect p-4 xs:p-5 sm:p-6 rounded-2xl shadow-xl animate-[fadeInUp_1s_ease-out_forwards]">
              {currentPage === "favorites" && (
                <FavoritesPage
                  contacts={contacts}
                  onCall={startCall}
                  onToggleFavorite={toggleFavorite}
                  darkMode={darkMode}
                />
              )}
              {currentPage === "callings" && (
                <VoipPhone
                  // contacts={contacts}
                  // onCall={startCall}
                  // onToggleFavorite={toggleFavorite}
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
              {currentPage === "calllogs" && (
                <CallLogsPage darkMode={darkMode} />
              )}
            </div>
          )}
          {currentPage === "calling" && activeCallContact && callStatus && (
            <div className="animate-[fadeInUp_1s_ease-out_forwards]">
              <CallingPage
                contact={activeCallContact}
                callStatus={callStatus}
                onEndCall={endCall}
                channel={`PJSIP/${activeCallContact.extension}`}
                darkMode={darkMode}
              />
            </div>
          )}
        </div>
      </div>
      {/* Bottom navigation for small devices */}
      <BottomNav currentPage={currentPage} onNavigate={navigateTo} />
    </div>
  );
};

export default DashboardPage;