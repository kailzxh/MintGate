// import React, { useState } from 'react';
// import { Link , useNavigate } from 'react-router-dom';
// import { connectWallet } from '../utils/web3';
// import { useAuth } from '../contexts/AuthContext';
// import { toast } from 'react-hot-toast'; 
// function Navbar() {
//   const [walletAddress, setWalletAddress] = useState('');
//   const { logout, currentUser } = useAuth();
//   const navigate = useNavigate();
//   const handleConnectWallet = async () => {
//     try {
//       const signer = await connectWallet();
//       const address = await signer.getAddress();
//       setWalletAddress(address);
//     } catch (error) {
//       alert('Failed to connect wallet: ' + error.message);
//     }
//   };
//   const handleLogout = async () => {
//     try {
//       await logout();
//       toast.success('Logged out successfully');
//       navigate('/login');
//     } catch (error) {
//       toast.error('Failed to log out');
//       console.error(error);
//     }
//   };

//   return (
//     <nav className="bg-white shadow-lg">
//       <div className="container mx-auto px-4">
//         <div className="flex justify-between items-center h-16">
//           <Link to="/" className="flex items-center">
//             <span className="font-poppins font-bold text-2xl text-indigo-600">MintGate</span>
//           </Link>
//           <div className="flex space-x-8">
//             <Link to="/" className="text-gray-700 hover:text-indigo-600 font-medium">
//               Events
//             </Link>
//             <Link to="/tickets" className="text-gray-700 hover:text-indigo-600 font-medium">
//               My Tickets
//             </Link>
//             <Link to="/host" className="text-gray-700 hover:text-indigo-600 font-medium">
//               Host Event
//             </Link>
//           </div>
//           <div className="flex items-center space-x-4">
//   <button 
//     onClick={handleConnectWallet}
//     className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
//   >
//     {walletAddress 
//       ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
//       : 'Connect Wallet'
//     }
//   </button>
//   {currentUser && (
//     <button
//       onClick={handleLogout}
//       className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
//     >
//       Logout
//     </button>
//   )}
// </div>

//         </div>
//       </div>
//     </nav>
//   );
// }

// export default Navbar;
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { connectWallet } from '../utils/web3';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

function Navbar() {
  const [walletAddress, setWalletAddress] = useState('');
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

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
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;