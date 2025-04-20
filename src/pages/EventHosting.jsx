import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { connectWallet, createEvent } from '../utils/web3';

function EventHosting() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    date: new Date(),
    price: '',          // Not currently used in createEvent
    totalTickets: '',
    description: '',
    image: '',          // Not currently used in createEvent
    chain: 'ethereum'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure a wallet is connected:
      const signer = await connectWallet();
      console.log("Connected signer:", await signer.getAddress());

      // Prepare the event details to match what createEvent() expects.
      const eventDetails = {
        name: formData.title,
        date: formData.date,
        description: formData.description,
        chain: formData.chain,
        maxTickets: parseInt(formData.totalTickets, 10)
        // Optionally: You could add additional properties, such as price or image if supported.
      };

      // Call createEvent with the signer and event details.
      const result = await createEvent(signer, eventDetails);
      alert(`Event created successfully!\nTransaction hash: ${result.transactionHash}`);
      navigate('/');
    } catch (error) {
      console.error("Failed to create event:", error);
      alert('Failed to create event: ' + error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Host New Event</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Event Title</label>
          <input
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <DatePicker
            selected={formData.date}
            onChange={(date) => setFormData({ ...formData, date })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Ticket Price (ETH)</label>
          <input
            type="number"
            step="0.001"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Total Tickets</label>
          <input
            type="number"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={formData.totalTickets}
            onChange={(e) => setFormData({ ...formData, totalTickets: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Blockchain</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={formData.chain}
            onChange={(e) => setFormData({ ...formData, chain: e.target.value })}
          >
            <option value="ethereum">Ethereum</option>
            <option value="solana">Solana</option>
            <option value="polygon">Polygon</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows="4"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Image URL</label>
          <input
            type="url"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Create Event
        </button>
      </form>
    </div>
  );
}

export default EventHosting;
