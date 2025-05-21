import React, { useState, useEffect } from 'react';
import {
  Button,
  CircularProgress,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import { CheckCircle, Error, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../assets/Login.png';

const API_URL = 'http://192.168.1.164:8080';

const ServerCheckPage = ({ onSwitchToLogin, onSwitchToRegister }) => {
  const navigate = useNavigate();

  // Dark mode with persistence
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Server check states
  const [checks, setChecks] = useState({
    backend: { status: 'pending', message: 'Checking backend API...' },
    websocket: { status: 'pending', message: 'Checking Asterisk WebSocket...' },
    webrtc: { status: 'pending', message: 'Checking WebRTC support...' },
  });
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const performChecks = async () => {
      // Backend API check
      try {
        const response = await axios.post(
          `${API_URL}/health`,
          {
            kali_ip: '192.168.1.194',
            ssh_port: '22',
            ssh_user: 'kali',
            ssh_password: 'kali',
          },
          { timeout: 10000 }
        );
        if (response.data.status === 'success') {
          setChecks((prev) => ({
            ...prev,
            backend: {
              status: 'success',
              message: response.data.message || 'Asterisk is running and configured',
            },
          }));
          const websocketPort = response.data.ports.websocket || 8088;

          try {
            const ws = new WebSocket(`ws://192.168.1.194:${websocketPort}/ws`);
            ws.onopen = () => {
              setChecks((prev) => ({
                ...prev,
                websocket: { status: 'success', message: 'Asterisk WebSocket connected' },
              }));
              ws.close();
            };
            ws.onerror = () => {
              setChecks((prev) => ({
                ...prev,
                websocket: { status: 'error', message: 'Asterisk WebSocket connection failed' },
              }));
            };
            setTimeout(() => {
              if (ws.readyState !== WebSocket.OPEN && ws.readyState !== WebSocket.CLOSED) {
                setChecks((prev) => ({
                  ...prev,
                  websocket: { status: 'error', message: 'Asterisk WebSocket timeout' },
                }));
                ws.close();
              }
            }, 5000);
          } catch (error) {
            setChecks((prev) => ({
              ...prev,
              websocket: { status: 'error', message: `WebSocket error: ${error.message}` },
            }));
          }
        } else {
          throw new Error('Health check failed');
        }
      } catch (error) {
        setChecks((prev) => ({
          ...prev,
          backend: {
            status: 'error',
            message: `Backend API error: ${error.response?.data?.message || error.message}`,
          },
          websocket: { status: 'error', message: 'WebSocket check skipped due to backend failure' },
        }));
      }

      // WebRTC support check
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
      } catch (error) {
        setChecks((prev) => ({
          ...prev,
          webrtc: { status: 'error', message: `WebRTC check failed: ${error.message}` },
        }));
      }

      setIsChecking(false);
    };

    performChecks();
  }, []);

  const allChecksPassed = Object.values(checks).every((check) => check.status === 'success');

  return (
    <div
      className={`min-h-screen flex flex-col ${
        darkMode
          ? 'bg-gray-900 text-white transition-colors duration-500'
          : 'bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 text-gray-900 transition-colors duration-500'
      }`}
    >
      {/* Top Navigation */}
      <nav
        className={`flex justify-between items-center px-6 py-3 ${
          darkMode ? 'bg-gray-800' : 'bg-white shadow-md'
        } transition-colors duration-500`}
      >
        <div className="flex items-center space-x-3">
          <img src={Logo} alt="Logo" className="w-10 h-10 rounded-full object-contain" />
          <h1 className="text-xl font-bold select-none">VoIP System</h1>
        </div>
        <button
          onClick={toggleDarkMode}
          aria-label="Toggle Dark Mode"
          className="px-3 py-1 rounded-full border border-gray-400 focus:outline-none hover:bg-gray-300 dark:hover:bg-gray-700 dark:border-gray-600 transition-colors duration-300"
        >
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </nav>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center px-4">
        <div
          className={`rounded-2xl shadow-2xl p-8 w-full max-w-md ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          } transition-colors duration-500`}
        >
          {/* Header Section */}
          <div className="flex flex-col items-center mb-6">
            <img
              src={Logo}
              alt="Logo"
              className="w-24 h-24 rounded-full object-contain mb-2"
            />
            <h3
              className={`text-sm font-bold text-center ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              THE INSTITUTE OF FINANCE MANAGEMENT
            </h3>
            <h2 className="text-2xl font-extrabold text-center mt-1">
              VoIP SYSTEM CHECK
            </h2>
            <p
              className={`text-xs text-center mt-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              Secure VoIP Communication
            </p>
          </div>

          {/* Checks */}
          {Object.entries(checks).map(([key, { status, message }]) => (
            <div key={key} className="flex items-center mb-4">
              {status === 'pending' && (
                <CircularProgress size={24} className="mr-2" color={darkMode ? 'inherit' : 'primary'} />
              )}
              {status === 'success' && (
                <CheckCircle className="text-green-500 mr-2" />
              )}
              {status === 'error' && (
                <Error className="text-red-500 mr-2" />
              )}
              <Typography
                className={`${darkMode ? 'text-white' : 'text-gray-900'}`}
                variant="body1"
              >
                {message}
              </Typography>
            </div>
          ))}

          {/* Actions */}
          {isChecking ? (
            <Typography
              variant="body2"
              className="text-center mt-4"
              color={darkMode ? 'textSecondary' : 'textSecondary'}
            >
              Performing system checks...
            </Typography>
          ) : allChecksPassed ? (
            <div className="flex justify-between mt-6">
              <Button
                variant="contained"
                startIcon={<ArrowForward />}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                onClick={() => onSwitchToLogin()}
              >
                Login
              </Button>
              <Button
                variant="outlined"
                className={`border-blue-500 text-blue-500 hover:bg-blue-50 ${
                  darkMode ? 'dark:border-blue-400 dark:text-blue-400' : ''
                }`}
                onClick={() => onSwitchToRegister()}
              >
                Register
              </Button>
            </div>
          ) : (
            <Typography className="text-center text-red-500 mt-4">
              Please resolve errors before proceeding.
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerCheckPage;