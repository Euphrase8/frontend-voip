import axios from "axios";

const API_URL = "http://192.168.1.164:8080";

export const register = async (username, email, password, role) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      username,
      email,
      password,
      role,
    });
    return {
      success: true,
      message: response.data.message || "Registered successfully",
      extension: response.data.extension,
    };
  } catch (error) {
    let message = "Registration failed. Please try again.";

    if (error.response) {
      message = error.response.data.message || "Invalid registration details";
    } else if (error.request) {
      message = "No response from server. Check your connection.";
    } else {
      message = error.message;
    }

    console.error("Registration error:", message);

    return {
      success: false,
      message,
    };
  }
};