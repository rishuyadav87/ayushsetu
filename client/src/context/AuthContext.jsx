import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authAPI.me();
          const userData = response.data;
          // Store with lowercase role for routing compatibility
          userData.role = userData.role.toLowerCase();
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (err) {
          console.error("Failed to restore session", err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authAPI.login(credentials);
      const { token, user: userData } = response.data;
      
      // Store lowercase role for frontend routing
      userData.role = userData.role.toLowerCase();
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      navigate(`/${userData.role}`);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      // Ensure role is uppercase for backend
      const registerData = { ...userData, role: userData.role.toUpperCase() };
      const response = await authAPI.register(registerData);
      const { token, user: newUserData } = response.data;
      
      // Convert role back to lowercase for frontend
      newUserData.role = newUserData.role.toLowerCase();
      
      setUser(newUserData);
      localStorage.setItem('user', JSON.stringify(newUserData));
      localStorage.setItem('token', token);
      navigate(`/${newUserData.role}`);
      return newUserData;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, error }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
