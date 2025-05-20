import { useState } from "react";
import {
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Switch,
  Tooltip,
} from "@mui/material";
import { Dialpad, LightMode, DarkMode } from "@mui/icons-material";

const TopNav = ({
  username,
  extension,
  callStatus,
  onLogout,
  darkMode,
  toggleDarkMode,
  onQuickDial,
  contacts,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <div
      className={`fixed top-0 left-0 md:left-64 right-0 z-30 h-14 sm:h-16 flex items-center justify-between px-2 sm:px-4 glass-effect ${
        darkMode ? "bg-gray-800 text-white" : "bg-blue-50 text-black"
      } shadow-md`}
    >
      {/* User Info */}
      <div className="flex items-center space-x-2 overflow-hidden">
        <Avatar
          alt={username}
          src="/static/images/avatar/1.jpg"
          className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-blue-400"
        />
        <div className="text-xs sm:text-sm truncate">
          <div className="font-semibold truncate">
            {username} {extension && `(Ext: ${extension})`}
          </div>
          {callStatus && (
            <div className="text-yellow-400 animate-pulse truncate">
              {callStatus}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* Quick Dial */}
        <Tooltip title="Quick Dial">
          <IconButton
            onClick={handleMenuOpen}
            className={darkMode ? "text-white" : "text-blue-800"}
            aria-label="Open quick dial menu"
            size="small"
          >
            <Dialpad fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
          {contacts.map((contact) => (
            <MenuItem
              key={contact.id}
              onClick={() => {
                onQuickDial(contact);
                handleMenuClose();
              }}
            >
              {contact.name} (Ext: {contact.extension})
            </MenuItem>
          ))}
        </Menu>

        {/* Theme Toggle */}
        <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}>
          <Switch
            checked={darkMode}
            onChange={toggleDarkMode}
            icon={<LightMode fontSize="small" />}
            checkedIcon={<DarkMode fontSize="small" />}
            size="small"
          />
        </Tooltip>

        {/* Logout */}
        <Tooltip title="Logout">
          <button
            onClick={onLogout}
            className={`px-2 py-1 text-xs rounded-md font-semibold min-w-[64px] transition hover:scale-105 ${
              darkMode
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            Logout
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default TopNav;