import React, { useState, useEffect } from 'react';
import TopNav from '../components/TopNav';
import HomePage from './HomePage';
import FavoritesPage from './FavouritesPage';
import ContactsPage from './ContactsPage';
import RecentsPage from './RecentsPage';
import CallingPage from './CallingPage';
import CallLogsPage from './CallLogsPage';
import BottomNav from '../components/BottomNav';

const initialContacts = [
  { id: 1, name: 'John Doe', priority: 'high', status: 'online', avatar: 'https://via.placeholder.com/40/ef4444/fff?text=JD', isFavorite: true },
  { id: 2, name: 'Jane Smith', priority: 'medium', status: 'offline', avatar: 'https://via.placeholder.com/40/facc15/fff?text=JS', isFavorite: false },
  { id: 3, name: 'Alice Brown', priority: 'low', status: 'online', avatar: 'https://via.placeholder.com/40/22c55e/fff?text=AB', isFavorite: false },
];

const initialCallLogs = [
  { id: 1, contact: 'John Doe', time: '2025-05-04 10:30', duration: '5m 23s', status: 'Completed' },
  { id: 2, contact: 'Jane Smith', time: '2025-05-04 09:15', duration: '3m 10s', status: 'Missed' },
];

const DashboardPage = ({ user, onLogout }) => {
  const [contacts, setContacts] = useState(initialContacts);
  const [callStatus, setCallStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [callLogs] = useState(initialCallLogs);
  const [activeCallContact, setActiveCallContact] = useState(null);
  const [currentPage, setCurrentPage] = useState('keypad');

  useEffect(() => {
    const interval = setInterval(() => {
      setContacts((prev) =>
        prev.map((contact) => ({
          ...contact,
          status: Math.random() > 0.5 ? 'online' : 'offline',
        }))
      );
    }, 10000);
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
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      console.log('Offer:', offer);

      setCurrentPage('calling');

      setTimeout(() => {
        stream.getTracks().forEach((track) => track.stop());
        peerConnection.close();
        setCallStatus(null);
        setActiveCallContact(null);
        setCurrentPage('keypad');
        setIsLoading(false);
      }, 5000);
    } catch (error) {
      console.error('WebRTC error:', error);
      setCallStatus('Call failed');
      setTimeout(() => {
        setCallStatus(null);
        setActiveCallContact(null);
        setCurrentPage('keypad');
        setIsLoading(false);
      }, 2000);
    }
  };

  const endCall = () => {
    setCallStatus(null);
    setActiveCallContact(null);
    setCurrentPage('keypad');
    setIsLoading(false);
  };

  const toggleFavorite = (contactId) => {
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === contactId ? { ...contact, isFavorite: !contact.isFavorite } : contact
      )
    );
  };

  const navigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#36454F] overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute w-2 h-2 bg-white rounded-full animate-pulse" style={{ top: '15%', left: '25%' }}></div>
        <div className="absolute w-3 h-3 bg-white rounded-full animate-pulse delay-1000" style={{ top: '35%', right: '20%' }}></div>
        <div className="absolute w-2 h-2 bg-white rounded-full animate-pulse delay-2000" style={{ bottom: '20%', left: '35%' }}></div>
      </div>
      <div className="">
        <TopNav username={user?.username} callStatus={callStatus} onLogout={onLogout} />
        <div className="">
          <div className="text-center mb-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#F5DEB3] font-sans animate-fade-in">
              {currentPage === 'calling' ? 'Active Call' : currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
              {callStatus && <span className="ml-2 text-yellow-300 animate-pulse">📞 {callStatus}</span>}
            </h1>
          </div>
          <div className="space-y-6">
            {currentPage === 'keypad' && (
              <div className="w-full max-w-md mx-auto sm:max-w-lg lg:max-w-xl">
                <HomePage onCall={startCall} />
              </div>
            )}
            {['favorites', 'contacts', 'recents', 'calllogs'].includes(currentPage) && (
              <div className="lg:grid lg:grid-cols-1 lg:gap-8">
                {currentPage === 'favorites' && (
                  <div className="w-full max-w-2xl mx-auto">
                    <FavoritesPage contacts={contacts} onCall={startCall} onToggleFavorite={toggleFavorite} />
                  </div>
                )}
                {currentPage === 'contacts' && (
                  <div className="w-full max-w-2xl mx-auto">
                    <ContactsPage contacts={contacts} onCall={startCall} onToggleFavorite={toggleFavorite} />
                  </div>
                )}
                {currentPage === 'recents' && (
                  <div className="w-full max-w-2xl mx-auto">
                    <RecentsPage callLogs={callLogs} />
                  </div>
                )}
                {currentPage === 'calllogs' && (
                  <div className="w-full max-w-2xl mx-auto">
                    <CallLogsPage callLogs={callLogs} />
                  </div>
                )}
              </div>
            )}
            {currentPage === 'calling' && activeCallContact && callStatus && (
              <div className="w-full max-w-md mx-auto sm:max-w-lg lg:max-w-xl">
                <CallingPage contact={activeCallContact} callStatus={callStatus} onEndCall={endCall} />
              </div>
            )}
          </div>
        </div>
        <BottomNav currentPage={currentPage} onNavigate={navigate} />
      </div>
    </div>
  );
};

export default DashboardPage;