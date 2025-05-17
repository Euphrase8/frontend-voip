import React, { useState } from 'react';

const HomePage = ({ onCall }) => {
  const [extension, setExtension] = useState('');
  const [error, setError] = useState('');

  const handleKeypadClick = (value) => {
    setExtension((prev) => prev + value);
  };

  const handleClear = () => {
    setExtension('');
    setError('');
  };

  const handleCall = () => {
    if (!extension || !/^\d{4}$/.test(extension)) {
      setError('Please enter a valid 4-digit extension');
      return;
    }
    setError('');
    onCall({ name: `Ext ${extension}`, extension, status: 'online' });
  };

  const keypadButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  return (
    <div className="w-full max-w-3xl mx-auto p-2 sm:p-2">
      <div className="bg-white/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 font-sans flex items-center space-x-2">
          <span className="animate-bounce">📞</span>
          <span>Dial Extension</span>
        </h2>
        {error && (
          <div
            className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm sm:text-base animate-fade-in"
            role="alert"
          >
            {error}
          </div>
        )}
        <div className="mb-4">
          <input
            type="text"
            value={extension}
            readOnly
            className="w-full p-3 sm:p-4 border h-200 border-gray-200 rounded-lg bg-gray-50 text-sm sm:text-base text-gray-900 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter extension"
            aria-label="Current extension"
          />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          {keypadButtons.map((btn) => (
            <button
              key={btn}
              onClick={() => handleKeypadClick(btn)}
              className="p-3 sm:p-4 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base font-semibold font-sans transition-all duration-300 transform hover:scale-105 active:scale-95"
              aria-label={`Dial ${btn}`}
            >
              {btn}
            </button>
          ))}
        </div>
        <div className="flex space-x-2 sm:space-x-3">
          <button
            onClick={handleClear}
            className="flex-1 bg-gray-500 text-white p-3 sm:p-4 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base font-semibold font-sans transition-all duration-300 transform hover:scale-105 active:scale-95"
            aria-label="Clear extension"
          >
            Clear
          </button>
          <button
            onClick={handleCall}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 sm:p-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base font-semibold font-sans transition-all duration-300 transform hover:scale-105 active:scale-95"
            aria-label="Make call"
          >
            Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;