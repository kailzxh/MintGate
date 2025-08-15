import React, { useEffect, useState, useCallback } from "react";
import Slider from "react-slick";
import { connectWallet, fetchUserTickets, fetchCreatedEvents } from "../utils/web3";
import TicketCard from "./TicketCard"; 
import EventCard from "./EventCard";   
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function Profile({ currentUser }) {
  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("tickets");
  const [loading, setLoading] = useState(true);

  const carouselSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 768, settings: { slidesToShow: 1 } }
    ]
  };

  const loadProfileData = useCallback(async () => {
    setLoading(true);
    try {
      const signer = await connectWallet();
      const provider = signer.provider;
      const address = await signer.getAddress();

      const userTickets = await fetchUserTickets(address, provider, "POLYGON");
      setTickets(userTickets || []);

      const userEvents = await fetchCreatedEvents(address, provider, "POLYGON");
      setEvents(userEvents || []);
    } catch (err) {
      console.error("Error loading profile data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  if (loading) return <div className="profile-loading">Loading profile...</div>;

  return (
    <div className="profile-container">
      <h1>{currentUser?.name || "User"}’s Profile</h1>
      <p className="profile-email">{currentUser?.email}</p>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={activeTab === "tickets" ? "active" : ""}
          onClick={() => setActiveTab("tickets")}
        >
          Purchased Tickets
        </button>
        <button
          className={activeTab === "events" ? "active" : ""}
          onClick={() => setActiveTab("events")}
        >
          Hosted Events
        </button>
      </div>

      {/* Content */}
      <div className="profile-content">
        {activeTab === "tickets" && (
          tickets.length > 0 ? (
            <div className="ticket-list space-y-4">
              {tickets.map(ticket => (
                <TicketCard key={ticket.tokenId} ticket={ticket} />
              ))}
            </div>
          ) : (
            <p>No tickets purchased yet.</p>
          )
        )}

        {activeTab === "events" && (
          events.length > 0 ? (
            <Slider {...carouselSettings}>
              {events.map(event => (
                <div key={event.id} className="p-2">
                  <EventCard event={event} onRefresh={loadProfileData} />
                </div>
              ))}
            </Slider>
          ) : (
            <p>No hosted events found.</p>
          )
        )}
      </div>
    </div>
  );
}
