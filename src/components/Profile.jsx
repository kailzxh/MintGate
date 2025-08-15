// import React, { useEffect, useState, useCallback } from "react";
// import Slider from "react-slick";
// import { connectWallet, fetchUserTickets, fetchOwnerEvents } from "../utils/web3";
// import TicketCard from "./TicketCard";
// import EventCard from "./EventCard";
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";

// export default function Profile({ currentUser }) {
//   const [tickets, setTickets] = useState([]);
//   const [events, setEvents] = useState([]);
//   const [activeTab, setActiveTab] = useState("tickets");
//   const [loading, setLoading] = useState(true);

//   const carouselSettings = {
//     dots: true,
//     infinite: false,
//     speed: 500,
//     slidesToShow: 3,
//     slidesToScroll: 1,
//     responsive: [
//       { breakpoint: 1024, settings: { slidesToShow: 2 } },
//       { breakpoint: 768, settings: { slidesToShow: 1 } }
//     ]
//   };

//   // 🔹 Fetch Tickets
//   const loadUserTickets = useCallback(async (address, provider) => {
//     console.log("📥 Fetching purchased tickets...");
//     const userTickets = await fetchUserTickets(address, provider, "POLYGON");
//     console.log("🎟 Tickets fetched:", userTickets);
//     setTickets(userTickets || []);
//   }, []);

//   // 🔹 Fetch Owner Events (improved like your `loadEvents`)
//  const loadOwnerEvents = useCallback(async (address, provider) => {
//   console.log("📥 Fetching hosted events...");
//   try {
//     const rawEvents = await fetchOwnerEvents(address, provider, "POLYGON");
//     console.log("📦 Raw owner events:", rawEvents);

//     if (!Array.isArray(rawEvents)) {
//       console.warn("⚠️ fetchOwnerEvents did not return an array.");
//       setEvents([]);
//       return;
//     }

//     const now = Date.now();

//     const validEvents = rawEvents
//       .map(event => {
//         const metadata = event.metadata || {};
//         const parsedDate = metadata.date || event.date;
//         const dateObj = new Date(parsedDate);

//         return {
//           id: event.id,
//           name: metadata.name || event.name || "Untitled Event",
//           date: parsedDate,
//           dateObj,
//           chain: event.chain || "Polygon",
//           price: parseFloat(event.price) || 0,
//           remaining: Number(event.remaining ?? 0),
//           totalTickets: Number(event.totalTickets ?? 0),
//           ipfsCID: event.ipfsCID || event.metadataCID, // pass through for EventCard
//           imageCID: event.imageCID,
//           imageMetaCID: metadata.image || "", // if already have an IPFS path
//         };
//       })
//       .filter(event => event.dateObj.getTime() > now);

//     setEvents(validEvents);
//   } catch (error) {
//     console.error("❌ Error loading events:", error);
//     setEvents([]);
//   }
// }, []);



//   // 🔹 Load Everything
//   const loadProfileData = useCallback(async () => {
//     setLoading(true);
//     try {
//       console.log("🔄 Connecting wallet...");
//       const signer = await connectWallet();
//       const provider = signer.provider;
//       const address = await signer.getAddress();
//       console.log("✅ Connected address:", address);

//       await Promise.all([
//         loadUserTickets(address, provider),
//         loadOwnerEvents(address, provider)
//       ]);
//     } catch (err) {
//       console.error("❌ Error loading profile data:", err);
//     } finally {
//       setLoading(false);
//     }
//   }, [loadUserTickets, loadOwnerEvents]);

//   useEffect(() => {
//     loadProfileData();
//   }, [loadProfileData]);

//   if (loading) return <div className="profile-loading">Loading profile...</div>;

//   return (
//     <div className="profile-container">
//       <h1>{currentUser?.name || "User"}’s Profile</h1>
//       <p className="profile-email">{currentUser?.email}</p>

//       {/* Tabs */}
//       <div className="profile-tabs">
//         <button
//           className={activeTab === "tickets" ? "active" : ""}
//           onClick={() => setActiveTab("tickets")}
//         >
//           Purchased Tickets
//         </button>
//         <button
//           className={activeTab === "events" ? "active" : ""}
//           onClick={() => setActiveTab("events")}
//         >
//           Hosted Events
//         </button>
//       </div>

//       {/* Content */}
//       <div className="profile-content">
//         {activeTab === "tickets" && (
//           tickets.length > 0 ? (
//             <div className="ticket-list space-y-4">
//               {tickets.map(ticket => (
//                 <TicketCard key={ticket.tokenId} ticket={ticket} />
//               ))}
//             </div>
//           ) : (
//             <p>No tickets purchased yet.</p>
//           )
//         )}

//         {activeTab === "events" && (
//           events.length > 0 ? (
//             <Slider {...carouselSettings}>
//               {events.map(event => (
//                 <div key={event.id} className="p-2">
//                   <EventCard key={event.id} event={event} />
//                 </div>
//               ))}
//             </Slider>
//           ) : (
//             <p>No hosted events found.</p>
//           )
//         )}
//       </div>
//     </div>
//   );
// }
import React, { useState, useEffect } from 'react';
import EventCard from '../components/EventCard';
import { connectWallet, fetchCreatedEvents } from '../utils/web3';

function Profile() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserEvents = async () => {
      try {
        setLoading(true);
        const signer = await connectWallet();
        const provider = signer.provider;
        const address = await signer.getAddress();

        // fetch only events created by this user
        const rawEvents = await fetchCreatedEvents(provider, 'POLYGON', address);

        const now = Date.now();

        const userEvents = rawEvents
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
              remaining: Number(event.remaining ?? 0),
              totalTickets: Number(event.totalTickets ?? 0),
              ipfsCID: event.ipfsCID,
              imageCID: event.imageCID,
            };
          })
          .filter((event) => event.dateObj.getTime() > now);

        setEvents(userEvents);
      } catch (error) {
        console.error('Error loading user events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserEvents();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-gray-100">My Events</h1>

      {loading ? (
        <p className="text-gray-500">Loading your events...</p>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No events found.</p>
      )}
    </div>
  );
}

export default Profile;
