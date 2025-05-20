import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './auth/LoginPage';
import RegisterPage from './auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ContactsPage from './pages/ContactsPage';
import CallLogsPage from './pages/CallLogsPage';
import CallingPage from './pages/CallingPage';
import IncomingCallPage from './pages/IncomingCallPage';
import Loader from './components/loader';
import { connectWebSocket, closeWebSocket } from './services/websocketservice';
import { handleIncomingCall } from './services/IncomingCallService';
import VoipPhone from './components/VoipPhone';

const ProtectedRoute = ({ user, children }) => {
  return user ? children : <Navigate to="/login" replace />;
};

const App = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [notification, setNotification] = useState(null);
  const [contacts] = useState([
    { id: 1, name: 'John Doe', extension: '123', avatar: 'https://via.placeholder.com/40/ef4444/fff?text=JD' },
    { id: 2, name: 'Jane Smith', extension: '456', avatar: 'https://via.placeholder.com/40/facc15/fff?text=JS' },
  ]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const extension = localStorage.getItem('extension');
    if (token && extension) {
      setUser({ username: 'User', extension });
      connectWebSocket(extension, handleWebSocketMessage, (status) => {
        setNotification({
          message: `WebSocket ${status}`,
          type: status === 'connected' ? 'success' : status === 'error' || status === 'disconnected' ? 'error' : 'info',
        });
        setTimeout(() => setNotification(null), 3000);
      }).catch((error) => {
        console.error('WebSocket connection failed:', error);
        setNotification({ message: 'Failed to connect WebSocket', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
      });
    }
    return () => closeWebSocket();
  }, []);

  const handleWebSocketMessage = (data) => {
    if (data.type === 'offer') {
      setIncomingCall({
        from: data.from,
        channel: data.channel || `chan_${Math.random().toString(36).slice(2)}`,
        priority: data.priority || 'medium',
        offer: data.offer,
      });
    }
  };

  const handleLogin = (result) => {
    if (result.success) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('extension', result.user?.extension);
      setUser({ username: result.user?.username || 'User', extension: result.user?.extension });
      navigate('/dashboard', { state: { success: result.message } });
    }
  };

  const handleRegister = (result) => {
    if (result.success) {
      navigate('/login', { state: { success: result.message } });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('extension');
    setUser(null);
    setDarkMode(false);
    setIncomingCall(null);
    closeWebSocket();
    navigate('/login', { state: { success: 'Logged out successfully' } });
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleAcceptCall = async (callData) => {
    setIsLoading(true);
    try {
      const { acceptCall } = await handleIncomingCall(
        callData,
        user,
        (stream, peerConnection) => {
          const caller = contacts.find((c) => c.extension === callData.from) || {
            name: `Ext ${callData.from}`,
            extension: callData.from,
          };
          setIncomingCall(null);
          navigate('/calling', { state: { contact: caller, callStatus: 'Connected', isOutgoing: false, stream, peerConnection } });
        },
        () => {
          setIncomingCall(null);
        }
      );
      await acceptCall();
    } catch (error) {
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
      const { rejectCall } = await handleIncomingCall(
        callData,
        user,
        () => {},
        () => {
          setIncomingCall(null);
        }
      );
      await rejectCall();
    } catch (error) {
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
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage
              onLogin={handleLogin}
              onSwitchToRegister={() => navigate('/register')}
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
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
              toggleDarkMode={toggleDarkMode}
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
                toggleDarkMode={toggleDarkMode}
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
                toggleDarkMode={toggleDarkMode}
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
                // extension={user.extension}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
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
                toggleDarkMode={toggleDarkMode}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calling"
          element={
            <ProtectedRoute user={user}>
              <CallingPage
                user={user}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                setIsLoading={setIsLoading}
                contacts={contacts} // Pass contacts for call lookup
              />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
      {isLoading && <Loader />}
    </div>
  );
};

export default App;