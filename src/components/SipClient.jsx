import React, { useEffect, useState } from 'react';
import { UserAgent, Registerer } from 'sip.js';

const SipClient = ({ extension, sipPassword }) => {
  const [status, setStatus] = useState('Disconnected');

  useEffect(() => {
    if (!extension || !sipPassword) {
      setStatus('Missing credentials');
      return;
    }

    const wsUri = 'ws://192.168.1.194:8088/ws';
    const sipUri = `sip:${extension}@192.168.1.194`;

    const userAgent = new UserAgent({
      uri: UserAgent.makeURI(sipUri),
      transportOptions: {
        server: wsUri,
        traceSip: true,
      },
      authorizationUsername: extension,
      authorizationPassword: sipPassword,
      displayName: extension,
      register: true,
      registerExpires: 3600,
      userAgentString: 'VoIP-WebRTC-Client',
      log: {
        builtinEnabled: true,
        level: 'debug',
      },
    });

    const registerer = new Registerer(userAgent);

    userAgent.delegate = {
      onConnect: () => {
        console.log(`Connected to WebSocket for ${extension}`);
      },
      onDisconnect: (error) => {
        setStatus(`Disconnected: ${error?.message || 'Unknown error'}`);
        console.log(`Disconnected for ${extension}: ${error}`);
      },
    };

    registerer.stateChange.addListener((state) => {
      switch (state) {
        case 'Registered':
          setStatus('Registered');
          console.log(`Endpoint ${extension} registered successfully`);
          break;
        case 'Unregistered':
          setStatus('Unregistered');
          console.log(`Endpoint ${extension} unregistered`);
          break;
        case 'RegistrationFailed':
          setStatus(`Registration Failed`);
          console.error(`Registration failed for ${extension}`);
          break;
        default:
          console.log(`Registerer state: ${state}`);
      }
    });

    userAgent
      .start()
      .then(() => {
        console.log(`SIP UserAgent started for ${extension}`);
        return registerer.register();
      })
      .catch((err) => {
        setStatus(`Connection Failed: ${err.message}`);
        console.error(`SIP UserAgent failed to start for ${extension}:`, err);
      });

    return () => {
      registerer.unregister();
      userAgent.stop();
      console.log(`SIP UserAgent stopped for ${extension}`);
    };
  }, [extension, sipPassword]);

  return (
    <div className="sip-client">
      <h3>SIP Status: {status}</h3>
      <p>Extension: {extension || 'None'}</p>
    </div>
  );
};

export default SipClient;