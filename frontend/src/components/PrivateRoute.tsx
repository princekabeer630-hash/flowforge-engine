import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function PrivateRoute() {
  const isAuthenticated = Boolean(localStorage.getItem('token'));
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}