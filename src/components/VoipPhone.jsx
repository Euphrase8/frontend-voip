import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, TextField, Tooltip } from '@mui/material';
import { Call, CallEnd } from '@mui/icons-material';
import { hangup } from '../services/hang';
import { sendWebSocketMessage } from '../services/websocketservice';
import JsSIP from 'jssip';

const VoipPhone = ({
  extension = '',
  password = 'user_password',
  setIsLoading,
  darkMode,
  initialTargetExtension = '',
  onCallStatusChange,
  incomingStream,
  incomingPeerConnection,
}) => {
  const [targetExtension, setTargetExtension] = useState(initialTargetExtension);
  const [status, setStatus] = useState(extension ? 'Disconnected' : 'No extension provided');
  const [callStatus, setCallStatus] = useState('');
  const uaRef = useRef(null);
  const callRef = useRef(null);
  const wsRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (incomingStream && incomingPeerConnection && audioRef.current) {
      audioRef.current.srcObject = incomingStream;
      audioRef.current.play().catch((error) => {
        console.error('Error playing incoming audio:', error);
      });
      setStatus('Connected');
      setCallStatus('Call connected');
      onCallStatusChange('Call connected');
    }
  }, [incomingStream, incomingPeerConnection, onCallStatusChange]);

  const setupWebSocket = useCallback(() => {
    if (!extension || incomingStream) return; // Skip for incoming calls
    const wsUrl = `ws://192.168.1.164:8080/ws?extension=${encodeURIComponent(extension)}`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected for VoIP');
      setStatus('WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('WebSocket message:', message);
      if (message.type === 'call-status') {
        setCallStatus(message.status);
        onCallStatusChange(message.status);
      }
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      setStatus('WebSocket disconnected');
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [extension, onCallStatusChange, incomingStream]);

  useEffect(() => {
    if (incomingStream) return; // Skip SIP setup for incoming calls
    JsSIP.debug.enable('JsSIP:*');
    const socket = new JsSIP.WebSocketInterface('wss://192.168.1.164:8088/ws');
    const configuration = {
      sockets: [socket],
      uri: `sip:${extension}@192.168.1.164`,
      password,
      register: true,
    };

    uaRef.current = new JsSIP.UA(configuration);

    uaRef.current.on('connected', () => setStatus('Connected'));
    uaRef.current.on('disconnected', () => setStatus('Disconnected'));
    uaRef.current.on('registered', () => setStatus('Registered'));
    uaRef.current.on('unregistered', () => setStatus('Unregistered'));
    uaRef.current.on('registrationFailed', (e) => setStatus(`Registration failed: ${e.cause}`));

    uaRef.current.start();

    return () => {
      if (uaRef.current) uaRef.current.stop();
    };
  }, [extension, password]);

  useEffect(() => {
    setupWebSocket();
  }, [setupWebSocket]);

  const makeCall = useCallback(async () => {
    if (!uaRef.current || !uaRef.current.isRegistered()) {
      setCallStatus('Please register first');
      return;
    }
    if (!targetExtension) {
      setCallStatus('Please enter target extension');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.1.164:8080/protected/call/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ extension: targetExtension }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setCallStatus(`Call initiated to ${targetExtension} (Channel: ${data.channel})`);
        callRef.current = uaRef.current.call(`sip:${targetExtension}@192.168.1.164`, {
          mediaConstraints: { audio: true, video: false },
          eventHandlers: {
            progress: () => setCallStatus('Dialing...'),
            failed: (e) => {
              setCallStatus(`Call failed: ${e.cause}`);
              onCallStatusChange(`Call failed: ${e.cause}`);
            },
            ended: () => {
              setCallStatus('Call ended');
              onCallStatusChange('Call ended');
            },
            confirmed: () => {
              setCallStatus('Call connected');
              onCallStatusChange('Call connected');
            },
          },
        });
      } else {
        setCallStatus(`Failed to initiate call: ${data.error}`);
      }
    } catch (error) {
      setCallStatus(`Error initiating call: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [targetExtension, setIsLoading, onCallStatusChange]);

  const endCall = useCallback(async () => {
    if (callRef.current) {
      callRef.current.terminate();
      callRef.current = null;
    }
    if (incomingStream) {
      incomingStream.getTracks().forEach((track) => track.stop());
    }
    if (incomingPeerConnection) {
      incomingPeerConnection.close();
    }
    try {
      await hangup(`PJSIP/${extension}`);
      await sendWebSocketMessage({
        type: 'hangup',
        to: targetExtension,
        from: extension,
      });
      setCallStatus('Call ended');
      onCallStatusChange('Call ended');
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }, [extension, targetExtension, onCallStatusChange, incomingStream, incomingPeerConnection]);

  return (
    <div className="animate-[fadeInUp_1.8s_ease-out_forwards]">
      <audio ref={audioRef} autoPlay />
      {!incomingStream && (
        <>
          <div className="flex space-x-3 mb-4">
            <TextField
              label="Target Extension"
              value={targetExtension}
              onChange={(e) => setTargetExtension(e.target.value)}
              variant="outlined"
              fullWidth
              className="glass-effect"
              InputProps={{
                className: darkMode ? 'text-white' : 'text-black',
              }}
              disabled={!!callRef.current}
            />
            <Tooltip title={callRef.current ? 'End Call' : 'Make Call'}>
              <Button
                variant="contained"
                onClick={callRef.current ? endCall : makeCall}
                className={`min-w-[100px] ${
                  callRef.current
                    ? 'bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950'
                    : 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800'
                } text-white`}
                startIcon={callRef.current ? <CallEnd /> : <Call />}
                aria-label={callRef.current ? 'End the call' : 'Make a call'}
              >
                {callRef.current ? 'End' : 'Call'}
              </Button>
            </Tooltip>
          </div>
          <div className="text-center">
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              SIP Status: {status}
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Call Status: {callStatus}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default VoipPhone;