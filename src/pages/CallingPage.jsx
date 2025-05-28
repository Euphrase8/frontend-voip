import React, { useState, useEffect, useRef } from 'react';
import { Avatar, IconButton, Tooltip, Button } from '@mui/material';
import { Call, CallEnd, Mic, MicOff, VolumeUp, VolumeOff, SignalCellularAlt } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { connectWebSocket, getConnectionStatus } from '../services/websocketservice';
import { initializeSIP, call, hangupCall } from '../services/call';

const CallingPage = ({ contact, callStatus, onEndCall, darkMode, peerConnection }) => {
  const [callTime, setCallTime] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [channel, setChannel] = useState(null);
  const callStartTimeRef = useRef(null);
  const animationFrameRef = useRef(null);

  const callChannel = channel || `${contact?.extension || '1002'}@192.168.1.194`;

  useEffect(() => {
    if (!contact?.extension || !/^\d{4,6}$/.test(contact.extension)) {
      console.error('[CallingPage.jsx] Invalid contact extension:', contact);
      setNotification({ message: 'Invalid contact extension', type: 'error' });
      return;
    }

    // Handle incoming calls
    const handleIncomingCall = (event) => {
      const { from } = event.detail;
      console.log('[CallingPage.jsx] Incoming call from:', from);
      setNotification({ message: `Incoming call from ${from}`, type: 'info' });
      alert(`Incoming call from ${from}`);
    };

    // Handle registration status
    const handleRegistrationStatus = (event) => {
      const { extension, registered, cause } = event.detail;
      if (extension === contact.extension) {
        setIsRegistered(registered);
        if (!registered && cause) {
          setNotification({ message: `Registration failed: ${cause}`, type: 'error' });
          setTimeout(() => setNotification(null), 5000);
        }
      }
    };

    window.addEventListener('incomingCall', handleIncomingCall);
    window.addEventListener('registrationStatus', handleRegistrationStatus);

    // Initialize WebSocket and SIP
    const initializeConnection = async () => {
      const { isConnected, extension: activeExtension } = getConnectionStatus();
      if (isConnected && activeExtension === contact.extension) {
        console.log('[CallingPage.jsx] WebSocket already connected for extension:', contact.extension);
        setWsConnected(true);
        setIsRegistered(localStorage.getItem(`sipRegistered_${contact.extension}`) === 'true');
        return;
      }

      try {
        await connectWebSocket(
          contact.extension,
          (data) => console.log('[CallingPage.jsx] WebSocket message:', data),
          (status) => {
            setWsConnected(status === 'connected');
            if (status === 'error') {
              setNotification({ message: 'WebSocket connection failed', type: 'error' });
              setTimeout(() => setNotification(null), 5000);
            }
          }
        );
        await initializeSIP({ extension: contact.extension }, (call) => {
          window.dispatchEvent(new CustomEvent('incomingCall', { detail: call }));
        });
        console.log('[CallingPage.jsx] Connection initialized successfully');
      } catch (error) {
        console.error('[CallingPage.jsx] Initialization error:', error);
        setNotification({ message: `Initialization error: ${error.message}`, type: 'error' });
        setTimeout(() => setNotification(null), 5000);
      }
    };

    initializeConnection();

    return () => {
      window.removeEventListener('incomingCall', handleIncomingCall);
      window.removeEventListener('registrationStatus', handleRegistrationStatus);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [contact?.extension]);

  useEffect(() => {
    if (callStatus === 'Connected') {
      setIsConnected(true);
      setNotification({ message: 'Call Connected', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      callStartTimeRef.current = Date.now();
      const updateCallTime = () => {
        setCallTime(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
        animationFrameRef.current = requestAnimationFrame(updateCallTime);
      };
      animationFrameRef.current = requestAnimationFrame(updateCallTime);
    } else {
      setIsConnected(false);
      setCallTime(0);
      if (callStatus !== 'Dialing...' && callStatus !== 'Connected') {
        setNotification({ message: `Call Status: ${callStatus}`, type: 'info' });
        setTimeout(() => setNotification(null), 3000);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [callStatus]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleInitiateCall = async () => {
    if (!isRegistered) {
      setNotification({ message: 'Extension not registered', type: 'error' });
      return;
    }
    try {
      console.log('[CallingPage.jsx] Initiating call to:', contact.extension);
      const response = await call(contact.extension);
      setChannel(response.channel);
      setNotification({ message: `Calling ${contact.extension}`, type: 'info' });
    } catch (error) {
      console.error('[CallingPage.jsx] Call initiation error:', error);
      setNotification({ message: `Failed to initiate call: ${error.message}`, type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleEndCall = async () => {
    try {
      console.log('[CallingPage.jsx] Ending call on channel:', callChannel);
      await hangupCall(callChannel);
      setNotification({ message: 'Call Ended', type: 'info' });
      setTimeout(() => setNotification(null), 3000);
      onEndCall();
    } catch (error) {
      console.error('[CallingPage.jsx] End call error:', error);
      setNotification({ message: `Failed to end call: ${error.message}`, type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted((prev) => {
      const newState = !prev;
      if (peerConnection) {
        peerConnection.getSenders().forEach((sender) => {
          if (sender.track?.kind === 'audio') {
            sender.track.enabled = !newState;
            console.log(`[CallingPage.jsx] Microphone ${newState ? 'muted' : 'unmuted'}`);
          }
        });
      } else {
        console.warn('[CallingPage.jsx] No peerConnection for mute toggle');
        setNotification({ message: 'Audio control unavailable', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
      }
      return newState;
    });
  };

  const handleSpeakerToggle = () => {
    setIsSpeakerOn((prev) => {
      const newState = !prev;
      const audioElement = document.querySelector('audio');
      if (audioElement) {
        audioElement.muted = !newState;
        console.log(`[CallingPage.jsx] Speaker ${newState ? 'on' : 'off'}`);
      } else {
        console.warn('[CallingPage.jsx] No audio element for speaker toggle');
        setNotification({ message: 'Speaker control unavailable', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
      }
      return newState;
    });
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 md:p-8 animate-[fadeInUp_0.6s_ease-out_forwards] z-40 overflow-auto">
      {notification && (
        <div
          className={`fixed top-20 right-4 sm:right-6 z-50 glass-effect p-3 sm:p-4 rounded-lg shadow-lg animate-[fadeInUp_0.6s_ease-out_forwards] ${
            notification.type === 'success'
              ? 'bg-green-500/80'
              : notification.type === 'error'
              ? 'bg-red-500/80'
              : 'bg-blue-500/80'
          }`}
          role="alert"
        >
          <span className="text-xs sm:text-sm font-medium text-white">{notification.message}</span>
        </div>
      )}

      <div
        className="w-full max-w-[90%] sm:max-w-xs md:max-w-sm lg:max-w-md glass-effect p-4 sm:p-6 md:p-8 rounded-2xl shadow-xl border border-white/20 transform transition-all duration-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-[fadeInUp_0.8s_ease-out_forwards] overflow-auto"
        style={{
          background: darkMode ? 'rgba(30, 30, 30, 0.25)' : 'rgba(255, 255, 255, 0.2)',
        }}
      >
        <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6 animate-[fadeInUp_1s_ease-out_forwards]">
          <div className="relative">
            <Avatar
              alt={`${contact?.name || 'Contact'}'s avatar`}
              src={contact?.avatar || '/static/images/avatar/2.jpg'}
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full object-cover border-3 border-white/40 shadow-md"
            />
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-50 animate-[pulse_3s_infinite] shadow-[0_0_10px_rgba(59,130,246,0.6)]"
            ></div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3
                className={`text-lg sm:text-xl md:text-2xl font-bold ${
                  darkMode ? 'text-white' : 'text-white'
                } ${isConnected ? 'text-green-400 animate-pulse' : ''}`}
                aria-live="polite"
              >
                {callStatus || 'Idle'}
              </h3>
              <SignalCellularAlt
                className={`text-sm sm:text-base ${wsConnected && isRegistered ? 'text-green-400' : 'text-gray-300'}`}
                aria-label="Connection status"
                title={wsConnected && isRegistered ? 'Connected and Registered' : 'Not fully connected'}
              />
            </div>
            <p
              className={`text-sm sm:text-base md:text-lg ${
                darkMode ? 'text-gray-300' : 'text-gray-200'
              } animate-[fadeInUp_1.2s_ease-out_forwards]`}
            >
              Calling {contact?.name || `Ext ${contact?.extension || 'Unknown'}`}
            </p>
            <p
              className={`text-xs sm:text-sm md:text-base ${
                darkMode ? 'text-gray-400' : 'text-gray-300'
              } mt-1 animate-[fadeInUp_1.4s_ease-out_forwards]`}
            >
              {isConnected ? formatTime(callTime) : '00:00'}
            </p>
          </div>
        </div>

        <div className="flex justify-center mb-4 animate-[fadeInUp_1.6s_ease-out_forwards]">
          <Tooltip title="Call Quality">
            <div className="flex space-x-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-1.5 h-5 rounded-full ${
                    isConnected && wsConnected && isRegistered ? 'bg-green-400 animate-[pulse_2s_infinite]' : 'bg-gray-500'
                  }`}
                  style={{ animationDelay: `${i * 0.2}s` }}
                ></div>
              ))}
            </div>
          </Tooltip>
        </div>

        <div className="relative flex justify-center mb-4 animate-[fadeInUp_1.8s_ease-out_forwards]">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
            <div
              className={`absolute inset-0 rounded-full ${
                isConnected ? 'bg-green-500/30 animate-[wave_2s_infinite]' : 'bg-blue-500/30 animate-[pulse_2s_infinite]'
              }`}
            ></div>
            <div
              className={`absolute inset-2 rounded-full ${
                isConnected
                  ? 'bg-green-500/20 animate-[wave_2s_infinite_0.5s]'
                  : 'bg-blue-500/20 animate-[pulse_2s_infinite_0.5s]'
              }`}
            ></div>
          </div>
        </div>

        <div className="flex justify-center space-x-3 sm:space-x-4 mb-4 animate-[fadeInUp_2s_ease-out_forwards]">
          <Tooltip title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}>
            <IconButton
              onClick={handleMuteToggle}
              className={`w-10 h-10 sm:w-12 sm:h-12 glass-effect text-white hover:bg-gray-600/70 transition-all transform hover:scale-110 focus:ring-2 focus:ring-blue-500 ${
                darkMode ? 'bg-gray-800/60' : 'bg-gray-700/60'
              } ${isMuted ? 'bg-red-600/70' : ''}`}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? (
                <MicOff className="text-base sm:text-lg" />
              ) : (
                <Mic className="text-base sm:text-lg" />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title={isSpeakerOn ? 'Mute Speaker' : 'Unmute Speaker'}>
            <IconButton
              onClick={handleSpeakerToggle}
              className={`w-10 h-10 sm:w-12 sm:h-12 glass-effect text-white hover:bg-gray-600/70 transition-all transform hover:scale-110 focus:ring-2 focus:ring-blue-500 ${
                darkMode ? 'bg-gray-800/60' : 'bg-gray-700/60'
              } ${!isSpeakerOn ? 'bg-red-600/70' : ''}`}
              aria-label={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
            >
              {isSpeakerOn ? (
                <VolumeUp className="text-base sm:text-lg" />
              ) : (
                <VolumeOff className="text-base sm:text-lg" />
              )}
            </IconButton>
          </Tooltip>
        </div>

        <div className="flex justify-center space-x-3 sm:space-x-4 mb-4 animate-[fadeInUp_2.2s_ease-out_forwards]">
          <Button
            onClick={handleInitiateCall}
            disabled={callStatus === 'Connected' || !isRegistered}
            className={`w-full bg-gradient-to-r from-green-700 to-green-900 text-white p-3 sm:p-4 md:p-5 rounded-xl hover:from-green-800 hover:to-green-950 focus:outline-none focus:ring-4 focus:ring-green-500/60 text-sm sm:text-base md:text-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center shadow-lg hover:shadow-[0_0_10px_rgba(34,197,94,0.4)] ${
              darkMode ? 'shadow-green-900/60' : 'shadow-green-700/60'
            } ${callStatus === 'Connected' || !isRegistered ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Initiate call"
          >
            <Call className="mr-2 text-base sm:text-lg" /> Start Call
          </Button>
          <Button
            onClick={handleEndCall}
            disabled={callStatus !== 'Connected'}
            className={`w-full bg-gradient-to-r from-red-700 to-red-900 text-white p-3 sm:p-4 md:p-5 rounded-xl hover:from-red-800 hover:to-red-950 focus:outline-none focus:ring-4 focus:ring-red-500/60 text-sm sm:text-base md:text-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center shadow-lg hover:shadow-[0_0_10px_rgba(239,68,68,0.4)] ${
              darkMode ? 'shadow-red-900/60' : 'shadow-red-700/60'
            } ${callStatus !== 'Connected' ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="End the current call"
          >
            <CallEnd className="mr-2 text-base sm:text-lg" /> End Call
          </Button>
        </div>
      </div>
    </div>
  );
};

CallingPage.propTypes = {
  contact: PropTypes.shape({
    name: PropTypes.string,
    extension: PropTypes.string.isRequired,
    avatar: PropTypes.string,
  }).isRequired,
  callStatus: PropTypes.string.isRequired,
  onEndCall: PropTypes.func.isRequired,
  darkMode: PropTypes.bool,
  peerConnection: PropTypes.instanceOf(RTCPeerConnection),
};

CallingPage.defaultProps = {
  darkMode: false,
  peerConnection: null,
};

export default CallingPage;