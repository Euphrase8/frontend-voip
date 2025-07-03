import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiPhone as Phone,
  FiPhoneOff as PhoneOff
} from 'react-icons/fi';
import { connectWebSocket, sendWebSocketMessage } from '../services/websocketservice';
import { answerCall } from '../services/call';
import { getInitials } from '../utils/ui';

const IncomingCallListener = () => {
  const [callInfo, setCallInfo] = useState(null);
  const [ws, setWs] = useState(null);
  const navigate = useNavigate(); // Add navigate hook

  useEffect(() => {
    const connect = () => {
      const websocket = connectWebSocket();
      setWs(websocket);

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[IncomingCallListener] Received message:', message);

          if (message.type === 'incoming_call') {
            setCallInfo({
              caller: message.caller,
              channel: message.channel,
              priority: message.priority || 'normal',
              transport: message.transport || 'transport-ws',
            });
          } else if (message.type === 'call_ended' || message.type === 'hangup') {
            // Clear incoming call UI when call is ended by the other party
            console.log('[IncomingCallListener] Call ended, clearing incoming call UI');
            setCallInfo(null);
          }
        } catch (err) {
          console.error('❌ Invalid message format:', event.data);
        }
      };

      websocket.onclose = () => {
        console.warn('⚠️ WebSocket closed. Reconnecting in 5s...');
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleAnswer = async () => {
    if (ws && callInfo) {
      try {
        const { stream } = await answerCall(callInfo.channel); // Get stream
        await sendWebSocketMessage({
          type: 'answer_call',
          channel: callInfo.channel,
          extension: callInfo.caller,
          transport: callInfo.transport,
        });

        // Clear call info immediately to hide incoming call UI
        setCallInfo(null);

        navigate('/calling', {
          state: {
            contact: { extension: callInfo.caller, name: `Ext ${callInfo.caller}` },
            callStatus: 'Connected',
            isOutgoing: false,
            stream,
            channel: callInfo.channel,
            transport: callInfo.transport,
          },
        });
      } catch (error) {
        console.error('Failed to answer call:', error);
      }
    }
  };

  const handleReject = () => {
    if (ws && callInfo) {
      sendWebSocketMessage({
        type: 'hangup_call',
        channel: callInfo.channel,
      }).catch((error) => console.error('Failed to send hangup message:', error));
      setCallInfo(null);
    }
  };

  if (!callInfo) {
    return null; // Don't show anything when no incoming call
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-indigo-100"
      >
        {/* Header */}
        <div className="bg-indigo-500 px-6 py-4 relative">
          {/* Decorative elements */}
          <div className="absolute top-2 right-4 w-2 h-2 bg-indigo-300 rounded-full opacity-60"></div>
          <div className="absolute bottom-2 right-8 w-1 h-1 bg-indigo-300 rounded-full opacity-40"></div>

          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg"></div>
            <h3 className="text-white font-bold text-lg">Incoming Call</h3>
          </div>
        </div>

        {/* Caller Info */}
        <div className="p-6 text-center bg-slate-50">
          {/* Avatar */}
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mx-auto bg-indigo-500 border-4 border-indigo-400 shadow-lg">
              <span className="text-2xl font-bold text-white">
                {getInitials(callInfo.caller || 'Unknown')}
              </span>
            </div>
          </div>

          {/* Caller Name */}
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {callInfo.caller || 'Unknown Caller'}
          </h2>

          {/* Call Details */}
          <div className="space-y-2 mb-6">
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-600 text-sm font-medium">
                Extension: <span className="text-indigo-600 font-semibold">{callInfo.caller}</span>
              </p>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-600 text-xs">
                Channel: <span className="text-slate-800 font-medium">{callInfo.channel}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            {/* Reject Button */}
            <button
              onClick={handleReject}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg border-2 border-red-400 hover:border-red-500 hover:scale-105"
            >
              <PhoneOff className="w-5 h-5" />
              <span>Decline</span>
            </button>

            {/* Answer Button */}
            <button
              onClick={handleAnswer}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg border-2 border-emerald-400 hover:border-emerald-500 hover:scale-105"
            >
              <Phone className="w-5 h-5" />
              <span>Answer</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default IncomingCallListener;