import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/login';
import { connectWebSocket } from '../services/websocketservice';
import Logo from '../assets/Login.png';

const LoginPage = ({ onLogin, onSwitchToRegister }) => {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateStep = () => {
    if (step === 0) return username.trim().length >= 3;
    if (step === 1) return password.length >= 6;
    return false;
  };

  const nextStep = async () => {
    if (!validateStep()) {
      setNotification({ message: 'Please fill in valid information.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (step === 0) {
      setStep(1);
    } else {
      setLoading(true);
      try {
        const result = await login(username, password);
        if (result.success) {
          setNotification({ message: `${result.message} (Ext: ${result.user.extension})`, type: 'success' });

          // Connect WebSocket after successful login
          connectWebSocket(result.user.extension, (data) => {
            if (data.type === 'incoming-call') {
              alert(`Incoming call from ${data.from} (Priority: ${data.priority})`);
            }
          });

          setTimeout(() => {
            onLogin(result.user);
            navigate('/dashboard', { state: { success: result.message }, user: result.user });
          }, 1000);
        } else {
          setNotification({ message: result.message, type: 'error' });
          setTimeout(() => setNotification(null), 3000);
        }
      } catch {
        setNotification({ message: 'Login failed. Please check your credentials.', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') nextStep();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-4">
          <img src={Logo} alt="Logo" className="w-24 h-24 rounded-full object-contain mb-2" />
          <h3 className="text-sm font-bold text-center">THE INSTITUTE OF FINANCE MANAGEMENT</h3>
          <h2 className="text-2xl font-extrabold text-gray-900 text-center">VoIP Login</h2>
        </div>

        {[{ label: 'Username', value: username, set: setUsername, type: 'text' },
          { label: 'Password', value: password, set: setPassword, type: 'password' }]
          .map((field, index) => (
          <div
            key={index}
            className={`transition-all duration-500 ${step === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}
          >
            <label className="block text-sm font-medium">{field.label}</label>
            <input
              type={field.type}
              value={field.value}
              onChange={(e) => field.set(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-3 border rounded-lg bg-gray-50"
              autoFocus={step === index}
              disabled={loading}
              placeholder={`Enter your ${field.label.toLowerCase()}`}
            />
          </div>
        ))}

        {notification && (
          <p className={`mt-2 text-center text-sm ${notification.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {notification.message}
          </p>
        )}

        <button
          type="button"
          onClick={nextStep}
          disabled={loading}
          className={`w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {step === 0 ? 'Next' : loading ? 'Logging In...' : 'Login'}
        </button>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-500 hover:underline"
            disabled={loading}
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;