import React, { useState, useEffect } from 'react';
import TopNav from '../components/TopNav';

// Mock contacts data
const initialContacts = [
  { id: 1, name: 'John Doe', priority: 'high', status: 'online', avatar: 'https://via.placeholder.com/40/ef4444/fff?text=JD' },
  { id: 2, name: 'Jane Smith', priority: 'medium', status: 'offline', avatar: 'https://via.placeholder.com/40/facc15/fff?text=JS' },
  { id: 3, name: 'Alice Brown', priority: 'low', status: 'online', avatar: 'https://via.placeholder.com/40/22c55e/fff?text=AB' },
];

// Mock call logs data
const initialCallLogs = [
  { id: 1, contact: 'John Doe', time: '2025-05-04 10:30', duration: '5m 23s', status: 'Completed' },
  { id: 2, contact: 'Jane Smith', time: '2025-05-04 09:15', duration: '3m 10s', status: 'Missed' },
];

const Contact = ({ contact, onCall }) => {
  const priorityColor = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  return (
    <div className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-xl shadow-md mb-3 transform transition-all duration-200 hover:shadow-lg animate-fade-in">
      <div className="flex items-center space-x-3 sm:space-x-4">
        <img
          src={contact.avatar}
          alt={`${contact.name}'s avatar`}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
        />
        <div>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${priorityColor[contact.priority]} animate-pulse`} aria-hidden="true"></span>
            <span className="text-gray-800 font-medium text-sm sm:text-base">{contact.name}</span>
          </div>
          <span className={`text-xs sm:text-sm ${contact.status === 'online' ? 'text-green-600' : 'text-gray-500'}`}>
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

const CallLog = ({ log }) => (
  <div className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-xl shadow-md mb-3 animate-fade-in">
    <div className="flex items-center space-x-3 sm:space-x-4">
      <span className="text-gray-800 font-medium text-sm sm:text-base">{log.contact}</span>
      <span className="text-xs sm:text-sm text-gray-500">{log.time}</span>
    </div>
    <div className="flex items-center space-x-2 sm:space-x-4">
      <span className="text-xs sm:text-sm text-gray-600">{log.duration}</span>
      <span className={`text-xs sm:text-sm ${log.status === 'Completed' ? 'text-green-600' : 'text-red-600'}`}>
        {log.status}
      </span>
    </div>
  </div>
);

const DashboardPage = ({ user, onLogout }) => {
  const [contacts, setContacts] = useState(initialContacts);
  const [callStatus, setCallStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [callLogs] = useState(initialCallLogs);
  const [activeCallContact, setActiveCallContact] = useState(null);

  // Simulate real-time status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setContacts((prev) =>
        prev.map((contact) => ({
          ...contact,
          status: Math.random() > 0.5 ? 'online' : 'offline',
        }))
      );
    }, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const startCall = async (contact) => {
    setIsLoading(true);
    setActiveCallContact(contact);
    try {
      setCallStatus(`Initiating call to ${contact.name}...`);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const peerConnection = new RTCPeerConnection();

      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('ICE candidate:', event.candidate);
          // Replace with signaling server send
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      console.log('Offer:', offer);
      // Replace with signaling server send

      // Simulate call end after 5 seconds
      setTimeout(() => {
        stream.getTracks().forEach((track) => track.stop());
        peerConnection.close();
        setCallStatus(null);
        setActiveCallContact(null);
        setIsLoading(false);
      }, 5000);
    } catch (error) {
      console.error('WebRTC error:', error);
      setCallStatus('Call failed');
      setActiveCallContact(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full h-screen bg-gradient-to-br from-gray-100 to-blue-50">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1 flex flex-col w-full">
        <TopNav user={user} callStatus={callStatus} />
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {activeCallContact && callStatus && (
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 animate-slide-up flex items-center space-x-4">
              <img
                src={activeCallContact.avatar}
                alt={`${activeCallContact.name}'s avatar`}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover animate-pulse"
              />
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{callStatus}</h3>
                <p className="text-sm text-gray-600">Calling {activeCallContact.name}</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 flex items-center space-x-2">
                <span className="animate-bounce">📇</span>
                <span>Contacts</span>
              </h2>
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <Contact key={contact.id} contact={contact} onCall={startCall} />
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 flex items-center space-x-2">
                <span className="animate-bounce">📜</span>
                <span>Call Logs</span>
              </h2>
              <div className="space-y-3">
                {callLogs.map((log) => (
                  <CallLog key={log.id} log={log} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {isLoading && <Loader />}
    </div>
  );
};

// Reused components from previous artifacts
const Loader = () => (
  <div
    className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50"
    role="status"
    aria-label="Loading"
  >
    <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const Sidebar = ({ user, onLogout }) => (
  <div className="w-16 sm:w-64 bg-gray-900 text-white h-screen p-2 sm:p-4 flex flex-col">
    <div className="mb-4 sm:mb-6">
      <h2 className="text-lg sm:text-xl font-bold hidden sm:block">VoIP App</h2>
      <p className="text-xs sm:text-sm text-gray-400 truncate">{user.username}</p>
    </div>
    <nav className="flex-1">
      <ul className="space-y-1 sm:space-y-2">
        <li>
          <button
            className="w-full text-left p-1 sm:p-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-base"
            aria-label="Navigate to Contacts"
          >
            <span className="block sm:hidden animate-pulse">📇</span>
            <span className="hidden sm:block">Contacts</span>
          </button>
        </li>
        <li>
          <button
            className="w-full text-left p-1 sm:p-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-base"
            aria-label="Navigate to Call Logs"
          >
            <span className="block sm:hidden animate-pulse">📜</span>
            <span className="hidden sm:block">Call Logs</span>
          </button>
        </li>
      </ul>
    </nav>
    <button
      onClick={onLogout}
      className="mt-auto bg-red-500 text-white p-1 sm:p-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs sm:text-base"
      aria-label="Log out"
    >
      <span className="block sm:hidden animate-pulse">🚪</span>
      <span className="hidden sm:block">Logout</span>
    </button>
  </div>
);



export default DashboardPage;