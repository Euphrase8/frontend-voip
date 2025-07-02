import React, { useState, useEffect } from 'react';
import WebRTCPhone from '../components/WebRTCPhone';
import { updateUserStatus } from '../services/users';

const WebRTCTestPage = () => {
  const [extension, setExtension] = useState('');
  const [callStatus, setCallStatus] = useState('Ready');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Get extension from localStorage
    const storedExtension = localStorage.getItem('extension');
    const token = localStorage.getItem('token');
    
    if (storedExtension && token) {
      setExtension(storedExtension);
      setIsLoggedIn(true);
      
      // Set user status to online
      updateUserStatus('online').catch(console.error);
    }
  }, []);

  const handleCallStatusChange = (status) => {
    setCallStatus(status);
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>WebRTC Test Page</h2>
        <p>Please login first to use the WebRTC phone.</p>
        <button onClick={() => window.location.href = '/'}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>WebRTC Phone Test</h1>
      
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>Current Status</h3>
        <p><strong>Extension:</strong> {extension}</p>
        <p><strong>Call Status:</strong> {callStatus}</p>
      </div>

      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '20px',
        backgroundColor: 'white'
      }}>
        <WebRTCPhone 
          extension={extension} 
          onCallStatusChange={handleCallStatusChange}
        />
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#e8f4fd', 
        borderRadius: '8px' 
      }}>
        <h4>How to Test WebRTC Calling:</h4>
        <ol>
          <li>Make sure you're logged in with an extension (e.g., 1001)</li>
          <li>Open another browser tab/window and login with a different extension (e.g., 1000)</li>
          <li>In this tab, enter the target extension and click "Call"</li>
          <li>In the other tab, you should see an incoming call notification</li>
          <li>Accept the call to establish WebRTC connection</li>
        </ol>
        
        <h4>Advantages of WebRTC Method:</h4>
        <ul>
          <li>✅ No dependency on Asterisk endpoint registration</li>
          <li>✅ Faster call setup</li>
          <li>✅ Direct peer-to-peer audio</li>
          <li>✅ Works even if Asterisk SIP endpoints are not configured</li>
          <li>✅ Easier to debug and troubleshoot</li>
        </ul>
      </div>

      <div style={{ 
        marginTop: '20px', 
        textAlign: 'center' 
      }}>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default WebRTCTestPage;
