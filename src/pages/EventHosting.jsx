import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { connectWallet,getTicketNFTContract , createEvent, CHAINS } from '../utils/web3';


function EventHosting() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    date: new Date(),
    price: '',
    totalTickets: '',
    description: '',
    imageFile: null,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  const { title, date, price, totalTickets, description, imageFile } = formData;
  const priceValue = parseFloat(price);
  const ticketCount = parseInt(totalTickets, 10);

  if (
    !title ||
    !description ||
    !imageFile ||
    isNaN(priceValue) || priceValue <= 0 ||
    isNaN(ticketCount) || ticketCount <= 0
  ) {
    alert('Please fill in all fields with valid values.');
    return;
  }

  setLoading(true);
  try {
    const signer = await connectWallet();
    const rawChainId = window.ethereum.chainId;
    const chainId = parseInt(rawChainId, 16);

    let chainKey;
    if (chainId === 80002) {
      chainKey = 'polygon';
    } else if (chainId === CHAINS.ETHEREUM.id) {
      chainKey = 'ethereum';
    } else {
      alert(`Unsupported network (chainId=${chainId}). Please switch to Polygon or Ethereum.`);
      setLoading(false);
      return;
    }

    // const factoryAddress = CONTRACTS[chainKey].factory;

    // Create event
    const result = await createEvent(signer, {
      name: title,
      description,
      date,
      chain: chainKey,
      maxTickets: ticketCount,
      imageFile,
      price: priceValue,
    });

    alert(`✅ Event created!\nTX Hash: ${result.transactionHash}`);

//    await approveTicketNFTIfNeeded(signer); // approve TicketNFT to manage 1155
// await getTicketNFTContract.mintTicketsFromFactory(eventId, amount); 

    
  } catch (err) {
    console.error(err);
    alert(`❌ ${err.reason || err.message || 'Event creation failed.'}`);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Host New Event</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Event Title</label>
          <input
            type="text" required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <DatePicker
            selected={formData.date}
            onChange={date => setFormData({ ...formData, date })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            minDate={new Date()}
            dateFormat="yyyy-MM-dd"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Ticket Price (ETH)</label>
          <input
            type="number" step="0.0001" min="0" required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            value={formData.price}
            onChange={e => setFormData({ ...formData, price: e.target.value })}
          />
        </div>

        {/* Total Tickets */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Total Tickets</label>
          <input
            type="number" min="1" required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            value={formData.totalTickets}
            onChange={e => setFormData({ ...formData, totalTickets: e.target.value })}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            rows={4} required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Event Image</label>
          <input
            type="file" accept="image/*" required
            onChange={e => setFormData({ ...formData, imageFile: e.target.files[0] })}
            className="mt-1 block w-full text-gray-700"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-lg font-medium text-white ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading ? 'Creating Event...' : 'Create Event'}
        </button>
      </form>
    </div>
  );
}

export default EventHosting;