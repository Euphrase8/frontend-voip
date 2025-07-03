import CONFIG from './config';
import { checkBrowserCompatibility, getMediaStreamWithFallback } from '../utils/browserCompat';

class WebRTCCallService {
  constructor() {
    this.ws = null;
    this.currentCall = null;
    this.peerConnection = null;
    this.localStream = null;
    this.onIncomingCall = null;
    this.onCallStatusChange = null;
    
    // WebRTC configuration
    this.rtcConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
  }

  // Check browser compatibility with HTTP support
  checkBrowserSupport() {
    return checkBrowserCompatibility();
  }

  // Initialize WebRTC service with extension
  initialize(extension, onIncomingCall, onCallStatusChange, onCallEnded) {
    this.extension = extension;
    this.onIncomingCall = onIncomingCall;
    this.onCallStatusChange = onCallStatusChange;
    this.onCallEnded = onCallEnded;

    // Check browser support
    const support = this.checkBrowserSupport();
    if (!support.supported) {
      console.error('[WebRTCCallService] Browser compatibility issues:', support.issues);
      this.onCallStatusChange && this.onCallStatusChange(`Browser not supported: ${support.issues.join(', ')}`);
      return;
    }

    // Show warnings but continue
    if (support.warnings && support.warnings.length > 0) {
      console.warn('[WebRTCCallService] Browser warnings:', support.warnings);
      // Don't block initialization for warnings
    }

    this.setupWebSocket();
  }

  // Setup WebSocket connection for WebRTC signaling
  setupWebSocket() {
    if (!this.extension) return;
    
    const wsUrl = `${CONFIG.WS_URL}?extension=${encodeURIComponent(this.extension)}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[WebRTCCallService] WebSocket connected');
      this.onCallStatusChange && this.onCallStatusChange('Ready');
    };

    this.ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log('[WebRTCCallService] Received message:', message);

      switch (message.type) {
        case 'webrtc_call_invitation':
          this.handleIncomingCallInvitation(message);
          break;
        case 'webrtc_call_accepted':
          this.handleCallAccepted(message);
          break;
        case 'webrtc_call_rejected':
          this.handleCallRejected(message);
          break;
        case 'webrtc_offer':
          this.handleOffer(message);
          break;
        case 'webrtc_answer':
          this.handleAnswer(message);
          break;
        case 'webrtc_ice_candidate':
          this.handleIceCandidate(message);
          break;
        case 'webrtc_call_ended':
          this.handleCallEnded(message);
          break;
      }
    };

    this.ws.onclose = () => {
      console.log('[WebRTCCallService] WebSocket disconnected');
      this.onCallStatusChange && this.onCallStatusChange('Disconnected');
    };

    this.ws.onerror = (error) => {
      console.error('[WebRTCCallService] WebSocket error:', error);
    };
  }

  // Handle incoming call invitation
  handleIncomingCallInvitation(message) {
    console.log('[WebRTCCallService] Incoming call from:', message.caller_extension);
    
    this.currentCall = {
      id: message.call_id,
      caller: message.caller_extension,
      callerUsername: message.caller_username,
      type: 'incoming'
    };

    // Notify the UI about incoming call
    if (this.onIncomingCall) {
      this.onIncomingCall({
        from: message.caller_extension,
        fromUsername: message.caller_username,
        callId: message.call_id,
        onAccept: () => this.acceptCall(),
        onReject: () => this.rejectCall()
      });
    }

    this.onCallStatusChange && this.onCallStatusChange(`Incoming call from ${message.caller_extension}`);
  }

  // Accept incoming call
  async acceptCall() {
    if (!this.currentCall) return;

    try {
      console.log('[WebRTCCallService] Accepting call:', this.currentCall.id);
      
      // Setup local media
      await this.setupLocalMedia();
      
      // Send acceptance via WebSocket
      this.sendMessage({
        type: 'webrtc_call_accepted',
        call_id: this.currentCall.id,
        target_extension: this.currentCall.caller
      });

      this.onCallStatusChange && this.onCallStatusChange(`Connecting to ${this.currentCall.caller}...`);
      
    } catch (error) {
      console.error('[WebRTCCallService] Failed to accept call:', error);

      // Provide user-friendly error message
      this.onCallStatusChange && this.onCallStatusChange(`Call failed: ${error.message}`);

      // Auto-reject the call after a brief delay to show the error
      setTimeout(() => {
        this.rejectCall();
      }, 3000);
    }
  }

  // Reject incoming call
  rejectCall() {
    if (!this.currentCall) return;

    console.log('[WebRTCCallService] Rejecting call:', this.currentCall.id);
    
    this.sendMessage({
      type: 'webrtc_call_rejected',
      call_id: this.currentCall.id,
      target_extension: this.currentCall.caller
    });

    this.currentCall = null;
    this.onCallStatusChange && this.onCallStatusChange('Call rejected');
  }

  // Handle call accepted by target
  async handleCallAccepted(message) {
    console.log('[WebRTCCallService] Call accepted by target');
    await this.createPeerConnection();
    await this.createOffer();
    this.onCallStatusChange && this.onCallStatusChange('Connecting...');
  }

  // Handle call rejected by target
  handleCallRejected(message) {
    console.log('[WebRTCCallService] Call rejected by target');
    this.currentCall = null;
    this.onCallStatusChange && this.onCallStatusChange('Call rejected');
  }

  // Setup local media (audio) with HTTP support
  async setupLocalMedia() {
    try {
      console.log('[WebRTCCallService] Setting up local media...');

      // Use the enhanced compatibility utility
      this.localStream = await getMediaStreamWithFallback({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      console.log('[WebRTCCallService] Local media setup successful');
      return this.localStream;

    } catch (error) {
      console.error('[WebRTCCallService] Failed to get local media:', error);
      throw error; // Re-throw the enhanced error message from browserCompat
    }
  }

  // Create peer connection
  async createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.rtcConfiguration);
    
    // Add local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTCCallService] Received remote stream');
      const remoteStream = event.streams[0];
      
      // Play remote audio
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.play().catch(console.error);
      
      this.onCallStatusChange && this.onCallStatusChange('Connected');
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendMessage({
          type: 'webrtc_ice_candidate',
          candidate: event.candidate,
          target_extension: this.currentCall.caller || this.currentCall.target
        });
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log('[WebRTCCallService] Connection state:', state);
      
      if (state === 'connected') {
        this.onCallStatusChange && this.onCallStatusChange('Connected');
      } else if (state === 'failed' || state === 'disconnected') {
        this.endCall();
      }
    };
  }

  // Create and send offer
  async createOffer() {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    
    this.sendMessage({
      type: 'webrtc_offer',
      offer: offer,
      target_extension: this.currentCall.target
    });
  }

  // Handle received offer
  async handleOffer(message) {
    await this.createPeerConnection();
    await this.peerConnection.setRemoteDescription(message.offer);
    
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    
    this.sendMessage({
      type: 'webrtc_answer',
      answer: answer,
      target_extension: message.caller_extension
    });
  }

  // Handle received answer
  async handleAnswer(message) {
    await this.peerConnection.setRemoteDescription(message.answer);
  }

  // Handle ICE candidate
  async handleIceCandidate(message) {
    if (this.peerConnection) {
      await this.peerConnection.addIceCandidate(message.candidate);
    }
  }

  // Handle call ended
  handleCallEnded(message) {
    console.log('[WebRTCCallService] Call ended by peer');

    // Notify UI that call ended (to clear incoming call UI)
    if (this.onCallEnded) {
      this.onCallEnded();
    }

    this.endCall();
  }

  // End current call
  endCall() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.currentCall) {
      this.sendMessage({
        type: 'webrtc_call_ended',
        target_extension: this.currentCall.caller || this.currentCall.target
      });
    }

    this.currentCall = null;
    this.onCallStatusChange && this.onCallStatusChange('Call ended');
  }

  // Send message via WebSocket
  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('[WebRTCCallService] WebSocket not connected');
    }
  }

  // Cleanup
  cleanup() {
    this.endCall();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Export singleton instance
export default new WebRTCCallService();
