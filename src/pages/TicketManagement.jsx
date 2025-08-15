// import React, { useEffect, useState } from 'react';
// import { connectWallet, fetchUserTickets } from '../utils/web3';

// function TicketManagement() {
//   const [tickets, setTickets] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     async function loadTickets() {
//       try {
//         const signer = await connectWallet();
//         const provider = signer.provider;
//         const address = await signer.getAddress();

//         const userTickets = await fetchUserTickets(address, provider, 'POLYGON');
//         setTickets(userTickets);
//       } catch (err) {
//         console.error('Error loading tickets:', err);
//       } finally {
//         setLoading(false);
//       }
//     }
//     loadTickets();
//   }, []);

//   return (
//     <div>
//       <h1 className="text-4xl font-bold text-gray-900 mb-8">My Tickets</h1>
//       {loading ? (
//         <p className="text-gray-500">Loading tickets...</p>
//       ) : tickets.length === 0 ? (
//         <p className="text-gray-600">No tickets found.</p>
//       ) : (
//         <div className="space-y-4">
//           {tickets.map(ticket => (
//             <div 
//               key={ticket.tokenId}
//               className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between"
//             >
//               <div>
//                 <h3 className="font-poppins font-semibold text-xl text-gray-900">
//                   {ticket.eventTitle || 'Event Name'}
//                 </h3>
//                 <p className="text-gray-600">Date: {ticket.eventDate ? new Date(ticket.eventDate).toLocaleDateString() : 'N/A'}</p>
//                 <p className="text-gray-600">Ticket ID: #{ticket.tokenId}</p>
//                 <p className="text-gray-600 capitalize">Chain: {ticket.chain}</p>
//               </div>
//               <div className="flex items-center space-x-4">
//                 <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
//                   {ticket.status || 'Valid'}
//                 </span>
//                 {ticket.tokenURI && (
//                   <a
//   href={ticket.tokenURI.startsWith("ipfs://")
//     ? `https://ipfs.io/ipfs/${ticket.tokenURI.replace("ipfs://", "")}`
//     : ticket.tokenURI}
//   target="_blank"
//   rel="noopener noreferrer"
//   className="text-indigo-600 hover:text-indigo-800 font-medium"
// >
//   View NFT
// </a>

//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default TicketManagement;
import React, { useEffect, useState } from "react";
import { connectWallet, fetchUserTickets } from "../utils/web3";
import TicketCard from "../components/TicketCard";

function TicketManagement() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTickets() {
      try {
        const signer = await connectWallet();
        const provider = signer.provider;
        const address = await signer.getAddress();

        const userTickets = await fetchUserTickets(address, provider, "POLYGON");
        setTickets(userTickets);
      } catch (err) {
        console.error("Error loading tickets:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTickets();
  }, []);

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-8">My Tickets</h1>
      {loading ? (
        <p className="text-gray-500">Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p className="text-gray-600">No tickets found.</p>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.tokenId} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}

export default TicketManagement;
