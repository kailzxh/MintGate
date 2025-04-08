import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import EventMarketplace from './pages/EventMarketplace';
import TicketManagement from './pages/TicketManagement';
import EventHosting from './pages/EventHosting';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<EventMarketplace />} />
            <Route path="/tickets" element={<TicketManagement />} />
            <Route path="/host" element={<EventHosting />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;