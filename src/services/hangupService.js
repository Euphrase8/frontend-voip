// Comprehensive Hangup Service
// Handles all types of call termination (SIP, WebRTC, WebSocket)

import CONFIG from './config';
import webrtcCallService from './webrtcCallService';
import { sendWebSocketMessage } from './websocketservice';

class HangupService {
  constructor() {
    this.activeHangups = new Set(); // Prevent duplicate hangup attempts
  }

  // Main hangup method - determines call type and uses appropriate method
  async hangupCall(channel, callType = 'auto') {
    if (!channel) {
      console.warn('[HangupService] No channel provided for hangup');
      return { success: false, error: 'No channel provided' };
    }

    // Prevent duplicate hangup attempts
    if (this.activeHangups.has(channel)) {
      console.log('[HangupService] Hangup already in progress for channel:', channel);
      return { success: true, message: 'Hangup already in progress' };
    }

    this.activeHangups.add(channel);

    try {
      console.log('[HangupService] Starting hangup for channel:', channel, 'type:', callType);

      // Determine call type if not specified
      if (callType === 'auto') {
        callType = this.detectCallType(channel);
      }

      let result;
      switch (callType) {
        case 'webrtc':
          result = await this.hangupWebRTCCall(channel);
          break;
        case 'sip':
          result = await this.hangupSIPCall(channel);
          break;
        case 'websocket':
          result = await this.hangupWebSocketCall(channel);
          break;
        default:
          // Try all methods for unknown call types
          result = await this.hangupAllMethods(channel);
      }

      console.log('[HangupService] Hangup result:', result);
      return result;

    } catch (error) {
      console.error('[HangupService] Hangup failed:', error);
      return { success: false, error: error.message };
    } finally {
      // Always remove from active hangups
      setTimeout(() => {
        this.activeHangups.delete(channel);
      }, 1000);
    }
  }

  // Detect call type based on channel format
  detectCallType(channel) {
    if (channel.startsWith('webrtc-call-') || channel.includes('webrtc')) {
      return 'webrtc';
    } else if (channel.startsWith('ws-') || channel.includes('websocket')) {
      return 'websocket';
    } else {
      return 'sip';
    }
  }

  // Hangup WebRTC call
  async hangupWebRTCCall(channel) {
    console.log('[HangupService] Hanging up WebRTC call:', channel);
    
    try {
      // Use WebRTC service to end call
      webrtcCallService.endCall();
      
      // Also send WebSocket message for coordination
      await this.sendHangupMessage(channel, 'webrtc_call_ended');
      
      return { success: true, method: 'webrtc', channel };
    } catch (error) {
      console.error('[HangupService] WebRTC hangup failed:', error);
      throw error;
    }
  }

  // Hangup SIP call
  async hangupSIPCall(channel) {
    console.log('[HangupService] Hanging up SIP call:', channel);
    
    const results = [];
    
    try {
      // Method 1: Backend API hangup
      try {
        const apiResult = await this.callBackendHangup(channel);
        results.push({ method: 'api', success: apiResult.success });
      } catch (apiError) {
        console.warn('[HangupService] API hangup failed:', apiError);
        results.push({ method: 'api', success: false, error: apiError.message });
      }

      // Method 2: WebSocket hangup message
      try {
        await this.sendHangupMessage(channel, 'hangup');
        results.push({ method: 'websocket', success: true });
      } catch (wsError) {
        console.warn('[HangupService] WebSocket hangup failed:', wsError);
        results.push({ method: 'websocket', success: false, error: wsError.message });
      }

      // Check if at least one method succeeded
      const hasSuccess = results.some(r => r.success);
      
      return {
        success: hasSuccess,
        method: 'sip',
        channel,
        results
      };

    } catch (error) {
      console.error('[HangupService] SIP hangup failed:', error);
      throw error;
    }
  }

  // Hangup WebSocket call
  async hangupWebSocketCall(channel) {
    console.log('[HangupService] Hanging up WebSocket call:', channel);
    
    try {
      await this.sendHangupMessage(channel, 'hangup_call');
      return { success: true, method: 'websocket', channel };
    } catch (error) {
      console.error('[HangupService] WebSocket hangup failed:', error);
      throw error;
    }
  }

  // Try all hangup methods (for unknown call types)
  async hangupAllMethods(channel) {
    console.log('[HangupService] Trying all hangup methods for:', channel);
    
    const results = [];
    
    // Try WebRTC first
    try {
      const webrtcResult = await this.hangupWebRTCCall(channel);
      results.push(webrtcResult);
    } catch (error) {
      results.push({ method: 'webrtc', success: false, error: error.message });
    }

    // Try SIP
    try {
      const sipResult = await this.hangupSIPCall(channel);
      results.push(sipResult);
    } catch (error) {
      results.push({ method: 'sip', success: false, error: error.message });
    }

    // Try WebSocket
    try {
      const wsResult = await this.hangupWebSocketCall(channel);
      results.push(wsResult);
    } catch (error) {
      results.push({ method: 'websocket', success: false, error: error.message });
    }

    const hasSuccess = results.some(r => r.success);
    
    return {
      success: hasSuccess,
      method: 'all',
      channel,
      results
    };
  }

  // Call backend hangup API
  async callBackendHangup(channel) {
    try {
      const response = await fetch(`${CONFIG.API_URL}/protected/call/hangup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ channel })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[HangupService] Backend hangup successful:', data);
        return { success: true, data };
      } else {
        const errorText = await response.text();
        console.warn('[HangupService] Backend hangup failed:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
    } catch (error) {
      console.error('[HangupService] Backend hangup error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send hangup message via WebSocket
  async sendHangupMessage(channel, messageType = 'hangup') {
    try {
      await sendWebSocketMessage({
        type: messageType,
        channel: channel,
        timestamp: Date.now()
      });
      console.log('[HangupService] WebSocket hangup message sent:', messageType);
    } catch (error) {
      console.error('[HangupService] Failed to send WebSocket hangup message:', error);
      throw error;
    }
  }

  // Emergency hangup - force cleanup of all resources
  emergencyHangup() {
    console.log('[HangupService] Emergency hangup - cleaning up all resources');
    
    try {
      // Force WebRTC cleanup
      webrtcCallService.cleanup();
      
      // Clear active hangups
      this.activeHangups.clear();
      
      console.log('[HangupService] Emergency hangup complete');
      return { success: true, method: 'emergency' };
    } catch (error) {
      console.error('[HangupService] Emergency hangup failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get status of active hangups
  getActiveHangups() {
    return Array.from(this.activeHangups);
  }

  // Clear all active hangups (for debugging)
  clearActiveHangups() {
    this.activeHangups.clear();
    console.log('[HangupService] Cleared all active hangups');
  }
}

// Create singleton instance
const hangupService = new HangupService();

// Export convenience functions
export const hangupCall = (channel, callType) => hangupService.hangupCall(channel, callType);
export const emergencyHangup = () => hangupService.emergencyHangup();
export const getActiveHangups = () => hangupService.getActiveHangups();
export const clearActiveHangups = () => hangupService.clearActiveHangups();

export default hangupService;
