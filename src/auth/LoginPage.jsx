import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/login';
import Logo from '../assets/Login.png';

const LoginPage = ({ onLogin, onSwitchToRegister }) => {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateStep = () => {
    if (step === 0) return username.trim().length >= 3;
    if (step === 1) return password.length >= 6;
    return false;
  };

  const nextStep = async () => {
    if (!validateStep()) {
      setError('Please fill in valid information.');
      return;
    }
    setError('');

    if (step === 0) {
      setStep(1);
    } else {
      setLoading(true);
      try {
        const result = await login(username, password);
        if (result.success || result.token) {
          onLogin(result);
          navigate('/home', {
            state: { success: 'Login successful!' },
          });
        } else {
          setError('Login failed. Please check your credentials.');
        }
      } catch (err) {
        setError('Login failed. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextStep();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md transition-all duration-500 overflow-hidden">
        {/* Static Header */}
        <div className="flex flex-col items-center mb-4">
          <img
            src={Logo}
            alt="Logo"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-contain mb-2"
          />
          <h3 className="text-center text-sm font-bold">
            THE INSTITUTE OF FINANCE MANAGEMENT
          </h3>
          <h2 className="text-xl sm:text-2xl font-extrabold text-center text-gray-900 mt-1">
            VoIP Login
          </h2>
        </div>

        <form className="space-y-4">
          {[
            {
              label: 'Username',
              type: 'text',
              value: username,
              onChange: setUsername,
              placeholder: 'Enter your username',
            },
            {
              label: 'Password',
              type: 'password',
              value: password,
              onChange: setPassword,
              placeholder: 'Enter your password',
            },
          ].map((field, index) => (
            <div
              key={index}
              className={`overflow-hidden transition-all duration-500 ${
                step === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <label className="block text-sm font-medium">{field.label}</label>
              <input
                type={field.type}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                onKeyDown={handleKeyDown}
                autoFocus={step === index}
                disabled={loading}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 bg-gray-50"
              />
            </div>
          ))}

          {error && (
            <p className="text-red-600 text-center text-sm animate-pulse">{error}</p>
          )}

          <button
            type="button"
            onClick={nextStep}
            disabled={loading}
            className={`w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-lg hover:from-blue-600 hover:to-indigo-700 font-semibold focus:ring-2 focus:ring-blue-400 transition-all duration-200 transform ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {step === 0 ? 'Next' : loading ? 'Logging In...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-500 hover:text-blue-700 font-medium focus:outline-none focus:underline"
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
