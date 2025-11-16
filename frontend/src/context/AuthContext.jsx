import { createContext, useContext, useEffect, useState } from 'react';
import { loginRequest } from '../api/auth';

// create context
const AuthContext = createContext(null);

// for others
export function useAuth() {
  return useContext(AuthContext);
}

// Provider component
export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const storedToken = localStorage.getItem('token');
    const storedEmail = localStorage.getItem('email');
    if (storedToken) {
      return { token: storedToken, email: storedEmail || '' };
    }
    return { token: null, email: '' };
  });

  // login 
  const login = async (email, password) => {
    const data = await loginRequest(email, password);
    const token = data.token;
    setAuth({ token, email });
    localStorage.setItem('token', token);
    localStorage.setItem('email', email);
  };

  // logout clear localstorage
  const logout = () => {
    setAuth({ token: null, email: '' });
    localStorage.removeItem('token');
    localStorage.removeItem('email');
  };

  const value = {
    auth,
    isLoggedIn: !!auth.token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
