
import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { type User } from '../types';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: User['role'][];
  disallowedRoles?: User['role'][];
}

const ProtectedRoute = ({ children, allowedRoles, disallowedRoles }: ProtectedRouteProps) => {
  const { currentUser } = useContext(AuthContext);
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect to dashboard if role is not allowed
    return <Navigate to="/dashboard" replace />;
  }

  if (disallowedRoles && disallowedRoles.includes(currentUser.role)) {
    // Redirect to dashboard if role is disallowed
    return <Navigate to="/dashboard" replace />;
  }


  return children;
};

export default ProtectedRoute;
