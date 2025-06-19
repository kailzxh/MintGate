// import React, { useState, useEffect } from 'react';
// import EventCard from '../components/EventCard';
// import { connectWallet, fetchCreatedEvents } from '../utils/web3';

// const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

// async function fetchJSON(cid, path = 'metadata.json') {
//   const url = `${IPFS_GATEWAY}/${cid}/${path}`;
//   const res = await fetch(url);
//   if (!res.ok) throw new Error(`Failed to fetch metadata from ${url}`);
//   return await res.json();
// }

// function EventMarketplace() {
//   const [events, setEvents] = useState([]);
//   const [filter, setFilter] = useState({
//     chain: 'all',
//     date: 'all',
//     price: 'all',
//   });
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadEvents = async () => {
//       try {
//         setLoading(true);
//         const signer = await connectWallet();
//         const provider = signer.provider;
//         const rawEvents = await fetchCreatedEvents(provider, 'POLYGON'); // optionally dynamic

//         const now = Date.now();

//         const enrichedEvents = await Promise.all(
//           rawEvents.map(async (event) => {
//             try {
//               // Fetch top-level event metadata
//               const eventMeta = await fetchJSON(event.metadataCID);

//               // Fetch image metadata (optional — only if "image" is another CID)
//               let imageUrl = '';
//               if (eventMeta.image?.startsWith('ipfs://')) {
//                 const imageCID = eventMeta.image.replace('ipfs://', '').split('/')[0];
//                 const imageMeta = await fetchJSON(imageCID);
//                 imageUrl = imageMeta.image.replace('ipfs://', IPFS_GATEWAY + '/');
//               } else {
//                 imageUrl = eventMeta.image || '';
//               }

//               const timestamp = parseInt(event.eventTimestamp) * 1000;

//               return {
//                 id: event.id,
//                 name: eventMeta.name || event.name || 'Untitled',
//                 description: eventMeta.description || '',
//                 date: new Date(timestamp),
//                 price: parseFloat(event.priceInWei) / 1e18,
//                 chain: 'polygon',
//                 image: imageUrl,
//               };
//             } catch (err) {
//               console.warn('Skipping event due to metadata error:', err);
//               return null;
//             }
//           })
//         );

//         const validEvents = enrichedEvents.filter((e) => e && e.date.getTime() > now);
//         setEvents(validEvents);
//       } catch (error) {
//         console.error('Error loading events:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadEvents();
//   }, []);

//   const filteredEvents = events.filter((event) => {
//     const now = new Date();
//     const matchChain =
//       filter.chain === 'all' || event.chain?.toLowerCase() === filter.chain.toLowerCase();

//     const matchPrice =
//       filter.price === 'all' ||
//       (filter.price === 'free' && event.price === 0) ||
//       (filter.price === 'paid' && event.price > 0);

//     const matchDate =
//       filter.date === 'all' ||
//       (filter.date === 'today' && event.date.toDateString() === now.toDateString()) ||
//       (filter.date === 'week' &&
//         event.date >= now &&
//         event.date <= new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)) ||
//       (filter.date === 'month' && event.date.getMonth() === now.getMonth());

//     return matchChain && matchPrice && matchDate;
//   });

//   return (
//     <div className="p-4">
//       <div className="mb-8">
//         <h1 className="text-4xl font-bold text-gray-900 mb-4 dark:bg-gray-900 dark:text-gray-100 px-4 py-2 rounded">
//           Upcoming Events
//         </h1>

//         <div className="flex flex-wrap gap-4">
//           <select
//             className="rounded-lg border-gray-300 p-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
//             value={filter.chain}
//             onChange={(e) => setFilter({ ...filter, chain: e.target.value })}
//           >
//             <option value="all">All Chains</option>
//             <option value="ethereum">Ethereum</option>
//             <option value="polygon">Polygon</option>
//           </select>

//           <select
//             className="rounded-lg border-gray-300 p-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
//             value={filter.date}
//             onChange={(e) => setFilter({ ...filter, date: e.target.value })}
//           >
//             <option value="all">All Dates</option>
//             <option value="today">Today</option>
//             <option value="week">This Week</option>
//             <option value="month">This Month</option>
//           </select>

//           <select
//             className="rounded-lg border-gray-300 p-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
//             value={filter.price}
//             onChange={(e) => setFilter({ ...filter, price: e.target.value })}
//           >
//             <option value="all">All Prices</option>
//             <option value="free">Free</option>
//             <option value="paid">Paid</option>
//           </select>
//         </div>
//       </div>

//       {loading ? (
//         <p className="text-gray-500">Loading events...</p>
//       ) : filteredEvents.length > 0 ? (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredEvents.map((event) => (
//             <EventCard key={event.id} event={event} />
//           ))}
//         </div>
//       ) : (
//         <p className="text-gray-500">No events found.</p>
//       )}
//     </div>
//   );
// }

// export default EventMarketplace;
import React, { useState, useEffect } from 'react';
import EventCard from '../components/EventCard';
import { connectWallet, fetchCreatedEvents } from '../utils/web3';

function EventMarketplace() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState({
    chain: 'all',
    date: 'all',
    price: 'all',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const loadEvents = async () => {
    try {
      setLoading(true);
      const signer = await connectWallet();
      const provider = signer.provider;

      const rawEvents = await fetchCreatedEvents(provider, 'POLYGON');

      const now = Date.now();

      const validEvents = rawEvents
        .map((event) => {
          const metadata = event.metadata || {};
          const parsedDate = metadata.date || event.date;

          return {
            id: event.id,
            name: metadata.name || event.name || 'Untitled Event',
            image: metadata.image || event.image || '',
            price: parseFloat(event.price) || 0,
            chain: event.chain || 'Polygon',
            date: parsedDate,
            dateObj: new Date(parsedDate),
            remaining: Number(event.remaining ?? 0),       // ✅ fixed
            totalTickets: Number(event.totalTickets ?? 0),
            ipfsCID: event.ipfsCID,     // pass through metadata CID
            imageCID: event.imageCID,
          };
        })
        .filter((event) => event.dateObj.getTime() > now);

      setEvents(validEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  loadEvents();
}, []);


  const applyFilters = (events) => {
    const now = new Date();

    return events.filter((event) => {
      const matchChain =
        filter.chain === 'all' ||
        event.chain.toLowerCase() === filter.chain.toLowerCase();

      const matchPrice =
        filter.price === 'all' ||
        (filter.price === 'free' && event.price === 0) ||
        (filter.price === 'paid' && event.price > 0);

      const eventDate = event.dateObj;

      const matchDate =
        filter.date === 'all' ||
        (filter.date === 'today' &&
          eventDate.toDateString() === now.toDateString()) ||
        (filter.date === 'week' &&
          eventDate >= now &&
          eventDate <= new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)) ||
        (filter.date === 'month' && eventDate.getMonth() === now.getMonth());

      return matchChain && matchPrice && matchDate;
    });
  };

  const filteredEvents = applyFilters(events);

  return (
    <div className="p-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 dark:bg-gray-900 dark:text-gray-100 px-4 py-2 rounded">
          Upcoming Events
        </h1>

        <div className="flex flex-wrap gap-4">
          <select
            className="rounded-lg border-gray-300 p-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
            value={filter.chain}
            onChange={(e) => setFilter({ ...filter, chain: e.target.value })}
          >
            <option value="all">All Chains</option>
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
          </select>

          <select
            className="rounded-lg border-gray-300 p-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
            value={filter.date}
            onChange={(e) => setFilter({ ...filter, date: e.target.value })}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <select
            className="rounded-lg border-gray-300 p-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
            value={filter.price}
            onChange={(e) => setFilter({ ...filter, price: e.target.value })}
          >
            <option value="all">All Prices</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading events...</p>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No events found.</p>
      )}
    </div>
  );
}

export default EventMarketplace;
