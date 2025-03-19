import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ResearchEngine from './components/ResearchEngine';
import PaymentPage from './components/PaymentPage';
import SignupSuccess from './components/SignupSuccess';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/signup-success" element={<SignupSuccess />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/research"
            element={
              <PrivateRoute>
                <ResearchEngine />
              </PrivateRoute>
            }
          />
          <Route
            path="/research/:id"
            element={
              <PrivateRoute>
                <Navigate to="/research" replace />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;