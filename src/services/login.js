import axios from "axios";

const API_URL = "http://192.168.1.164:8080"; // Make sure backend allows CORS from your frontend

// Get token from localStorage
export const getToken = () => localStorage.getItem("token");

// Login function
export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      username,
      password,
    });

    // Ensure response contains token
    if (response.data && response.data.token) {
      const { token } = response.data;
      localStorage.setItem("token", token);

      return {
        success: true,
        token,
        user: response.data.user || null, // Optional user info
      };
    } else {
      return {
        success: false,
        message: "Invalid login response: token not found",
      };
    }
  } catch (error) {
    let message = "Login failed. Please try again.";

    if (error.response) {
      // Server responded with a status outside 2xx
      message = error.response.data.message || "Invalid credentials";
    } else if (error.request) {
      // No response from server
      message = "No response from server. Check your connection.";
    } else {
      message = error.message;
    }

    console.error("Login error:", message);

    return {
      success: false,
      message,
    };
  }
};
