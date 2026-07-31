import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // Simple check for dummy authentication
  const userData = localStorage.getItem("user_data");
  const isAuthenticated = !!userData;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
