import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { connectWallet } from '../utils/web3';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

function Navbar() {
  const [walletAddress, setWalletAddress] = useState('');
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage on first load
    return localStorage.getItem('theme') === 'dark';
  });

  // Apply/remove dark mode class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleConnectWallet = async () => {
    try {
      const signer = await connectWallet();
      const address = await signer.getAddress();
      setWalletAddress(address);
      toast.success('Wallet connected successfully');
    } catch (error) {
      toast.error('Failed to connect wallet: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
      console.error(error);
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <span className="font-poppins font-bold text-2xl text-indigo-600 dark:text-indigo-400">MintGate</span>
          </Link>
          <div className="flex space-x-8">
            <Link to="/" className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">
              Events
            </Link>
            <Link to="/tickets" className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">
              My Tickets
            </Link>
            <Link to="/host" className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">
              Host Event
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleConnectWallet}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              {walletAddress 
                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : 'Connect Wallet'
              }
            </button>
            {currentUser && (
              <button
                onClick={handleLogout}
                className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                Logout
              </button>
            )}
            <button
              onClick={() => setDarkMode(prev => !prev)}
              className="ml-2 text-sm px-3 py-1 border rounded-lg text-gray-800 dark:text-gray-200 border-gray-400 dark:border-gray-600"
            >
              {darkMode ? '🌞 Light' : '🌙 Dark'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
