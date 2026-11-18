import { createContext, useContext } from 'react';
import { ADMIN_USER_ID, ADMIN_EMAILS } from './appwrite';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export const isAdminUser = (user) => {
  if (!user) return false;
  if (ADMIN_EMAILS.includes((user.email || '').toLowerCase())) return true;
  return Boolean(ADMIN_USER_ID && user.$id === ADMIN_USER_ID);
};
