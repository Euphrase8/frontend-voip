import React, { useState, useRef, useEffect } from 'react';
import CONFIG from '../services/config';

const WebRTCPhone = ({ extension, onCallStatusChange }) => {
  const [targetExtension, setTargetExtension] = useState('');
  const [callStatus, setCallStatus] = useState('Ready');
  const [isInCall, setIsInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const wsRef = useRef(null);

  // WebRTC configuration
  const rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    setupWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [extension]);

  const setupWebSocket = () => {
    if (!extension) return;
    
    const wsUrl = `${CONFIG.WS_URL}?extension=${encodeURIComponent(extension)}`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('[WebRTCPhone] WebSocket connected');
      setCallStatus('Ready');
    };

    wsRef.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log('[WebRTCPhone] Received message:', message);

      switch (message.type) {
        case 'webrtc_call_invitation':
          handleIncomingCall(message);
          break;
        case 'webrtc_call_initiated':
          setCallStatus(`Calling ${message.target}...`);
          break;
        case 'webrtc_call_accepted':
          handleCallAccepted(message);
          break;
        case 'webrtc_call_rejected':
          handleCallRejected(message);
          break;
        case 'webrtc_offer':
          handleOffer(message);
          break;
        case 'webrtc_answer':
          handleAnswer(message);
          break;
        case 'webrtc_ice_candidate':
          handleIceCandidate(message);
          break;
        case 'webrtc_call_ended':
          handleCallEnded(message);
          break;
      }
    };

    wsRef.current.onclose = () => {
      console.log('[WebRTCPhone] WebSocket disconnected');
      setCallStatus('Disconnected');
    };
  };

  const makeCall = async () => {
    if (!targetExtension) {
      setCallStatus('Please enter target extension');
      return;
    }

    try {
      setCallStatus('Initiating call...');
      
      // Call backend with WebRTC method
      const response = await fetch(`${CONFIG.API_URL}/protected/call/initiate?method=webrtc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ target_extension: targetExtension }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('[WebRTCPhone] Call initiated:', data);
        setCallStatus(`Calling ${targetExtension}...`);
        
        // Setup local media for the call
        await setupLocalMedia();
        
        onCallStatusChange && onCallStatusChange(`Calling ${targetExtension}...`);
      } else {
        setCallStatus(`Failed: ${data.error}`);
        onCallStatusChange && onCallStatusChange(`Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('[WebRTCPhone] Call initiation failed:', error);
      setCallStatus('Call failed');
      onCallStatusChange && onCallStatusChange('Call failed');
    }
  };

  const handleIncomingCall = (message) => {
    setIncomingCall(message);
    setCallStatus(`Incoming call from ${message.caller_extension}`);
    onCallStatusChange && onCallStatusChange(`Incoming call from ${message.caller_extension}`);
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      await setupLocalMedia();
      
      // Send acceptance via WebSocket
      wsRef.current.send(JSON.stringify({
        type: 'webrtc_call_accepted',
        call_id: incomingCall.call_id,
        target_extension: incomingCall.caller_extension
      }));

      setIsInCall(true);
      setCallStatus(`Connected to ${incomingCall.caller_extension}`);
      setIncomingCall(null);
      
      onCallStatusChange && onCallStatusChange(`Connected to ${incomingCall.caller_extension}`);
    } catch (error) {
      console.error('[WebRTCPhone] Failed to accept call:', error);
      rejectCall();
    }
  };

  const rejectCall = () => {
    if (!incomingCall) return;

    wsRef.current.send(JSON.stringify({
      type: 'webrtc_call_rejected',
      call_id: incomingCall.call_id,
      target_extension: incomingCall.caller_extension
    }));

    setIncomingCall(null);
    setCallStatus('Ready');
    onCallStatusChange && onCallStatusChange('Call rejected');
  };

  const setupLocalMedia = async () => {
    try {
      console.log('[WebRTCPhone] Setting up local media...');

      let stream = null;

      // Try modern getUserMedia first
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
            video: false
          });
        } catch (modernError) {
          console.warn('[WebRTCPhone] Enhanced getUserMedia failed, trying basic:', modernError);

          // Try basic constraints
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false
            });
          } catch (basicError) {
            console.warn('[WebRTCPhone] Basic getUserMedia failed:', basicError);
          }
        }
      }

      // Try legacy getUserMedia if modern failed
      if (!stream) {
        const getUserMedia = navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia;

        if (getUserMedia) {
          console.log('[WebRTCPhone] Trying legacy getUserMedia...');
          stream = await new Promise((resolve, reject) => {
            getUserMedia.call(navigator, { audio: true, video: false }, resolve, reject);
          });
        }
      }

      if (!stream) {
        throw new Error('Unable to access microphone');
      }

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      console.log('[WebRTCPhone] Local media setup successful');
      return stream;
    } catch (error) {
      console.error('[WebRTCPhone] Failed to get local media:', error);

      // Provide helpful error messages
      if (error.name === 'NotAllowedError') {
        const isHTTP = window.location.protocol === 'http:' &&
                      window.location.hostname !== 'localhost' &&
                      window.location.hostname !== '127.0.0.1';

        if (isHTTP) {
          throw new Error('Microphone access denied. HTTP sites have limited access. Please allow microphone in browser settings or use HTTPS.');
        } else {
          throw new Error('Microphone access denied. Please allow microphone access.');
        }
      }

      throw error;
    }
  };

  const handleCallAccepted = async (message) => {
    console.log('[WebRTCPhone] Call accepted, creating peer connection');
    await createPeerConnection();
    await createOffer();
    setIsInCall(true);
    setCallStatus('Connecting...');
  };

  const handleCallRejected = (message) => {
    setCallStatus('Call rejected');
    setIsInCall(false);
    onCallStatusChange && onCallStatusChange('Call rejected');
  };

  const createPeerConnection = async () => {
    peerConnectionRef.current = new RTCPeerConnection(rtcConfiguration);
    
    // Add local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      console.log('[WebRTCPhone] Received remote stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setCallStatus('Connected');
      onCallStatusChange && onCallStatusChange('Connected');
    };

    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current.send(JSON.stringify({
          type: 'webrtc_ice_candidate',
          candidate: event.candidate,
          target_extension: targetExtension
        }));
      }
    };
  };

  const createOffer = async () => {
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    
    wsRef.current.send(JSON.stringify({
      type: 'webrtc_offer',
      offer: offer,
      target_extension: targetExtension
    }));
  };

  const handleOffer = async (message) => {
    await createPeerConnection();
    await peerConnectionRef.current.setRemoteDescription(message.offer);
    
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);
    
    wsRef.current.send(JSON.stringify({
      type: 'webrtc_answer',
      answer: answer,
      target_extension: message.caller_extension
    }));
  };

  const handleAnswer = async (message) => {
    await peerConnectionRef.current.setRemoteDescription(message.answer);
  };

  const handleIceCandidate = async (message) => {
    await peerConnectionRef.current.addIceCandidate(message.candidate);
  };

  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    wsRef.current.send(JSON.stringify({
      type: 'webrtc_call_ended',
      target_extension: targetExtension
    }));

    setIsInCall(false);
    setCallStatus('Ready');
    setIncomingCall(null);
    onCallStatusChange && onCallStatusChange('Call ended');
  };

  const handleCallEnded = (message) => {
    endCall();
  };

  return (
    <div className="webrtc-phone">
      <h3>WebRTC Phone (Extension: {extension})</h3>
      
      <div className="call-status">
        <p>Status: {callStatus}</p>
      </div>

      {!isInCall && !incomingCall && (
        <div className="call-controls">
          <input
            type="text"
            placeholder="Target Extension"
            value={targetExtension}
            onChange={(e) => setTargetExtension(e.target.value)}
          />
          <button onClick={makeCall}>Call</button>
        </div>
      )}

      {incomingCall && (
        <div className="incoming-call">
          <p>Incoming call from {incomingCall.caller_extension}</p>
          <button onClick={acceptCall}>Accept</button>
          <button onClick={rejectCall}>Reject</button>
        </div>
      )}

      {isInCall && (
        <div className="in-call-controls">
          <button onClick={endCall}>End Call</button>
        </div>
      )}

      <div className="media-elements" style={{ display: 'none' }}>
        <audio ref={localVideoRef} autoPlay muted />
        <audio ref={remoteVideoRef} autoPlay />
      </div>
    </div>
  );
};

export default WebRTCPhone;
