// import React from 'react';
// import { connectWallet, purchaseTicket } from '../utils/web3';

// function EventCard({ event }) {
//   const { id, title, date, chain, price, remaining, total, image } = event;

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       month: 'long',
//       day: 'numeric',
//       year: 'numeric'
//     });
//   };

//   const handlePurchase = async () => {
//     try {
//       const signer = await connectWallet(); 
//       const tx = await purchaseTicket(signer, id, chain); 
//       alert(`Ticket purchased successfully! Transaction: ${tx.transactionHash}`);
//     } catch (error) {
//       alert('Failed to purchase ticket: ' + error.message);
//     }
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
//       <div className="relative h-48">
//         <img 
//           src={image} 
//           alt={title}
//           className="w-full h-full object-cover"
//         />
//         <div className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 px-4 py-2 rounded absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-md">
//           <span className="font-medium">
//             {chain === 'ethereum' ? 'ETH' : 'POL'} {price}
//           </span>
//         </div>
//       </div>
//       <div className="p-6">


        
//         <h3 className="font-poppins font-semibold text-xl text-gray-900 mb-2">{title}</h3>
//         <p className="text-gray-600 mb-4">{formatDate(date)}</p>
//         <div className="flex justify-between items-center">
//           <div className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 px-4 py-2 rounded text-sm text-gray-500">
//             {remaining}/{total} available
//           </div>
//           <button 
//             onClick={handlePurchase}
//             disabled={remaining === 0}
//             className={`${
//               remaining === 0 
//                 ? 'bg-gray-400 cursor-not-allowed' 
//                 : 'bg-indigo-600 hover:bg-indigo-700'
//             } text-white px-4 py-2 rounded-lg font-medium transition-colors`}
//           >
//             {remaining === 0 ? 'Sold Out' : 'Buy Ticket'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default EventCard;
import React, { useState } from 'react';
import { connectWallet, purchaseTicket } from '../utils/web3';

function EventCard({ event }) {
  const { id, title, date, chain, price, remaining, total, image } = event;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handlePurchase = async () => {
    try {
      setLoading(true);
      setError('');
      const signer = await connectWallet();
      const tx = await purchaseTicket(signer, id, chain);
      alert(`🎟️ Ticket purchased successfully!\nTransaction: ${tx.transactionHash}`);
    } catch (err) {
      console.error('Purchase failed:', err);
      setError(err.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const fallbackImage = 'https://via.placeholder.com/400x300.png?text=Event+Image';

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
      {/* Image */}
      <div className="relative h-48 w-full">
        <img
          src={imageError ? fallbackImage : image}
          alt={title || 'Event Image'}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
        {/* Price badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow text-sm font-semibold text-gray-900">
          {chain === 'ethereum' ? 'ETH' : 'POL'} {price ?? '0.00'}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="mb-4">
          <h3 className="font-poppins font-semibold text-xl text-gray-900 mb-1 truncate">
            {title || 'Untitled Event'}
          </h3>
          <p className="text-gray-600 text-sm">{formatDate(date)}</p>
        </div>

        <div className="flex justify-between items-center mt-auto">
          {/* Remaining tickets */}
          <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm">
            {remaining}/{total} available
          </div>

          {/* Buy button */}
          <button
            onClick={handlePurchase}
            disabled={remaining === 0 || loading}
            className={`${
              remaining === 0 || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200`}
          >
            {loading
              ? 'Processing...'
              : remaining === 0
              ? 'Sold Out'
              : 'Buy Ticket'}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-red-500 text-sm mt-2">
            ⚠️ {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default EventCard;
