import React, { createContext, useReducer, useEffect } from 'react';
import api from '../utils/api';

// Initial state
const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: null,
  loading: true,
  user: null,
};

// Create context
export const AuthContext = createContext(initialState);

// Reducer
const authReducer = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: payload,
      };
    case 'REGISTER_SUCCESS':
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', payload.token);
      return {
        ...state,
        ...payload,
        isAuthenticated: true,
        loading: false,
      };
    case 'AUTH_ERROR':
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
      };
    default:
      return state;
  }
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Function to load user
  const loadUser = async () => {
    if (localStorage.token) {
      try {
        // The api util already sets the token in the header
        const res = await api.get('/auth/user'); // I need to create this endpoint
        dispatch({
          type: 'USER_LOADED',
          payload: res.data,
        });
      } catch (err) {
        dispatch({ type: 'AUTH_ERROR' });
      }
    } else {
        dispatch({ type: 'AUTH_ERROR' });
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      const res = await api.post('/auth/login', formData);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data,
      });
      loadUser();
    } catch (err) {
      dispatch({ type: 'AUTH_ERROR' });
      // maybe re-throw to be caught in component
      throw err;
    }
  };

  // Logout
  const logout = () => dispatch({ type: 'LOGOUT' });

  // Register user (optional, can be handled in component if preferred)
  const register = async (formData) => {
    try {
        const res = await api.post('/auth/register', formData);
        dispatch({
            type: 'REGISTER_SUCCESS',
            payload: res.data
        });
        loadUser();
    } catch (err) {
        dispatch({ type: 'AUTH_ERROR' });
        throw err;
    }
  }


  return (
    <AuthContext.Provider
      value={{
        ...state,
        loadUser,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
