// src/services/login.js
import axios from "axios";

const API_URL = "http://192.168.1.164:8080";

// Retrieve token from localStorage
export const getToken = () => localStorage.getItem("token");

// Retrieve extension from localStorage
export const getExtension = () => localStorage.getItem("extension");

// Perform login and store token & extension
export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      username,
      password,
    });

    if (response.data && response.data.token) {
      const { token, message, extension } = response.data;

      // Save to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("extension", extension);

      return {
        success: true,
        token,
        extension,
        message: message || "Login successful",
        user: response.data,
      };
    } else {
      return {
        success: false,
        message: "Invalid login response: token not found",
      };
    }
  } catch (error) {
    let message = "Login failed. Please try again.";

    if (error.response && error.response.data) {
      message = error.response.data.message || "Invalid credentials";
    } else if (error.request) {
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
