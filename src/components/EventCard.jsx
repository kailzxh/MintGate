import React from 'react';
import { connectWallet, purchaseTicket } from '../utils/web3';

function EventCard({ event }) {
  const { id, title, date, chain, price, remaining, total, image } = event;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handlePurchase = async () => {
    try {
      const signer = await connectWallet(); // ✅ Get signer from MetaMask
      const tx = await purchaseTicket(signer, id, chain); // ✅ Correct usage
      alert(`Ticket purchased successfully! Transaction: ${tx.transactionHash}`);
    } catch (error) {
      alert('Failed to purchase ticket: ' + error.message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 px-4 py-2 rounded absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-md">
          <span className="font-medium">
            {chain === 'ethereum' ? 'ETH' : 'MATIC'} {price}
          </span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="font-poppins font-semibold text-xl text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{formatDate(date)}</p>
        <div className="flex justify-between items-center">
          <div className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 px-4 py-2 rounded text-sm text-gray-500">
            {remaining}/{total} available
          </div>
          <button 
            onClick={handlePurchase}
            disabled={remaining === 0}
            className={`${
              remaining === 0 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white px-4 py-2 rounded-lg font-medium transition-colors`}
          >
            {remaining === 0 ? 'Sold Out' : 'Buy Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventCard;
