import { sendWebSocketMessage } from "./websocketservice";
import { hangup } from "./hang";

export const handleIncomingCall = async (
  callData,
  user,
  onAccept,
  onReject
) => {
  let peerConnection = null;
  let stream = null;

  try {
    peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    });

    // Only set remote description if offer is available
    if (callData.offer && callData.offer.type && callData.offer.sdp) {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(callData.offer)
      );
    }

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendWebSocketMessage({
          type: "webrtc_ice_candidate",
          to: callData.from,
          from: user.extension,
          candidate: event.candidate,
          channel: callData.channel
        }).catch((error) => {
          console.error("Failed to send ICE candidate:", error);
        });
      }
    };

    peerConnection.ontrack = (event) => {
      stream = event.streams[0];
      onAccept(stream, peerConnection);
    };

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      if (state === "failed" || state === "disconnected") {
        console.error("Call connection state:", state);
        cleanup();
        onReject();
      }
    };

    const acceptCall = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

        // If we have an offer, create answer immediately
        if (callData.offer && callData.offer.type && callData.offer.sdp) {
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          await sendWebSocketMessage({
            type: "answer",
            to: callData.from,
            from: user.extension,
            answer,
            channel: callData.channel,
            transport: callData.transport || "transport-ws",
          });
        } else {
          // For calls without initial offer, just send acceptance message
          // The WebRTC negotiation will happen via separate offer/answer messages
          await sendWebSocketMessage({
            type: "answer_call",
            to: callData.from,
            from: user.extension,
            channel: callData.channel,
            transport: callData.transport || "transport-ws",
          });
        }
      } catch (error) {
        console.error("Error accepting call:", error);
        cleanup();
        throw error;
      }
    };

    const rejectCall = async () => {
      try {
        await hangup(callData.channel);
        await sendWebSocketMessage({
          type: "hangup",
          to: callData.from,
          from: user.extension,
          channel: callData.channel,
          transport: callData.transport || "transport-ws",
        });
        cleanup();
        onReject();
      } catch (error) {
        console.error("Error rejecting call:", error);
        cleanup();
        throw error;
      }
    };

    const cleanup = () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
      }
    };

    return { acceptCall, rejectCall };
  } catch (error) {
    console.error("Error initializing incoming call:", error);
    if (peerConnection) peerConnection.close();
    throw error;
  }
};