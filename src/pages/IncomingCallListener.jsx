import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import { Box, Typography, Button, Paper } from '@mui/material';
import { connectWebSocket, sendWebSocketMessage } from '../services/websocketservice';
import { answerCall } from '../services/call'; // Import answerCall for stream handling

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

  return (
    <Box sx={{ p: 2 }}>
      {callInfo ? (
        <Paper elevation={4} sx={{ p: 3, backgroundColor: '#fefefe', borderRadius: 2 }}>
          <Typography variant="h6" color="primary">📞 Incoming Call</Typography>
          <Typography variant="body1">Caller: {callInfo.caller}</Typography>
          <Typography variant="body2">Channel: {callInfo.channel}</Typography>
          <Typography variant="body2">Priority: {callInfo.priority}</Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button variant="contained" color="success" onClick={handleAnswer}>
              Answer
            </Button>
            <Button variant="outlined" color="error" onClick={handleReject}>
              Reject
            </Button>
          </Box>
        </Paper>
      ) : (
        <Typography>No incoming calls...</Typography>
      )}
    </Box>
  );
};

export default IncomingCallListener;