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
    return response.data; // return whatever the backend sends (like success message)
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};
