// services/call.js
import axios from "axios";
import { getToken } from "./login";

const API_URL = "http://192.168.1.164:8080";

export const call = async (target_extension) => {
  try {
    const token = getToken();

    console.log("[call.js] Attempting to call:", target_extension);
    console.log("[call.js] Using token:", token);

    const response = await axios.post(
      `${API_URL}/protected/call/initiate`,
      { target_extension },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("[call.js] Response received:", response.data);
    return response.data;
  } catch (error) {
    console.error("[call.js] Call error:", error);
    throw error;
  }
};
