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
      sipPassword: response.data.sip_password,
    };
  } catch (error) {
    let message = "Registration failed. Please try again.";

    if (error.response) {
      switch (error.response.data.error) {
        case "Invalid role":
          message = "Selected role is invalid. Choose user, admin, faculty, or emergency.";
          break;
        case "Extension already exists":
          message = "This extension is already registered. Try a different username.";
          break;
        case "Invalid extension format":
          message = "Internal error: Invalid extension format. Contact support.";
          break;
        case "SSH configuration missing":
          message = "Server configuration error. Contact support.";
          break;
        case "Failed to update Asterisk configuration":
          message = "Failed to configure VoIP settings. Try again later.";
          break;
        case "Could not create user":
          message = "Failed to save user data. Try again.";
          break;
        default:
          message = error.response.data.error || "Invalid registration details.";
      }
    } else if (error.request) {
      message = "No response from server. Check your network connection.";
    } else {
      message = `Registration error: ${error.message}`;
    }

    console.error("Registration error:", {
      message,
      status: error.response?.status,
      data: error.response?.data,
    });

    return {
      success: false,
      message,
    };
  }
};