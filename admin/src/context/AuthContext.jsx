import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext(null);
const initialState = { user: null, token: null, loading: true };

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':  return { user: action.user, token: action.token, loading: false };
    case 'LOGOUT': return { user: null, token: null, loading: false };
    case 'INIT':   return { ...state, loading: false };
    default:       return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const userRaw = localStorage.getItem('admin_user');
    if (token && userRaw) {
      try {
        dispatch({ type: 'LOGIN', user: JSON.parse(userRaw), token });
      } catch {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        dispatch({ type: 'INIT' });
      }
    } else {
      dispatch({ type: 'INIT' });
    }
  }, []);

  function login(token, user) {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));
    dispatch({ type: 'LOGIN', user, token });
  }

  function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    dispatch({ type: 'LOGOUT' });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
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
