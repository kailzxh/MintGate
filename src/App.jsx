// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider, useAuth } from './contexts/AuthContext';
// import { ProtectedRoute } from './components/ProtectedRoute';
// import Navbar from './components/Navbar';
// import { LoginForm, SignUpForm } from './pages/Login';
// import EventMarketplace from './pages/EventMarketplace';
// import TicketManagement from './pages/TicketManagement';
// import EventHosting from './pages/EventHosting';

// function AppRoutes() {
//   const { user, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         Loading...
//       </div>
//     );
//   }

//   return (
//     <Routes>
//       {!user ? (
//         <>
//           <Route path="/login" element={<LoginForm />} />
//           <Route path="/signup" element={<SignUpForm />} />
//           {/* Redirect any unknown path to /login */}
//           <Route path="*" element={<Navigate to="/login" replace />} />
//         </>
//       ) : (
//         <>
//           <Route
//             path="/"
//             element={
//               <ProtectedRoute>
//                 <EventMarketplace />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/tickets"
//             element={
//               <ProtectedRoute>
//                 <TicketManagement />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/host"
//             element={
//               <ProtectedRoute>
//                 <EventHosting />
//               </ProtectedRoute>
//             }
//           />
//           {/* Redirect any unknown path to the dashboard */}
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </>
//       )}
//     </Routes>
//   );
// }

// function App() {
//   return (
//     <Router>
//       <AuthProvider>
//         <div className="min-h-screen bg-gray-50">
//           <Navbar />
//           <main className="container mx-auto px-4 py-8">
//             <AppRoutes />
//           </main>
//         </div>
//       </AuthProvider>
//     </Router>
//   );
// }

// export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import { LoginForm, SignUpForm } from './pages/Login';
import EventMarketplace from './pages/EventMarketplace';
import TicketManagement from './pages/TicketManagement';
import EventHosting from './pages/EventHosting';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {!user ? (
        <>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignUpForm />} />
          {/* If no user, force any unknown route to /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <EventMarketplace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <TicketManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host"
            element={
              <ProtectedRoute>
                <EventHosting />
              </ProtectedRoute>
            }
          />
          {/* If logged in, any unknown path goes to the dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <AppRoutes />
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
