import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/SignUp';
import EventMarketplace from './pages/EventMarketplace';
import TicketManagement from './pages/TicketManagement';
import EventHosting from './pages/EventHosting';
import AuthPage from "./pages/AuthPage";

function AppRoutes() {
  return (
    <Routes>
      
     

      {/* Protected Routes */}
      <Route
        path="/"
        element={
         
            <EventMarketplace />
          
        }
      />
      <Route
        path="/tickets"
        element={
         
            <TicketManagement />
         
        }
      />
      <Route
        path="/host"
        element={
          
            <EventHosting />
          
        }
      />

      {/* Fallback Routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      
        <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300 min-h-screen bg-white text-black dark:bg-gray-900 dark:text-white transition-colors duration-300 min-h-screen bg-gray-50">
          
            <Navbar />
          
          <main className="container mx-auto px-4 py-8">
            <AppRoutes />
          </main>
          <Toaster position="top-right" />
        </div>
      
    </Router>
  );
}

export default App;