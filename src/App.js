import React, { useState } from 'react';
import LoginPage from './auth/LoginPage';
import RegisterPage from './auth/RegisterPage';
import HomePage from './pages/HomePage';
import ContactsPage from './pages/ContactsPage';
import CallLogsPage from './pages/CallLogsPage';
import CallingPage from './pages/CallingPage';
import Loader from './components/loader';
import DashboardPage from './pages/DashboardPage';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [callStatus, setCallStatus] = useState(null);
  const [activeCallContact, setActiveCallContact] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleRegister = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setShowRegister(false);
    setCurrentPage('home');
    setCallStatus(null);
    setActiveCallContact(null);
  };

  const switchToRegister = () => {
    setShowRegister(true);
  };

  const switchToLogin = () => {
    setShowRegister(false);
  };

  const navigate = (page) => {
    setCurrentPage(page);
  };

  const startCall = async (contact) => {
    setIsLoading(true);
    setActiveCallContact(contact);
    try {
      setCallStatus(`Initiating call to ${contact.name || `Ext ${contact.extension}`}...`);
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
        setCurrentPage('home');
        setIsLoading(false);
      }, 5000);
    } catch (error) {
      console.error('WebRTC error:', error);
      setCallStatus('Call failed');
      setTimeout(() => {
        setCallStatus(null);
        setActiveCallContact(null);
        setCurrentPage('home');
        setIsLoading(false);
      }, 2000);
    }
  };

  const endCall = () => {
    setCallStatus(null);
    setActiveCallContact(null);
    setCurrentPage('home');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-gray-100">
      {isLoggedIn ? (
        <div className="flex w-full h-screen">
          <div className="flex-1 flex flex-col w-full">
            {currentPage === 'home' && <DashboardPage onCall={startCall} />}
            {currentPage === 'contacts' && <ContactsPage onCall={startCall} />}
            {currentPage === 'callLogs' && <CallLogsPage />}
            {currentPage === 'calling' && (
              <CallingPage contact={activeCallContact} callStatus={callStatus} onEndCall={endCall} />
            )}
          </div>
          {isLoading && <Loader />}
        </div>
      ) : showRegister ? (
        <RegisterPage onRegister={handleRegister} onSwitchToLogin={switchToLogin} />
      ) : (
        <LoginPage onLogin={handleLogin} onSwitchToRegister={switchToRegister} />
      )}
    </div>
  );
};

export default App;