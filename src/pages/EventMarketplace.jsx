import React, { useState, useEffect } from 'react';
import EventCard from '../components/EventCard';
import { connectWallet, fetchCreatedEvents } from '../utils/web3';

function EventMarketplace() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState({
    chain: 'all',
    date: 'all',
    price: 'all'
  });

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const signer = await connectWallet();
        const provider = signer.provider;
        const allEvents = await fetchCreatedEvents(provider, 'POLYGON');

       
        const now = Date.now();
        const upcoming = allEvents.filter((e) => new Date(e.date).getTime() > now);
        setEvents(upcoming);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };

    loadEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    const matchChain = filter.chain === 'all' || event.chain === filter.chain;

    const matchPrice =
      filter.price === 'all' ||
      (filter.price === 'free' && parseFloat(event.price) === 0) ||
      (filter.price === 'paid' && parseFloat(event.price) > 0);

    const now = new Date();
    const eventDate = new Date(event.date);
    const matchDate =
      filter.date === 'all' ||
      (filter.date === 'today' && eventDate.toDateString() === now.toDateString()) ||
      (filter.date === 'week' &&
        eventDate >= now &&
        eventDate <= new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)) ||
      (filter.date === 'month' && eventDate.getMonth() === now.getMonth());

    return matchChain && matchPrice && matchDate;
  });

  return (
    <div className="p-4 ">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4  text-gray-800 dark:bg-gray-900 dark:text-gray-100 px-4 py-2 rounded">Upcoming Events</h1>
        <div className="flex flex-wrap gap-4">
          <select
            className="rounded-lg border-gray-300 p-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 px-4 py-2 rounded"
            value={filter.chain}
            onChange={(e) => setFilter({ ...filter, chain: e.target.value })}
          >
            <option value="all">All Chains</option>
            <option value="ethereum">Ethereum</option>
            <option value="solana">Solana</option>
            <option value="polygon">Polygon</option>
          </select>
          <select
            className="rounded-lg border-gray-300 p-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 px-4 py-2 rounded"
            value={filter.date}
            onChange={(e) => setFilter({ ...filter, date: e.target.value })}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <select
            className="rounded-lg border-gray-300 p-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 px-4 py-2 rounded"
            value={filter.price}
            onChange={(e) => setFilter({ ...filter, price: e.target.value })}
          >
            <option value="all">All Prices</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        ) : (
          <p className="text-gray-500 ">No events found.</p>
        )}
      </div>
    </div>
  );
}

export default EventMarketplace;
