import backendConfig from '../../backend.config.json';
const BASE_URL = `http://localhost:${backendConfig.BACKEND_PORT}`; 

/**
 * login request
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{token: string}>}
 */
export async function loginRequest(email, password) {
  const res = await fetch(`${BASE_URL}/user/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),

  });

  const data = await res.json().catch(() => ({}));
  // login failed
  if (!res.ok) {
    const msg = data.error || 'Login failed';
    throw new Error(msg);
  }

  // login successfully
  return data; 
}


/**
 * register request
 * @param {string} email 
 * @param {string} password 
 * @param {string} name 
 * @returns {Promise<{token: string}>}
 */
export async function registerRequest(email, password, name) {
  const res = await fetch(`${BASE_URL}/user/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name }),
  });
  
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.error || 'Register failed';
    throw new Error(msg);
  }

  return data; 
}
