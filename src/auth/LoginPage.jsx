import React, { useState } from 'react';

const LoginPage = ({ onLogin, onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }
    setError('');
    onLogin({ username }); // Simulate successful login (replace with API call)
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md bg-white p-6 sm:p-8 rounded-2xl shadow-2xl transform transition-all duration-300 hover:shadow-3xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900 mb-6 sm:mb-8 tracking-tight">
          VoIP Login
        </h2>
        {error && (
          <div
            className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm sm:text-base animate-fade-in"
            role="alert"
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              className="mt-1 w-full p-3 sm:p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 transition-all duration-200 hover:border-blue-300 text-sm sm:text-base"
              placeholder="Enter your username"
              aria-required="true"
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full p-3 sm:p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 transition-all duration-200 hover:border-blue-300 text-sm sm:text-base"
              placeholder="Enter your password"
              aria-required="true"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 sm:p-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 transform hover:scale-105 text-sm sm:text-base font-semibold"
            aria-label="Log in"
          >
            Log In
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-500 hover:text-blue-700 font-medium focus:outline-none focus:underline"
            aria-label="Switch to register"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;