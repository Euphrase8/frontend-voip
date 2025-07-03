import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, IconButton, Tooltip, Button } from '@mui/material';
import { Call, CallEnd, Mic, MicOff, VolumeUp, VolumeOff, SignalCellularAlt, Phone } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { connectWebSocket, sendWebSocketMessage } from '../services/websocketservice';
import { hangupCall } from '../services/call';
import { hangup } from '../services/hang';
import webrtcCallService from '../services/webrtcCallService';

const CallingPage = ({
  darkMode = false,
  contact: propContact,
  callStatus: propCallStatus,
  isOutgoing: propIsOutgoing,
  channel: propChannel,
  transport: propTransport,
  onEndCall
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Use props as fallback if navigation state is not available
  const navigationState = location.state || {};
  const contact = navigationState.contact || propContact;
  const initialCallStatus = navigationState.callStatus || propCallStatus || 'Connecting...';
  const isOutgoing = navigationState.isOutgoing !== undefined ? navigationState.isOutgoing : (propIsOutgoing !== undefined ? propIsOutgoing : true);
  const initialChannel = navigationState.channel || propChannel;
  const transport = navigationState.transport || propTransport;

  const [callTime, setCallTime] = useState(0);
  const [currentCallStatus, setCurrentCallStatus] = useState(initialCallStatus || 'Connecting...');
  const [isConnected, setIsConnected] = useState(initialCallStatus === 'Connected');
  const [notification, setNotification] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [channel, setChannel] = useState(initialChannel);
  const callStartTimeRef = useRef(null);
  const animationFrameRef = useRef(null);
  const wsRef = useRef(null);
  const hangupInProgressRef = useRef(false);

  useEffect(() => {
    // Validate navigation state with more detailed error handling
    if (!contact) {
      console.error('[CallingPage] No contact data provided in navigation state');
      setNotification({ message: 'No call data provided. Redirecting...', type: 'error' });
      if (onEndCall) {
        setTimeout(() => onEndCall(), 2000);
      } else {
        setTimeout(() => navigate('/dashboard'), 2000);
      }
      return;
    }

    if (!contact.extension) {
      console.error('[CallingPage] Contact missing extension:', contact);
      setNotification({ message: 'Invalid contact data - missing extension. Redirecting...', type: 'error' });
      if (onEndCall) {
        setTimeout(() => onEndCall(), 2000);
      } else {
        setTimeout(() => navigate('/dashboard'), 2000);
      }
      return;
    }

    // Ensure contact has a name, fallback to extension
    if (!contact.name) {
      contact.name = `Extension ${contact.extension}`;
    }

    console.log('[CallingPage] Call data validated:', { contact, currentCallStatus, isOutgoing, channel, transport });
    console.log('[CallingPage] Navigation state:', location.state);
    console.log('[CallingPage] Props:', { propContact, propCallStatus, propIsOutgoing, propChannel, propTransport });

    // Check if this is a WebRTC call and set up status listener
    const isWebRTCCall = channel && channel.startsWith('webrtc-call-');
    if (isWebRTCCall) {
      console.log('[CallingPage] Setting up WebRTC call status listener');

      // Listen for WebRTC call status updates
      const originalOnCallStatusChange = webrtcCallService.onCallStatusChange;
      webrtcCallService.onCallStatusChange = (status) => {
        console.log('[CallingPage] WebRTC status update:', status);
        setCurrentCallStatus(status);

        // Call original handler if it exists
        if (originalOnCallStatusChange) {
          originalOnCallStatusChange(status);
        }
      };

      // Cleanup function to restore original handler
      return () => {
        webrtcCallService.onCallStatusChange = originalOnCallStatusChange;
      };
    }

    // Set up WebSocket connection for real-time updates
    const setupWebSocket = () => {
      const wsUrl = `ws://localhost:8080/ws?extension=${encodeURIComponent(contact.extension)}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[CallingPage] WebSocket connected');
        setWsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[CallingPage] WebSocket message:', message);

          switch (message.type) {
            case 'call_answered':
              console.log('[CallingPage] Call answered - starting timer');
              setCurrentCallStatus('Connected');
              setIsConnected(true);

              // Start call timer when call is answered
              if (!callStartTimeRef.current) {
                callStartTimeRef.current = Date.now();
                const updateCallTime = () => {
                  if (callStartTimeRef.current) {
                    setCallTime(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
                    animationFrameRef.current = requestAnimationFrame(updateCallTime);
                  }
                };
                animationFrameRef.current = requestAnimationFrame(updateCallTime);
              }

              setNotification({ message: 'Call connected', type: 'success' });
              setTimeout(() => setNotification(null), 3000);
              break;
            case 'call_ended':
            case 'hangup':
              setCurrentCallStatus('Call Ended');
              setIsConnected(false);
              setNotification({ message: 'Call ended', type: 'info' });
              // Navigate faster when call is ended remotely
              if (onEndCall) {
                setTimeout(() => onEndCall(), 800);
              } else {
                setTimeout(() => navigate('/dashboard'), 800);
              }
              break;
            case 'call_status':
              if (message.status) {
                setCurrentCallStatus(message.status);
                if (message.status === 'Connected') {
                  setIsConnected(true);
                }
              }
              break;
          }
        } catch (error) {
          console.error('[CallingPage] Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('[CallingPage] WebSocket disconnected');
        setWsConnected(false);
      };

      wsRef.current.onerror = (error) => {
        console.error('[CallingPage] WebSocket error:', error);
        setWsConnected(false);
      };
    };

    setupWebSocket();

    // Start call timer only if call is actually connected (not just during dialing)
    if (isConnected && currentCallStatus === 'Connected' && !callStartTimeRef.current) {
      console.log('[CallingPage] Starting call timer - call is connected');
      callStartTimeRef.current = Date.now();
      const updateCallTime = () => {
        if (callStartTimeRef.current) {
          setCallTime(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
          animationFrameRef.current = requestAnimationFrame(updateCallTime);
        }
      };
      animationFrameRef.current = requestAnimationFrame(updateCallTime);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [contact?.extension, navigate]);

  // Handle call status changes and timer management
  useEffect(() => {
    if (currentCallStatus === 'Connected' && !isConnected) {
      console.log('[CallingPage] Call status changed to Connected - starting timer');
      setIsConnected(true);

      // Start timer only when call is truly connected
      if (!callStartTimeRef.current) {
        callStartTimeRef.current = Date.now();
        const updateCallTime = () => {
          if (callStartTimeRef.current) {
            setCallTime(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
            animationFrameRef.current = requestAnimationFrame(updateCallTime);
          }
        };
        animationFrameRef.current = requestAnimationFrame(updateCallTime);
      }
    } else if (currentCallStatus === 'Call Ended' || currentCallStatus === 'Disconnected') {
      console.log('[CallingPage] Call ended - stopping timer');
      setIsConnected(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [currentCallStatus, isConnected]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleEndCall = async () => {
    // Prevent multiple hangup attempts
    if (hangupInProgressRef.current) {
      console.log('[CallingPage] Hangup already in progress, ignoring duplicate call');
      return;
    }

    hangupInProgressRef.current = true;

    try {
      console.log('[CallingPage] Ending call on channel:', channel);
      console.log('[CallingPage] Contact:', contact);
      console.log('[CallingPage] Transport:', transport);

      // Immediately update UI state for faster response
      setCurrentCallStatus('Call Ended');
      setIsConnected(false);
      setNotification({ message: 'Ending call...', type: 'info' });

      // Close WebSocket connection immediately
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      // Stop call timer immediately
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Send hangup messages in parallel for faster execution
      const hangupPromises = [];

      // Send hangup message via WebSocket if still connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        hangupPromises.push(
          sendWebSocketMessage({
            type: "hangup",
            to: contact.extension,
            channel: channel,
            transport: transport || "transport-ws",
          }).catch(err => console.warn('[CallingPage] WebSocket hangup failed:', err))
        );
      }

      // Also try hangup via API - use appropriate hangup method based on channel type
      if (channel && channel.trim() !== '' && channel !== 'undefined' && channel !== 'null') {
        console.log('[CallingPage] Attempting hangup for channel:', channel);
        if (channel.startsWith('webrtc-call-') || channel.startsWith('PJSIP/')) {
          // Use the hangup API for WebRTC and SIP calls
          hangupPromises.push(
            hangup(channel).catch(err => console.warn('[CallingPage] API hangup failed:', err))
          );
        } else {
          // Use SIP hangup for traditional SIP sessions
          hangupPromises.push(
            hangupCall(channel).catch(err => console.warn('[CallingPage] SIP hangup failed:', err))
          );
        }
      } else {
        console.warn('[CallingPage] No valid channel available for hangup, channel:', channel);
      }

      // Execute hangup operations in parallel (don't wait for completion)
      Promise.allSettled(hangupPromises).then(() => {
        console.log('[CallingPage] All hangup operations completed');
      });

      // Navigate back immediately without waiting for hangup completion
      setNotification({ message: 'Call ended', type: 'success' });

      // Use onEndCall prop if available (for direct component usage), otherwise navigate
      if (onEndCall) {
        setTimeout(() => onEndCall(), 500);
      } else {
        setTimeout(() => navigate('/dashboard'), 500); // Reduced delay for faster navigation
      }

    } catch (error) {
      console.error('[CallingPage] End call error:', error);
      setNotification({ message: `Call ended with errors`, type: 'warning' });
      // Still navigate back even if there are errors
      if (onEndCall) {
        setTimeout(() => onEndCall(), 1000);
      } else {
        setTimeout(() => navigate('/dashboard'), 1000);
      }
    } finally {
      // Reset hangup flag
      hangupInProgressRef.current = false;
    }
  };

  const handleMuteToggle = () => {
    setIsMuted((prev) => {
      const newState = !prev;
      // Try to find audio tracks in media streams
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        if (audio.srcObject && audio.srcObject.getAudioTracks) {
          audio.srcObject.getAudioTracks().forEach(track => {
            track.enabled = !newState;
          });
        }
      });

      console.log(`[CallingPage] Microphone ${newState ? 'muted' : 'unmuted'}`);
      setNotification({
        message: `Microphone ${newState ? 'muted' : 'unmuted'}`,
        type: 'info'
      });
      setTimeout(() => setNotification(null), 2000);
      return newState;
    });
  };

  const handleSpeakerToggle = () => {
    setIsSpeakerOn((prev) => {
      const newState = !prev;
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        audio.muted = !newState;
      });

      console.log(`[CallingPage] Speaker ${newState ? 'on' : 'off'}`);
      setNotification({
        message: `Speaker ${newState ? 'on' : 'off'}`,
        type: 'info'
      });
      setTimeout(() => setNotification(null), 2000);
      return newState;
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4 sm:p-6 animate-[fadeInUp_0.6s_ease-out_forwards]">
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
          aria-live="polite"
        >
          <span className="text-xs sm:text-sm font-medium text-white">{notification.message}</span>
        </div>
      )}

      <div
        className="w-full max-w-[90%] sm:max-w-md glass-effect p-6 sm:p-8 rounded-2xl shadow-xl border border-white/20 transform transition-all duration-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-[fadeInUp_0.8s_ease-out_forwards]"
        style={{
          background: darkMode
            ? "rgba(30, 30, 30, 0.25)"
            : "rgba(255, 255, 255, 0.2)",
        }}
      >
        {/* Header with contact info */}
        <div className="flex items-center space-x-4 mb-6 animate-[fadeInUp_1s_ease-out_forwards]">
          <Avatar
            alt={contact?.name || 'Contact'}
            src={contact?.avatar}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-3 border-white/40 shadow-md"
            sx={{
              bgcolor: contact?.avatar ? 'transparent' : '#6366f1',
              color: 'white',
              fontSize: '1.2rem',
              fontWeight: 'bold'
            }}
          >
            {!contact?.avatar && (contact?.name ? contact.name.charAt(0).toUpperCase() : contact?.extension?.charAt(0) || '?')}
          </Avatar>
          <div>
            <h2
              className={`text-xl sm:text-2xl font-bold ${
                darkMode ? "text-white" : "text-white"
              } animate-pulse`}
              aria-live="polite"
              style={{ textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)" }}
            >
              📞 {isOutgoing ? 'Calling' : 'Incoming Call'}
            </h2>
            <p
              className={`text-base sm:text-lg font-semibold ${
                darkMode ? "text-blue-200" : "text-blue-200"
              }`}
            >
              {isOutgoing ? `Calling: ${contact?.name || `Extension ${contact?.extension}`}` : `From: ${contact?.name || `Extension ${contact?.extension}`}`}
            </p>
            <p
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-300"
              } mt-1 flex items-center space-x-2`}
            >
              <span>Status: {currentCallStatus}</span>
              <SignalCellularAlt
                className={`text-sm ${wsConnected ? 'text-green-400' : 'text-gray-300'}`}
                title={wsConnected ? 'Connected' : 'Disconnected'}
              />
            </p>
            <p
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-300"
              } mt-1`}
            >
              Duration: {isConnected && callStartTimeRef.current ? formatTime(callTime) : (currentCallStatus === 'Connected' ? 'Connecting...' : '00:00')}
            </p>
          </div>
        </div>

        {/* Call status indicator */}
        <div className="flex justify-center mb-6 animate-[fadeInUp_1.2s_ease-out_forwards]">
          <div className="relative">
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center ${
              isConnected
                ? 'bg-green-500/20 border-2 border-green-400'
                : currentCallStatus === 'Connecting...' || currentCallStatus === 'Ringing'
                ? 'bg-blue-500/20 border-2 border-blue-400 animate-pulse'
                : 'bg-gray-500/20 border-2 border-gray-400'
            }`}>
              <Phone className={`text-2xl sm:text-3xl ${
                isConnected ? 'text-green-400' : 'text-blue-400'
              }`} />
            </div>
            {isConnected && (
              <div className="absolute inset-0 rounded-full bg-green-400/10 animate-ping"></div>
            )}
          </div>
        </div>

        {/* Call quality indicator */}
        <div className="flex justify-center mb-6 animate-[fadeInUp_1.4s_ease-out_forwards]">
          <Tooltip title="Connection Quality">
            <div className="flex space-x-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-6 rounded-full ${
                    isConnected && wsConnected
                      ? 'bg-green-400 animate-[pulse_2s_infinite]'
                      : wsConnected
                      ? 'bg-yellow-400'
                      : 'bg-gray-500'
                  }`}
                  style={{ animationDelay: `${i * 0.2}s` }}
                ></div>
              ))}
            </div>
          </Tooltip>
        </div>

        {/* Audio controls */}
        <div className="flex justify-center space-x-6 mb-6 animate-[fadeInUp_1.6s_ease-out_forwards]">
          <Tooltip title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}>
            <IconButton
              onClick={handleMuteToggle}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full glass-effect text-white transition-all transform hover:scale-110 focus:ring-4 focus:ring-blue-500/60 ${
                isMuted
                  ? 'bg-red-600/80 hover:bg-red-700/80'
                  : 'bg-gray-700/60 hover:bg-gray-600/70'
              }`}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? (
                <MicOff className="text-xl" />
              ) : (
                <Mic className="text-xl" />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title={isSpeakerOn ? 'Mute Speaker' : 'Unmute Speaker'}>
            <IconButton
              onClick={handleSpeakerToggle}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full glass-effect text-white transition-all transform hover:scale-110 focus:ring-4 focus:ring-blue-500/60 ${
                !isSpeakerOn
                  ? 'bg-red-600/80 hover:bg-red-700/80'
                  : 'bg-gray-700/60 hover:bg-gray-600/70'
              }`}
              aria-label={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
            >
              {isSpeakerOn ? (
                <VolumeUp className="text-xl" />
              ) : (
                <VolumeOff className="text-xl" />
              )}
            </IconButton>
          </Tooltip>
        </div>

        {/* End call button */}
        <div className="flex justify-center animate-[fadeInUp_1.8s_ease-out_forwards]">
          <Tooltip title="End Call">
            <Button
              variant="contained"
              onClick={handleEndCall}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950 focus:ring-4 focus:ring-red-500/60 transition-all transform hover:scale-110 active:scale-95 ${
                darkMode ? "shadow-red-900/60" : "shadow-red-700/60"
              }`}
              startIcon={<CallEnd className="text-2xl" />}
              aria-label="End the call"
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

CallingPage.propTypes = {
  darkMode: PropTypes.bool,
  contact: PropTypes.shape({
    name: PropTypes.string,
    extension: PropTypes.string.isRequired,
    avatar: PropTypes.string,
  }),
  callStatus: PropTypes.string,
  isOutgoing: PropTypes.bool,
  channel: PropTypes.string,
  transport: PropTypes.string,
  onEndCall: PropTypes.func,
};

CallingPage.defaultProps = {
  darkMode: false,
  contact: null,
  callStatus: 'Connecting...',
  isOutgoing: true,
  channel: null,
  transport: null,
  onEndCall: null,
};

export default CallingPage;