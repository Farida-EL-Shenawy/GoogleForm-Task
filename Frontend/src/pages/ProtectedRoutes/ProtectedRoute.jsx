import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

function isAuthenticated() {
  const token = localStorage.getItem('token')
  if (!token) return false
  try {
    const { exp } = jwtDecode(token)
    if (!exp) return true
    return Date.now() < exp * 1000
  } catch {
    return false
  }
}

export default function ProtectedRoute() {
  const location = useLocation()
  return isAuthenticated()
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: location }} />
}
