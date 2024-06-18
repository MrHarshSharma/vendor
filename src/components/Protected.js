import React from 'react'
import { Navigate, Outlet } from 'react-router-dom';

function Protected() {
    const token = localStorage.getItem('token');
  return (

    // token ? <Outlet />:<Navigate to="/login" /> 
    <Navigate to="/" />
  )
}

export default Protected