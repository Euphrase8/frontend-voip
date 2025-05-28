import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.164:8080';

// Validate API_URL
let validatedApiUrl;
try {
  validatedApiUrl = new URL(API_URL).toString().replace(/\/$/, ''); // Remove trailing slash
} catch (error) {
  console.error('[login.js] Invalid API_URL:', API_URL, error);
  validatedApiUrl = 'http://192.168.1.164:8080'; // Fallback
}

export const getToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('[login.js] No token found');
    return null;
  }
  return token;
};

export const getExtension = () => {
  const extension = localStorage.getItem('extension');
  if (!extension) {
    console.warn('[login.js] No extension found');
    return null;
  }
  return extension;
};

export const getUser = () => {
  const extension = getExtension();
  if (!extension) {
    console.warn('[login.js] No user found');
    return null;
  }
  return { username: extension, extension };
};

export const login = async (username, password) => {
  if (!username || !password) {
    console.error('[login.js] Username or password missing');
    return { success: false, message: 'Username and password are required' };
  }

  try {
    console.log('[login.js] Attempting login for:', username);
    const response = await axios.post(`${validatedApiUrl}/login`, {
      username: username.trim(),
      password,
    }, {
      timeout: 8000, // Match ServerCheckPage.jsx
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.token && response.data.extension) {
      const { token, message, extension } = response.data;

      if (!/^\d{4,6}$/.test(extension)) {
        console.error('[login.js] Invalid extension format:', extension);
        return { success: false, message: 'Extension must be a 4-6 digit number' };
      }

      localStorage.setItem('token', token);
      localStorage.setItem('extension', extension);
      console.log('[login.js] Login successful, stored:', { token, extension });

      return {
        success: true,
        token,
        extension,
        message: message || 'Login successful',
        user: { username, extension },
      };
    } else {
      console.error('[login.js] Invalid response:', response.data);
      return { success: false, message: 'Invalid login response: token or extension missing' };
    }
  } catch (error) {
    let message = 'Login failed. Please try again.';
    if (error.code === 'ERR_INVALID_URL') {
      message = 'Invalid API URL configuration. Contact support.';
      console.error('[login.js] URL error:', validatedApiUrl, error);
    } else if (error.response && error.response.data) {
      message = error.response.data.message || 'Invalid credentials';
    } else if (error.request) {
      message = 'No response from server. Check your connection.';
    } else {
      message = error.message;
    }
    console.error('[login.js] Login error:', message, error);
    return { success: false, message };
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('extension');
  console.log('[login.js] Logged out');
};