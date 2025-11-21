import { useContext } from 'react';
import { AuthContext } from './AuthContext';

// for others
export function useAuth() {
  return useContext(AuthContext);
}