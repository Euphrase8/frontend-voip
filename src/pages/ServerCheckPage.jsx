import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../assets/Login.png';

const API_URL = 'http://192.168.1.164:8080';

const ServerCheckPage = ({ onSwitchToLogin, onSwitchToRegister }) => {
  const navigate = useNavigate();

  // Persistent dark mode state
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
  }, []);
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Health check states
  const [checks, setChecks] = useState({
    backend: { status: 'pending', message: 'Checking backend API...' },
    websocket: { status: 'pending', message: 'Checking Asterisk WebSocket...' },
    webrtc: { status: 'pending', message: 'Checking WebRTC support...' },
  });
  const [isChecking, setIsChecking] = useState(true);

  // Perform all system checks
  const performChecks = useCallback(async () => {
    setIsChecking(true);

    // Check backend API
    let wsResult = null;
    try {
      const res = await axios.post(
        `${API_URL}/health`,
        {
          kali_ip: '192.168.1.194',
          ssh_port: '22',
          ssh_user: 'kali',
          ssh_password: 'kali',
        },
        { timeout: 8000 }
      );

      if (res.data.status === 'success') {
        setChecks((prev) => ({
          ...prev,
          backend: {
            status: 'success',
            message: res.data.message || 'Asterisk is running and configured',
          },
        }));
        wsResult = res;
      } else {
        throw new Error(res.data.message || 'Health check failed');
      }
    } catch (err) {
      setChecks((prev) => ({
        ...prev,
        backend: {
          status: 'error',
          message: `Backend error: ${err.response?.data?.message || err.message}`,
        },
        websocket: {
          status: 'error',
          message: 'WebSocket check skipped due to backend failure',
        },
      }));
      setIsChecking(false);
      return;
    }

    // Check WebSocket
    try {
      const websocketPort = wsResult.data.ports?.websocket || 8088;
      const ws = new WebSocket(`ws://192.168.1.194:${websocketPort}/ws?extension=1002`, ['sip']);

      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          setChecks((prev) => ({
            ...prev,
            websocket: { status: 'success', message: 'Asterisk WebSocket connected' },
          }));
          ws.close();
          resolve();
        };
        ws.onerror = () => reject(new Error('WebSocket connection failed'));
        ws.onclose = (e) => {
          if (e.code !== 1000) reject(new Error(`WebSocket closed: code ${e.code}`));
        };
        setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN && ws.readyState !== WebSocket.CLOSED) {
            ws.close();
            reject(new Error('WebSocket timeout'));
          }
        }, 3000);
      });
    } catch (err) {
      setChecks((prev) => ({
        ...prev,
        websocket: { status: 'error', message: err.message },
      }));
    }

    // Check WebRTC support
    try {
      const hasWebRTC = !!(
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia &&
        window.RTCPeerConnection
      );
      setChecks((prev) => ({
        ...prev,
        webrtc: {
          status: hasWebRTC ? 'success' : 'error',
          message: hasWebRTC ? 'WebRTC is supported' : 'WebRTC is not supported',
        },
      }));
    } catch (err) {
      setChecks((prev) => ({
        ...prev,
        webrtc: { status: 'error', message: `WebRTC check failed: ${err.message}` },
      }));
    }

    setIsChecking(false);
  }, []);

  // Run checks on mount
  useEffect(() => {
    performChecks();
  }, [performChecks]);

  // Navigate on success
  useEffect(() => {
    if (!isChecking && Object.values(checks).every((c) => c.status === 'success')) {
      setTimeout(() => navigate('/login'), 1000);
    }
  }, [isChecking, checks, navigate]);

  const allChecksPassed = Object.values(checks).every((c) => c.status === 'success');

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 text-gray-900'} transition-colors duration-500`}>
      
      {/* Top Navbar */}
      <nav className={`flex justify-between items-center px-6 py-3 ${darkMode ? 'bg-gray-800' : 'bg-white shadow-md'} transition-colors duration-500`}>
        <div className="flex items-center space-x-3">
          <img src={Logo} alt="Logo" className="w-10 h-10 rounded-full object-contain" />
          <h1 className="text-xl font-bold">VoIP System</h1>
        </div>
        <button
          onClick={toggleDarkMode}
          className="px-3 py-1 rounded-full border border-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </nav>

      {/* Main Card */}
      <div className="flex-grow flex items-center justify-center px-4">
        <div className={`rounded-2xl shadow-2xl p-8 w-full max-w-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} transition-colors`}>
          <div className="flex flex-col items-center mb-6">
            <img src={Logo} alt="Logo" className="w-24 h-24 mb-2" />
            <h3 className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>THE INSTITUTE OF FINANCE MANAGEMENT</h3>
            <h2 className="text-2xl font-extrabold mt-1">VoIP SYSTEM CHECK</h2>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Secure VoIP Communication</p>
          </div>

          {/* Status List */}
          {Object.entries(checks).map(([key, { status, message }]) => (
            <div key={key} className="flex items-center mb-4">
              {status === 'pending' && <CircularProgress size={24} className="mr-2" />}
              {status === 'success' && <CheckCircle className="text-green-500 mr-2" />}
              {status === 'error' && <Error className="text-red-500 mr-2" />}
              <Typography className={darkMode ? 'text-white' : 'text-gray-900'}>{message}</Typography>
            </div>
          ))}

          {/* Action Buttons */}
          {isChecking ? (
            <Typography variant="body2" className="text-center mt-4 text-gray-400">
              Performing system checks...
            </Typography>
          ) : allChecksPassed ? (
            <div className="flex justify-between mt-6">
              <Button
                variant="contained"
                startIcon={<ArrowForward />}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                onClick={onSwitchToLogin}
              >
                Login
              </Button>
              <Button
                variant="outlined"
                className={`border-blue-500 text-blue-500 hover:bg-blue-100 ${darkMode ? 'dark:border-blue-400 dark:text-blue-400' : ''}`}
                onClick={onSwitchToRegister}
              >
                Register
              </Button>
            </div>
          ) : (
            <Typography className="text-center text-red-500 mt-4">
              Please resolve the errors before proceeding.
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerCheckPage;