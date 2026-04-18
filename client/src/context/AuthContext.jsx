import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const initialState = { user: null, token: null };

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { user: action.user, token: action.token };
    case 'LOGOUT':
      return initialState;
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        dispatch({ type: 'LOGIN', user, token });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  function login(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    dispatch({ type: 'LOGIN', user, token });
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  }

  async function register(userData) {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
