import React, { useState, useEffect, useRef, useCallback } from 'react';
import JsSIP from 'jssip';

const VoipPhone = ({ extension, password, setIsLoading, darkMode, initialTargetExtension = '', onCallStatusChange }) => {
  const [targetExtension, setTargetExtension] = useState(initialTargetExtension);
  const [status, setStatus] = useState('Disconnected');
  const [callStatus, setCallStatus] = useState('');
  const uaRef = useRef(null);
  const callRef = useRef(null);
  const wsRef = useRef(null);
  const audioRef = useRef(null);

  const setupWebSocket = useCallback(() => {
    if (!extension) return;

    const wsUrl = `ws://192.168.1.x:8080/ws?extension=${encodeURIComponent(extension)}`; // Replace with your backend IP
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => setStatus('WebSocket Connected');
    wsRef.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'incoming-call') {
          setCallStatus(`Incoming call from ${msg.from} (Channel: ${msg.channel})`);
          if (window.confirm(`Accept call from ${msg.from}?`)) {
            answerCall(msg.channel);
          }
        }
      } catch (error) {
        setStatus(`WebSocket Message Error: ${error.message}`);
      }
    };
    wsRef.current.onerror = () => setStatus('WebSocket Error');
    wsRef.current.onclose = () => setStatus('WebSocket Disconnected');
  }, [extension]);

  useEffect(() => {
    if (extension) {
      setupWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [extension, setupWebSocket]);

  useEffect(() => {
    setTargetExtension(initialTargetExtension);
  }, [initialTargetExtension]);

  useEffect(() => {
    onCallStatusChange(callStatus);
  }, [callStatus, onCallStatusChange]);

  const register = useCallback(() => {
    if (!extension || !password) {
      setStatus('Please enter extension and password');
      return;
    }

    setIsLoading(true);
    try {
      const socket = new JsSIP.WebSocketInterface('ws://192.168.1.194:8088/ws'); // Asterisk WebSocket
      const configuration = {
        sockets: [socket],
        uri: `sip:${extension}@192.168.1.194`,
        password,
        display_name: `Extension ${extension}`,
        register: true,
      };

      uaRef.current = new JsSIP.UA(configuration);

      uaRef.current.on('connected', () => setStatus('Connected to Asterisk'));
      uaRef.current.on('registered', () => setStatus(`Registered as ${extension}`));
      uaRef.current.on('registrationFailed', (data) => setStatus(`Registration failed: ${data.cause}`));
      uaRef.current.on('newRTCSession', (data) => {
        callRef.current = { session: data.session };
        data.session.on('failed', (e) => {
          setCallStatus(`Call failed: ${e.cause}`);
          callRef.current = null;
        });
        data.session.on('ended', () => {
          setCallStatus('Call ended');
          callRef.current = null;
        });
        data.session.on('accepted', () => setCallStatus('Call connected'));
        data.session.on('addstream', (e) => {
          if (audioRef.current) {
            audioRef.current.srcObject = e.stream;
          }
        });
      });

      uaRef.current.start();
    } catch (error) {
      setStatus(`Registration error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [extension, password, setIsLoading]);

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
      const response = await fetch('http://192.168.1.x:8080/protected/call/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_extension: targetExtension }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setCallStatus(`Call initiated to ${targetExtension} (Channel: ${data.channel})`);
        uaRef.current.call(`sip:${targetExtension}@192.168.1.194`, {
          mediaConstraints: { audio: true, video: false },
        });
      } else {
        setCallStatus(`Failed to initiate call: ${data.error}`);
      }
    } catch (error) {
      setCallStatus(`Error initiating call: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [targetExtension, setIsLoading]);

  const answerCall = useCallback(async (channel) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.1.x:8080/protected/call/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setCallStatus('Call answered');
        if (callRef.current?.session) {
          callRef.current.session.answer({
            mediaConstraints: { audio: true, video: false },
          });
        }
      } else {
        setCallStatus(`Failed to answer call: ${data.error}`);
      }
    } catch (error) {
      setCallStatus(`Error answering call: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

  const hangup = useCallback(async () => {
    if (!callRef.current) {
      setCallStatus('No active call to hang up');
      return;
    }

    setIsLoading(true);
    try {
      callRef.current.session.terminate();
      const response = await fetch('http://192.168.1.x:8080/protected/call/hangup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: callRef.current.session?.connection?.remote_identity?.uri?.user || '' }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setCallStatus('Call hung up');
      } else {
        setCallStatus(`Failed to hang up: ${data.error}`);
      }
    } catch (error) {
      setCallStatus(`Error hanging up: ${error.message}`);
    } finally {
      callRef.current = null;
      setIsLoading(false);
    }
  }, [setIsLoading]);

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-md mb-4 animate-[fadeInUp_1.8s_ease-out_forwards]`}>
      <h2 className="text-xl font-semibold mb-4">VoIP Phone</h2>
      <p><strong>Status:</strong> {status}</p>
      <p><strong>Call Status:</strong> {callStatus}</p>
      <div className="flex flex-col gap-4 mt-4">
        <input
          type="text"
          placeholder="Extension (e.g., 1001)"
          value={extension}
          disabled
          className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          disabled
          className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
        />
        <button
          onClick={register}
          className={`p-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
        >
          Register
        </button>
        <input
          type="text"
          placeholder="Target Extension (e.g., 1002)"
          value={targetExtension}
          onChange={(e) => setTargetExtension(e.target.value)}
          className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
        />
        <div className="flex gap-4">
          <button
            onClick={makeCall}
            className={`p-2 rounded flex-1 ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}
          >
            Call
          </button>
          <button
            onClick={hangup}
            className={`p-2 rounded flex-1 ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
          >
            Hang Up
          </button>
        </div>
      </div>
      <audio ref={audioRef} id="remoteAudio" autoPlay />
    </div>
  );
};

export default VoipPhone;