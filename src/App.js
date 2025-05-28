import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ServerCheckPage from './pages/ServerCheckPage';
import LoginPage from './auth/LoginPage';
import RegisterPage from './auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ContactsPage from './pages/ContactsPage';
import CallLogsPage from './pages/CallLogsPage';
import CallingPage from './pages/CallingPage';
import IncomingCallPage from './pages/IncomingCallPage';
import Loader from './components/loader';
import { connectWebSocket, sendWebSocketMessage } from './services/websocketservice';
import { initializeSIP, answerCall, hangupCall } from './services/call';
import VoipPhone from './components/VoipPhone';
import SipClient from './components/SipClient';

const ProtectedRoute = ({ user, children }) => {
  return user ? children : <Navigate to="/check" replace />;
};

const App = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sipPassword, setSipPassword] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [contacts] = useState([
    { id: 1, name: 'John Doe', extension: '1001', avatar: 'https://via.placeholder.com/40/ef4444/fff?text=JD' },
    { id: 2, name: 'Jane Smith', extension: '1002', avatar: 'https://via.placeholder.com/40/facc15/fff?text=JS' },
  ]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const extension = localStorage.getItem('extension');
    const storedSipPassword = localStorage.getItem('sipPassword');
    if (token && extension && storedSipPassword) {
      setUser({ username: 'User', extension });
      setSipPassword(storedSipPassword);
      initializeConnection(extension);
    }

    const handleRegistrationStatus = (event) => {
      const { extension, registered, cause } = event.detail;
      if (extension === user?.extension) {
        setIsRegistered(registered);
        if (!registered && cause) {
          setNotification({ message: `Registration failed: ${cause}`, type: 'error' });
          setTimeout(() => setNotification(null), 5000);
        }
      }
    };

    window.addEventListener('registrationStatus', handleRegistrationStatus);
    return () => window.removeEventListener('registrationStatus', handleRegistrationStatus);
  }, [user?.extension]);

  const initializeConnection = async (extension) => {
    try {
      await connectWebSocket(
        extension,
        handleWebSocketMessage,
        (status) => {
          setNotification({
            message: `WebSocket ${status}`,
            type: status === 'connected' ? 'success' : status === 'error' ? 'error' : 'info',
          });
          setTimeout(() => setNotification(null), 3000);
        }
      );
      await initializeSIP({ extension }, (call) => {
        setIncomingCall({
          from: call.from,
          channel: `${call.from}@192.168.1.194`,
          session: call.session,
        });
      });
      console.log('[App.js] Connection initialized for extension:', extension);
    } catch (error) {
      console.error('[App.js] Connection initialization failed:', error);
      setNotification({ message: `Connection failed: ${error.message}`, type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleWebSocketMessage = (data) => {
    if (data.type === 'incoming-call') {
      setIncomingCall({
        from: data.from,
        channel: `${data.from}@192.168.1.194`,
        session: data.session,
      });
    }
  };

  const handleLogin = (result) => {
    if (result.success) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('extension', result.user?.extension);
      localStorage.setItem('sipPassword', `password${result.user?.extension}`);
      const extension = result.user?.extension;
      setUser({ username: result.user?.username || 'User', extension });
      setSipPassword(`password${extension}`);
      initializeConnection(extension);
      navigate('/dashboard', { state: { success: result.message } });
    }
  };

  const handleRegister = (extension, sipPassword) => {
    localStorage.setItem('extension', extension);
    localStorage.setItem('sipPassword', sipPassword);
    localStorage.setItem('token', 'dummy-token'); // Replace with actual token logic
    setUser({ username: 'User', extension });
    setSipPassword(sipPassword);
    initializeConnection(extension);
    navigate('/dashboard', { state: { success: 'Registered successfully' } });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('extension');
    localStorage.removeItem('sipPassword');
    localStorage.removeItem(`sipRegistered_${user?.extension}`);
    setUser(null);
    setSipPassword(null);
    setDarkMode(false);
    setIncomingCall(null);
    setIsRegistered(false);
    navigate('/check', { state: { success: 'Logged out successfully' } });
  };

  const handleAcceptCall = async (callData) => {
    setIsLoading(true);
    try {
      const stream = await answerCall(callData.channel);
      const caller = contacts.find((c) => c.extension === callData.from) || {
        name: `Ext ${callData.from}`,
        extension: callData.from,
      };
      setIncomingCall(null);
      navigate('/calling', {
        state: {
          contact: caller,
          callStatus: 'Connected',
          isOutgoing: false,
          stream,
          peerConnection: null, // Update if WebRTC is implemented
        },
      });
    } catch (error) {
      console.error('[App.js] Failed to accept call:', error);
      setNotification({ message: `Failed to accept call: ${error.message}`, type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      setIncomingCall(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectCall = async (callData) => {
    setIsLoading(true);
    try {
      await hangupCall(callData.channel, callData.from, user?.extension, callData.session);
      setIncomingCall(null);
    } catch (error) {
      console.error('[App.js] Failed to reject call:', error);
      setNotification({ message: `Failed to reject call: ${error.message}`, type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      setIncomingCall(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {notification && (
        <div
          className={`fixed top-20 right-4 sm:right-6 z-50 glass-effect p-3 sm:p-4 rounded-lg shadow-lg animate-[fadeInUp_0.6s_ease-out_forwards] ${
            notification.type === 'success' ? 'bg-green-500/80' : notification.type === 'error' ? 'bg-red-500/80' : 'bg-blue-500/80'
          }`}
          role="alert"
          aria-live="polite"
        >
          <span className="text-xs sm:text-sm font-medium text-white">{notification.message}</span>
        </div>
      )}
      {incomingCall && (
        <IncomingCallPage
          callData={incomingCall}
          contacts={contacts}
          user={user}
          darkMode={darkMode}
          onAccept={() => handleAcceptCall(incomingCall)}
          onReject={() => handleRejectCall(incomingCall)}
        />
      )}
      {user?.extension && sipPassword && (
        <SipClient
          extension={user.extension}
          sipPassword={sipPassword}
        />
      )}
      <Routes>
        <Route
          path="/check"
          element={
            <ServerCheckPage
              onSwitchToLogin={() => navigate('/login')}
              onSwitchToRegister={() => navigate('/register')}
              darkMode={darkMode}
            />
          }
        />
        <Route
          path="/login"
          element={
            <LoginPage
              onLogin={handleLogin}
              onSwitchToRegister={() => navigate('/register')}
              darkMode={darkMode}
              toggleDarkMode={() => setDarkMode(!darkMode)}
            />
          }
        />
        <Route
          path="/register"
          element={
            <RegisterPage
              onRegister={handleRegister}
              onSwitchToLogin={() => navigate('/login')}
              darkMode={darkMode}
              toggleDarkMode={() => setDarkMode(!darkMode)}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              <DashboardPage
                user={user}
                onLogout={handleLogout}
                darkMode={darkMode}
                toggleDarkMode={() => setDarkMode(!darkMode)}
                setIsLoading={setIsLoading}
                contacts={contacts}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <ProtectedRoute user={user}>
              <ContactsPage
                darkMode={darkMode}
                toggleDarkMode={() => setDarkMode(!darkMode)}
                setIsLoading={setIsLoading}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/callings"
          element={
            <ProtectedRoute user={user}>
              <VoipPhone
                extension={user?.extension || ''}
                sipPassword={sipPassword}
                darkMode={darkMode}
                toggleDarkMode={() => setDarkMode(!darkMode)}
                setIsLoading={setIsLoading}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/callLogs"
          element={
            <ProtectedRoute user={user}>
              <CallLogsPage
                darkMode={darkMode}
                toggleDarkMode={() => setDarkMode(!darkMode)}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calling"
          element={
            <ProtectedRoute user={user}>
              <CallingPage
                contact={contacts.find(c => c.extension === user?.extension) || { extension: user?.extension, name: `Ext ${user?.extension}` }}
                callStatus="Idle"
                onEndCall={() => navigate('/dashboard')}
                darkMode={darkMode}
                peerConnection={null} // Update if WebRTC is implemented
              />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/check" replace />} />
      </Routes>
      {isLoading && <Loader />}
    </div>
  );
};

export default App;