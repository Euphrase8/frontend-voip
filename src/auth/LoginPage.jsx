import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/login";
import { connectWebSocket } from "../services/websocketservice";
import Logo from "../assets/Login.png";

const LoginPage = ({ onLogin, onSwitchToRegister }) => {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedMode);
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (loginSuccess) {
      console.log('[LoginPage.jsx] Login success state:', loginSuccess);
      console.log('[LoginPage.jsx] Attempting navigation to /dashboard for user:', loginSuccess.user);
      navigate("/dashboard", { state: { success: loginSuccess.message, user: loginSuccess.user } });
      // Fallback navigation
      if (window.location.pathname !== "/dashboard") {
        console.warn('[LoginPage.jsx] Fallback navigation triggered');
        window.location.href = '/dashboard';
      }
      setLoginSuccess(null); // Reset to prevent loops
    }
  }, [loginSuccess, navigate]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const validateStep = () => {
    if (step === 0) return username.trim().length >= 3;
    if (step === 1) return password.length >= 6;
    return false;
  };

  const nextStep = async () => {
    if (!validateStep()) {
      setNotification({ message: "Please fill in valid information.", type: "error" });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (step === 0) {
      setStep(1);
    } else {
      setLoading(true);
      try {
        const result = await login(username, password);
        console.log('[LoginPage.jsx] Login result:', result);
        if (result.success) {
          setNotification({
            message: `${result.message} (Ext: ${result.user.extension})`,
            type: "success",
          });

          // Connect WebSocket and set up message handler
          const websocket = connectWebSocket(result.user.extension);
          websocket.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === "incoming-call") {
                alert(`Incoming call from ${data.from} (Priority: ${data.priority})`);
              }
            } catch (error) {
              console.error('[LoginPage.jsx] Failed to parse WebSocket message:', error);
            }
          };

          onLogin(result);
          setLoginSuccess(result);
        } else {
          setNotification({ message: result.message, type: "error" });
          setTimeout(() => setNotification(null), 3000);
        }
      } catch (error) {
        setNotification({ message: "Login failed. Please check your credentials.", type: "error" });
        setTimeout(() => setNotification(null), 3000);
        console.error('[LoginPage.jsx] Login error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") nextStep();
  };

  try {
    return (
      <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 text-gray-900"} min-h-screen flex flex-col`}>
        <nav className={`flex justify-between items-center px-6 py-3 ${darkMode ? "bg-gray-800" : "bg-white shadow-md"}`}>
          <div className="flex items-center space-x-3">
            <img src={Logo} alt="Logo" className="w-10 h-10 rounded-full object-contain" />
            <h1 className="text-xl font-bold select-none">VoIP System</h1>
          </div>
          <button
            onClick={toggleDarkMode}
            aria-label="Toggle Dark Mode"
            className="px-3 py-1 rounded-full border border-gray-400 focus:outline-none hover:bg-gray-300 dark:hover:bg-gray-700 dark:border-gray-600"
          >
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </nav>
        <div className="flex-grow flex items-center justify-center px-4">
          <div className={`rounded-2xl shadow-2xl p-8 w-full max-w-md ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex flex-col items-center mb-4">
              <img src={Logo} alt="Logo" className="w-24 h-24 rounded-full object-contain mb-2" />
              <h3 className="text-sm font-bold text-center">THE INSTITUTE OF FINANCE MANAGEMENT</h3>
              <h2 className="text-2xl font-extrabold text-center">VoIP Login</h2>
            </div>
            {[
              { label: "Username", value: username, set: setUsername, type: "text" },
              { label: "Password", value: password, set: setPassword, type: "password" },
            ].map((field, index) => (
              <div
                key={index}
                className={`transition-all duration-500 overflow-hidden ${
                  step === index ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <label className="block text-sm font-medium mb-1">{field.label}</label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`w-full p-3 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-300" : ""
                  }`}
                  autoFocus={step === index}
                  disabled={loading}
                  placeholder={`Enter your ${field.label.toLowerCase()}`}
                />
              </div>
            ))}
            {notification && (
              <p
                className={`mt-2 text-center text-sm ${
                  notification.type === "error" ? "text-red-600" : "text-green-600"
                }`}
              >
                {notification.message}
              </p>
            )}
            <button
              type="button"
              onClick={nextStep}
              disabled={loading}
              className={`w-full mt-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition ${
                loading ? "opacity-50 cursor-not-allowed" : "bg-blue-600 text-white"
              }`}
            >
              {step === 0 ? "Next" : loading ? "Logging In..." : "Login"}
            </button>
            <p className={`mt-6 text-center text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Don't have an account?{" "}
              <button
                onClick={onSwitchToRegister}
                className="text-blue-500 hover:underline"
                disabled={loading}
                type="button"
              >
                Register
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('[LoginPage.jsx] Rendering error:', error);
    return <div>Error loading login page. Please refresh.</div>;
  }
};

export default LoginPage;