import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { HowToReg as RegisterIcon } from '@mui/icons-material';
import { register } from '../services/register';
import Logo from '../assets/Login.png';

const RegisterPage = ({ onSwitchToLogin }) => {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notification, setNotification] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const validateStep = () => {
    switch (step) {
      case 0:
        return username.trim().length >= 3;
      case 1:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      case 2:
        return ['user', 'admin', 'faculty', 'emergency'].includes(role);
      case 3:
        return password.length >= 6;
      case 4:
        return confirmPassword === password;
      default:
        return false;
    }
  };

  const nextStep = async () => {
    if (!validateStep()) {
      setNotification({ message: 'Please fill in valid information.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setNotification(null);

    if (step < 4) {
      setStep(step + 1);
    } else {
      try {
        const res = await register(username, email, password, role);
        if (res.success) {
          setNotification({
            message: `${res.message}. Extension: ${res.extension}, SIP Password: ${res.sipPassword}`,
            type: 'success',
          });

          // Clear auto-login data
          localStorage.removeItem('extension');
          localStorage.removeItem('sipPassword');

          // Delay then switch to login
          setTimeout(() => {
            onSwitchToLogin();
          }, 3000);
        } else {
          setNotification({ message: res.message, type: 'error' });
          setTimeout(() => setNotification(null), 3000);
        }
      } catch {
        setNotification({ message: 'Registration failed. Try again.', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
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
    <div
      className={`min-h-screen flex flex-col ${
        darkMode
          ? 'bg-gray-900 text-white'
          : 'bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 text-gray-900'
      }`}
    >
      <nav
        className={`flex justify-between items-center px-6 py-3 ${
          darkMode ? 'bg-gray-800' : 'bg-white shadow-md'
        }`}
      >
        <div className="flex items-center space-x-3">
          <img src={Logo} alt="Logo" className="w-10 h-10 rounded-full object-contain" />
          <h1 className="text-xl font-bold select-none">VoIP System</h1>
        </div>
        <button
          onClick={toggleDarkMode}
          aria-label="Toggle Dark Mode"
          className="px-3 py-1 rounded-full border border-gray-400 focus:outline-none hover:bg-gray-300 dark:hover:bg-gray-700 dark:border-gray-600"
        >
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </nav>

      <div className="flex-grow flex items-center justify-center px-4 py-6">
        <div
          className={`rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md transition-all duration-500 overflow-hidden ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <div className="flex flex-col items-center mb-4">
            <img
              src={Logo}
              alt="Logo"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-contain mb-2"
            />
            <h3 className="text-center text-sm font-bold">
              THE INSTITUTE OF FINANCE MANAGEMENT
            </h3>
            <h2
              className={`text-xl sm:text-2xl font-extrabold text-center mt-1 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              VoIP Register
            </h2>
          </div>

          {notification && (
            <div
              className={`fixed top-20 right-4 z-50 p-3 rounded-lg shadow-lg animate-[fadeInUp_0.6s_ease-out_forwards] ${
                notification.type === 'success' ? 'bg-green-500/80' : 'bg-red-500/80'
              }`}
            >
              <span className="text-sm font-medium text-white">{notification.message}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {[{
                label: 'Username',
                value: username,
                onChange: setUsername,
                type: 'text',
                placeholder: 'Enter username',
              },
              {
                label: 'Email',
                value: email,
                onChange: setEmail,
                type: 'email',
                placeholder: 'Enter email',
              },
              {
                label: 'Role',
                value: role,
                onChange: setRole,
                type: 'select',
                options: ['user', 'admin', 'faculty', 'emergency'],
              },
              {
                label: 'Password',
                value: password,
                onChange: setPassword,
                type: 'password',
                placeholder: 'Enter password',
              },
              {
                label: 'Confirm Password',
                value: confirmPassword,
                onChange: setConfirmPassword,
                type: 'password',
                placeholder: 'Re-enter password',
              },
            ].map((field, index) => (
              <div
                key={index}
                className={`overflow-hidden transition-all duration-500 ${
                  step === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <label
                  className={`block text-sm font-medium ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <FormControl fullWidth>
                    <InputLabel className={darkMode ? 'text-white' : ''}>
                      {field.label}
                    </InputLabel>
                    <Select
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoFocus={step === index}
                      label={field.label}
                      sx={{
                        backgroundColor: darkMode ? '#374151' : '#fff',
                        color: darkMode ? '#fff' : 'inherit',
                        '.MuiSvgIcon-root': {
                          color: darkMode ? '#fff' : 'inherit',
                        },
                      }}
                    >
                      {field.options.map((opt) => (
                        <MenuItem
                          key={opt}
                          value={opt}
                          sx={{
                            backgroundColor: darkMode ? '#374151' : '#fff',
                            color: darkMode ? '#fff' : 'inherit',
                          }}
                        >
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    type={field.type}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder={field.placeholder}
                    onKeyDown={handleKeyDown}
                    autoFocus={step === index}
                    fullWidth
                    variant="outlined"
                    InputProps={{
                      className: `p-3 rounded-lg focus:ring-2 focus:ring-blue-400 ${
                        darkMode ? 'bg-gray-700 text-white' : ''
                      }`,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: darkMode ? '#374151' : '#fff',
                        color: darkMode ? '#fff' : 'inherit',
                      },
                    }}
                  />
                )}
              </div>
            ))}

            <Button
              type="button"
              onClick={nextStep}
              variant="contained"
              fullWidth
              className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white p-3 font-semibold"
              startIcon={<RegisterIcon />}
            >
              {step < 4 ? 'Next' : 'Register'}
            </Button>
          </form>

          <p
            className={`mt-6 text-center text-sm ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-500 hover:text-blue-700 font-medium focus:outline-none focus:underline"
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
