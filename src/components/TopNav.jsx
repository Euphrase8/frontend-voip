import { useState } from "react";
import {
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Switch,
  Tooltip,
  Button,
  Box,
} from "@mui/material";
import { Dialpad, LightMode, DarkMode, Login } from "@mui/icons-material";

const TopNav = ({
  username,
  extension,
  callStatus,
  onLogout,
  onLogin,
  darkMode,
  toggleDarkMode,
  onQuickDial,
  contacts = [],
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const isLoggedIn = Boolean(username);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        height: { xs: 56, sm: 64 },
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        backdropFilter: "blur(8px)",
        boxShadow: 2,
        backgroundColor: darkMode ? "#111827" : "#ffffff",
        color: darkMode ? "#ffffff" : "#000000",
        transition: "all 0.3s ease",
      }}
    >
      {/* Logo / Title Area */}
      <div className="text-lg font-bold tracking-wide flex items-center">
        <img
          src="/favicon.ico"
          alt="Logo"
          className="w-8 h-8 mr-2 rounded-full border"
        />
        <span className="hidden sm:inline">VoIP System</span>
      </div>

      {/* User Controls or Login */}
      {isLoggedIn ? (
        <div className="flex items-center space-x-2">
          {/* Avatar and Info */}
          <div className="flex items-center space-x-2 overflow-hidden max-w-[200px]">
            <Avatar
              alt={username}
              src="/static/images/avatar/1.jpg"
              className="w-8 h-8 border-2 border-blue-400"
            />
            <div className="text-xs sm:text-sm truncate leading-tight">
              <div className="font-semibold truncate">
                {username} {extension && `(Ext: ${extension})`}
              </div>
              <div className="text-gray-400">
                {callStatus || "Idle"}
              </div>
            </div>
          </div>

          {/* Quick Dial Button */}
          <Tooltip title="Quick Dial">
            <IconButton
              size="small"
              color="primary"
              onClick={onQuickDial}
              aria-label="Quick Dial"
            >
              <Dialpad />
            </IconButton>
          </Tooltip>

          {/* Dark Mode Toggle */}
          <Tooltip title="Toggle Dark Mode">
            <Switch
              checked={darkMode}
              onChange={toggleDarkMode}
              color="default"
              inputProps={{ "aria-label": "dark mode toggle" }}
            />
          </Tooltip>

          {/* Logout Button */}
          <Button variant="outlined" size="small" onClick={onLogout}>
            Logout
          </Button>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <Tooltip title="Toggle Dark Mode">
            <Switch
              checked={darkMode}
              onChange={toggleDarkMode}
              color="default"
              inputProps={{ "aria-label": "dark mode toggle" }}
            />
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Login />}
            onClick={onLogin}
            size="small"
          >
            Login
          </Button>
        </div>
      )}
    </Box>
  );
};

export default TopNav;