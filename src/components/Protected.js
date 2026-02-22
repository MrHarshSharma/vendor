import React from 'react'
import { Navigate } from 'react-router-dom';

function Protected() {
  return (
    <Navigate to="/" />
  )
}

export default Protected