import React, { useState, useEffect } from "react";
import {
  Button,
  CircularProgress,
  Typography,
  Box,
  Card,
  CardContent,
} from "@mui/material";
import { CheckCircle, Error, ArrowForward } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Logo from "../assets/Login.png";
import TopNav from "../components/TopNav";

const API_URL = "http://192.168.1.164:8080";
const WS_URL = "ws://192.168.1.194:8088/ws";

const ServerCheckPage = ({ onSwitchToLogin, onSwitchToRegister }) => {
  const navigate = useNavigate();
  const [checks, setChecks] = useState({
    backend: { status: "pending", message: "Checking backend API..." },
    websocket: { status: "pending", message: "Checking Asterisk WebSocket..." },
    webrtc: { status: "pending", message: "Checking WebRTC support..." },
  });
  const [isChecking, setIsChecking] = useState(true);

  // Dark mode state & toggle function
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  useEffect(() => {
    const performChecks = async () => {
      try {
        await axios.get(`${API_URL}/health`, { timeout: 5000 });
        setChecks((prev) => ({
          ...prev,
          backend: { status: "success", message: "Backend API is reachable" },
        }));
      } catch (error) {
        setChecks((prev) => ({
          ...prev,
          backend: {
            status: "error",
            message: `Backend API unreachable: ${error.message}`,
          },
        }));
      }

      try {
        const ws = new WebSocket(WS_URL);
        ws.onopen = () => {
          setChecks((prev) => ({
            ...prev,
            websocket: {
              status: "success",
              message: "Asterisk WebSocket connected",
            },
          }));
          ws.close();
        };
        ws.onerror = () => {
          setChecks((prev) => ({
            ...prev,
            websocket: {
              status: "error",
              message: "Asterisk WebSocket connection failed",
            },
          }));
        };
        setTimeout(() => {
          if (
            ws.readyState !== WebSocket.OPEN &&
            ws.readyState !== WebSocket.CLOSED
          ) {
            setChecks((prev) => ({
              ...prev,
              websocket: {
                status: "error",
                message: "Asterisk WebSocket timeout",
              },
            }));
            ws.close();
          }
        }, 5000);
      } catch (error) {
        setChecks((prev) => ({
          ...prev,
          websocket: {
            status: "error",
            message: `WebSocket error: ${error.message}`,
          },
        }));
      }

      try {
        const hasWebRTC = !!(
          navigator.mediaDevices &&
          navigator.mediaDevices.getUserMedia &&
          window.RTCPeerConnection
        );
        setChecks((prev) => ({
          ...prev,
          webrtc: {
            status: hasWebRTC ? "success" : "error",
            message: hasWebRTC
              ? "WebRTC is supported"
              : "WebRTC is not supported",
          },
        }));
      } catch (error) {
        setChecks((prev) => ({
          ...prev,
          webrtc: {
            status: "error",
            message: `WebRTC check failed: ${error.message}`,
          },
        }));
      }

      setIsChecking(false);
    };

    performChecks();
  }, []);

  const allChecksPassed = Object.values(checks).every(
    (check) => check.status === "success"
  );

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: darkMode ? "grey.900" : "background.default",
        color: darkMode ? "grey.100" : "text.primary",
        transition: "all 0.3s ease",
      }}
    >
      <TopNav
        username={null}
        onLogin={onSwitchToLogin}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          px: 2,
        }}
      >
        <Card
          sx={{
            width: "100%",
            maxWidth: 600,
            borderRadius: 3,
            boxShadow: 6,
            p: 4,
            bgcolor: darkMode ? "grey.800" : "background.paper",
            color: darkMode ? "grey.100" : "text.primary",
            transition: "all 0.3s ease",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 3,
            }}
          >
            <img
              src={Logo}
              alt="Logo"
              style={{ width: 112, height: 112, borderRadius: "50%", marginBottom: 8 }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                textAlign: "center",
                color: darkMode ? "primary.light" : "primary.main",
              }}
            >
              The Institute of Finance Management
            </Typography>
            <Typography
              variant="h4"
              sx={{ mt: 1, fontWeight: "extrabold", textAlign: "center" }}
            >
              VoIP SYSTEM CHECK
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mt: 1,
                textAlign: "center",
                color: darkMode ? "grey.400" : "grey.600",
              }}
            >
              Secure VoIP Communication
            </Typography>
          </Box>

          <CardContent>
            {Object.entries(checks).map(([key, { status, message }]) => (
              <Box
                key={key}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                  color:
                    status === "error"
                      ? "error.main"
                      : status === "success"
                      ? "success.main"
                      : "text.primary",
                }}
              >
                {status === "pending" && (
                  <CircularProgress
                    size={24}
                    sx={{ mr: 2, color: darkMode ? "grey.100" : "grey.700" }}
                  />
                )}
                {status === "success" && (
                  <CheckCircle sx={{ mr: 2, color: "success.main" }} />
                )}
                {status === "error" && <Error sx={{ mr: 2, color: "error.main" }} />}
                <Typography
                  sx={{
                    color: darkMode ? "grey.100" : "text.primary",
                    wordBreak: "break-word",
                  }}
                >
                  {message}
                </Typography>
              </Box>
            ))}

            {isChecking ? (
              <Typography
                sx={{ textAlign: "center", mt: 3, color: darkMode ? "grey.300" : "grey.700" }}
              >
                Performing system checks...
              </Typography>
            ) : allChecksPassed ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mt: 4,
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<ArrowForward />}
                  onClick={() => onSwitchToLogin()}
                  sx={{
                    background: "linear-gradient(90deg, #3b82f6, #4f46e5)",
                    color: "white",
                    "&:hover": {
                      background: "linear-gradient(90deg, #2563eb, #4338ca)",
                    },
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => onSwitchToRegister()}
                  sx={{
                    borderColor: darkMode ? "primary.light" : "primary.main",
                    color: darkMode ? "primary.light" : "primary.main",
                    "&:hover": {
                      backgroundColor: darkMode ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.05)",
                      borderColor: darkMode ? "primary.light" : "primary.main",
                    },
                  }}
                >
                  Register
                </Button>
              </Box>
            ) : (
              <Typography sx={{ textAlign: "center", mt: 3, color: "error.main" }}>
                Please resolve errors before proceeding.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ServerCheckPage;
