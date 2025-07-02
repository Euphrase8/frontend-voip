import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './auth/LoginPage';
import RegisterPage from './auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ContactsPage from './pages/ContactsPage';
import CallLogsPage from './pages/CallLogsPage';
import CallingPage from './pages/CallingPage';
import IncomingCallPage from './pages/IncomingCallPage';
import WebRTCTestPage from './pages/WebRTCTestPage';
import Loader from './components/loader';
import { initializeSIP } from './services/call';
import VoipPhone from './components/VoipPhone';
import SipClient from './components/SipClient';
import IncomingCallListener from './pages/IncomingCallListener';
import sipManager from './services/sipManager';

const App = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sipPassword, setSipPassword] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
    } else if (!token && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      console.log('[App.js] No token, redirecting to /login');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
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
      // Use WebRTC mode by default (no traditional SIP registration)
      await initializeSIP({ extension }, (call) => {
        // Handle incoming calls
        console.log('[App.js] Incoming call received:', call);
        navigate('/calling', {
          state: {
            contact: contacts.find((c) => c.extension === call.from) || {
              name: `Ext ${call.from}`,
              extension: call.from,
            },
            callStatus: 'Incoming',
            isOutgoing: false,
            channel: `${call.from}@172.20.10.6`,
            session: call.session,
          },
        });
      }, true); // Enable WebRTC mode
      console.log('[App.js] WebRTC connection initialized for extension:', extension);
    } catch (error) {
      console.error('[App.js] Connection initialization failed:', error);
      // Don't show error for WebRTC mode since it's expected to skip SIP registration
      if (!error.message.includes('WebRTC mode')) {
        setNotification({ message: `Connection failed: ${error.message}`, type: 'error' });
        setTimeout(() => setNotification(null), 5000);
      }
    }
  };

  const handleLogin = (result) => {
    if (result.success) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('extension', result.user?.extension);
      localStorage.setItem('sipPassword', `password${result.user?.extension}`);
      const extension = result.user?.extension;
      console.log('[App.js] Login successful, setting user:', { username: result.user?.username, extension });
      setUser({ username: result.user?.username || 'User', extension });
      setSipPassword(`password${extension}`);
      initializeConnection(extension);
      navigate('/dashboard', { state: { success: result.message } });
    }
  };

  const handleRegister = (extension, sipPassword) => {
  // Clear any saved auth info (or don't save yet)
  localStorage.removeItem('token');
  localStorage.removeItem('extension');
  localStorage.removeItem('sipPassword');

  // Just navigate to login page, let user login explicitly
  setUser(null);
  setSipPassword(null);
  navigate('/login', { state: { success: 'Registered successfully, please log in' } });
};


  const handleLogout = () => {
    // Clean up SIP connection
    sipManager.destroy();

    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('extension');
    localStorage.removeItem('sipPassword');
    localStorage.removeItem(`sipRegistered_${user?.extension}`);

    // Reset state
    setUser(null);
    setSipPassword(null);
    setDarkMode(false);
    setIsRegistered(false);

    navigate('/login', { state: { success: 'Logged out successfully' } });
  };

  const token = localStorage.getItem('token');

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
      {user?.extension && sipPassword && (
        <>
          {/* SipClient disabled for WebRTC mode - uncomment if you want traditional SIP */}
          {/* <SipClient
            extension={user.extension}
            sipPassword={sipPassword}
          /> */}
          <IncomingCallListener /> {/* Add IncomingCallListener here */}
        </>
      )}
      <Routes>
        <Route
          path="/login"
          element={<LoginPage
            onLogin={handleLogin}
            onSwitchToRegister={() => navigate('/register')}
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(!darkMode)}
          />}
        />
        <Route
          path="/register"
          element={<RegisterPage
            onRegister={handleRegister}
            onSwitchToLogin={() => navigate('/login')}
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(!darkMode)}
          />}
        />
        <Route
          path="/dashboard"
          element={token ? <DashboardPage
            user={user}
            onLogout={handleLogout}
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(!darkMode)}
          /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/contacts"
          element={token ? <ContactsPage
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(!darkMode)}
            setIsLoading={setIsLoading}
          /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/callings"
          element={token ? <VoipPhone
            extension={user?.extension || ''}
            sipPassword={sipPassword}
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(!darkMode)}
            setIsLoading={setIsLoading}
          /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/callLogs"
          element={token ? <CallLogsPage
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(!darkMode)}
          /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/calling"
          element={token ? <CallingPage
            darkMode={darkMode}
          /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/webrtc-test"
          element={token ? <WebRTCTestPage /> : <Navigate to="/login" replace />}
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
      {isLoading && <Loader />}
    </div>
  );
};

export default App;