import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { connectWallet } from '../utils/web3';

function Navbar() {
  const [walletAddress, setWalletAddress] = useState('');

  const handleConnectWallet = async () => {
    try {
      const signer = await connectWallet();
      const address = await signer.getAddress();
      setWalletAddress(address);
    } catch (error) {
      alert('Failed to connect wallet: ' + error.message);
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <span className="font-poppins font-bold text-2xl text-indigo-600">MintGate</span>
          </Link>
          <div className="flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-indigo-600 font-medium">
              Events
            </Link>
            <Link to="/tickets" className="text-gray-700 hover:text-indigo-600 font-medium">
              My Tickets
            </Link>
            <Link to="/host" className="text-gray-700 hover:text-indigo-600 font-medium">
              Host Event
            </Link>
          </div>
          <button 
            onClick={handleConnectWallet}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            {walletAddress 
              ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : 'Connect Wallet'
            }
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;