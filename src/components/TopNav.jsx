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
        height: { xs: 52, sm: 56, md: 60 }, // Responsive height
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 1, sm: 2, md: 3 }, // Responsive padding
        paddingTop: 'env(safe-area-inset-top)', // iOS safe area
        backdropFilter: "blur(8px)",
        boxShadow: 1,
        backgroundColor: darkMode ? "#111827" : "#ffffff",
        color: darkMode ? "#ffffff" : "#000000",
        transition: "all 0.3s ease",
      }}
      className="safe-area-top tap-highlight-none"
    >
      {/* Logo / Title Area - Enhanced Mobile Responsive */}
      <div className="text-sm xs:text-base font-semibold tracking-wide flex items-center min-w-0 flex-shrink-0">
        <img
          src="/favicon.ico"
          alt="Logo"
          className="w-5 h-5 xs:w-6 xs:h-6 mr-1 xs:mr-2 rounded-full border flex-shrink-0"
        />
        <span className="hidden xs:inline truncate">VoIP System</span>
        <span className="xs:hidden text-xs">VoIP</span>
      </div>

      {/* User Controls or Login - Enhanced Mobile Responsive */}
      {isLoggedIn ? (
        <div className="flex items-center space-x-1 xs:space-x-2 min-w-0 flex-shrink">
          {/* Avatar and Info - Mobile Optimized */}
          <div className="flex items-center space-x-1 xs:space-x-2 overflow-hidden max-w-[120px] xs:max-w-[180px] sm:max-w-[220px]">
            <Avatar
              alt={username}
              src="/static/images/avatar/1.jpg"
              sx={{
                width: { xs: 24, sm: 28, md: 32 },
                height: { xs: 24, sm: 28, md: 32 }
              }}
              className="border border-blue-400 flex-shrink-0"
            />
            <div className="text-2xs xs:text-xs truncate leading-tight min-w-0">
              <div className="font-medium truncate">
                <span className="hidden xs:inline">{username}</span>
                <span className="xs:hidden">{username.slice(0, 8)}</span>
                {extension && (
                  <span className="hidden sm:inline"> ({extension})</span>
                )}
              </div>
              <div className="text-gray-400 text-2xs xs:text-xs truncate">
                {callStatus || "Idle"}
              </div>
            </div>
          </div>

          {/* Quick Dial Button - Mobile Optimized */}
          <Tooltip title="Quick Dial">
            <IconButton
              size="small"
              color="primary"
              onClick={onQuickDial}
              aria-label="Quick Dial"
              sx={{
                padding: { xs: '2px', sm: '4px' },
                minWidth: '44px',
                minHeight: '44px'
              }}
              className="touch-target tap-highlight"
            >
              <Dialpad sx={{ fontSize: { xs: 16, sm: 20 } }} />
            </IconButton>
          </Tooltip>

          {/* Dark Mode Toggle - Mobile Optimized */}
          <Tooltip title="Toggle Dark Mode">
            <Switch
              checked={darkMode}
              onChange={toggleDarkMode}
              color="default"
              size="small"
              inputProps={{ "aria-label": "dark mode toggle" }}
              sx={{
                '& .MuiSwitch-switchBase': {
                  padding: { xs: '6px', sm: '9px' }
                }
              }}
              className="touch-target"
            />
          </Tooltip>

          {/* Logout Button - Mobile Optimized */}
          <Button
            variant="outlined"
            size="small"
            onClick={onLogout}
            sx={{
              minWidth: { xs: 'auto', sm: '64px' },
              px: { xs: 1, sm: 1.5 },
              py: { xs: 0.5, sm: 1 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              minHeight: '44px'
            }}
            className="touch-target tap-highlight"
          >
            <span className="hidden xs:inline">Logout</span>
            <span className="xs:hidden">Out</span>
          </Button>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <Tooltip title="Toggle Dark Mode">
            <Switch
              checked={darkMode}
              onChange={toggleDarkMode}
              color="default"
              size="small"
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