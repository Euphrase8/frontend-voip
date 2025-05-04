import React from 'react';

const TopNav = ({ user, callStatus }) => (
  <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
    <h1 className="text-xl font-bold">VoIP Dashboard</h1>
    <div className="flex items-center space-x-4">
      {callStatus && (
        <span className="text-sm" role="status">
          {callStatus}
        </span>
      )}
      <div className="flex items-center">
        <span className="text-sm">{user.username}</span>
        <div
          className="w-8 h-8 bg-gray-300 rounded-full ml-2"
          aria-hidden="true"
        ></div>
      </div>
    </div>
  </div>
);

export default TopNav;