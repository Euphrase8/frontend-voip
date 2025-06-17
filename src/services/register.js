import axios from "axios";

const API_URL = "http://172.20.10.3:8080";

export const register = async (username, email, password, role) => {
  try {
    // Validate inputs
    if (!username || !email || !password || !role) {
      return {
        success: false,
        message: "All fields (username, email, password, role) are required",
      };
    }
    // if (!/^\d{4,6}$/.test(username)) {
    //   return {
    //     success: false,
    //     message: "Username must be a 4-6 digit extension",
    //   };
    // }
    if (!/^(user|admin|faculty|emergency)$/.test(role)) {
      return {
        success: false,
        message: "Role must be user, admin, faculty, or emergency",
      };
    }

    console.log('[register.js] Attempting registration for:', { username, email, role });

    // Register user
    const response = await axios.post(`${API_URL}/register`, {
      username,
      email,
      password,
      role,
    });

    const { message, extension, sip_password } = response.data;

    if (!extension || !sip_password) {
      console.error('[register.js] Missing extension or sip_password:', response.data);
      return {
        success: false,
        message: "Registration failed: Missing VoIP credentials",
      };
    }

    console.log('[register.js] Registration successful:', { extension, sip_password });
    return {
      success: true,
      message: message || "Registered successfully",
      extension,
      sipPassword: sip_password,
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
            message = "Invalid username or email. Username must be a 4-6 digit extension.";
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
            message = "Failed to configure VoIP settings. Contact support.";
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

    console.error("[register.js] Registration error:", {
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