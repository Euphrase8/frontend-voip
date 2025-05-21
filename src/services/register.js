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
      const status = error.response.status;
      const errorMsg = error.response.data.error || error.response.data.message;

      if (status === 400) {
        switch (errorMsg) {
          case "Invalid input":
          case "Invalid username":
          case "Invalid email":
            message = "Invalid username or email. Please check your input.";
            break;
          case "Duplicate username":
          case "Duplicate email":
            message = "Username or email already registered. Try a different one.";
            break;
          case "Invalid role":
            message = "Invalid role. Choose user, admin, faculty, or emergency.";
            break;
          default:
            message = errorMsg || "Invalid registration details.";
        }
      } else if (status === 500) {
        switch (errorMsg) {
          case "Database error":
          case "Could not create user":
            message = "Failed to save user data. Try again later.";
            break;
          case "Failed to update Asterisk configuration":
            message = "Failed to configure VoIP settings. Try again later.";
            break;
          case "SSH configuration missing":
            message = "Server configuration error. Contact support.";
            break;
          default:
            message = errorMsg || "Server error during registration.";
        }
      } else {
        message = errorMsg || "Unexpected registration error.";
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