import React, { useState } from 'react';

const MOCK_TICKETS = [
  {
    id: 1,
    eventTitle: "ETH Global London",
    eventDate: "2024-03-15",
    ticketId: "#1234",
    chain: "ethereum",
    status: "valid"
  },
  {
    id: 2,
    eventTitle: "Solana Summer Hackathon",
    eventDate: "2024-07-01",
    ticketId: "#5678",
    chain: "solana",
    status: "valid"
  }
];

function TicketManagement() {
  const [tickets] = useState(MOCK_TICKETS);

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-8">My Tickets</h1>
      <div className="space-y-4">
        {tickets.map(ticket => (
          <div 
            key={ticket.id}
            className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between"
          >
            <div>
              <h3 className="font-poppins font-semibold text-xl text-gray-900">{ticket.eventTitle}</h3>
              <p className="text-gray-600">Date: {new Date(ticket.eventDate).toLocaleDateString()}</p>
              <p className="text-gray-600">Ticket ID: {ticket.ticketId}</p>
              <p className="text-gray-600">Chain: {ticket.chain}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Valid
              </span>
              <button className="text-indigo-600 hover:text-indigo-800 font-medium">
                View NFT
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TicketManagement;