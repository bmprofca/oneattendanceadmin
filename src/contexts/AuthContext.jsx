import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user_data');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (userData) => {
    localStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    localStorage.removeItem('user_data');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
