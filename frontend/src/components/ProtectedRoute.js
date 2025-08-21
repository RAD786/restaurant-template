import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthed } = useAuth();
  return isAuthed ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
