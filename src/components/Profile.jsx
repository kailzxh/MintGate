import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import axios from "axios";
import TicketCard from "./TicketCard"; // component to display ticket
import EventCard from "./EventCard";   // component to display event
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Profile.css"; // optional: for custom styling

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

  // Fetch purchased tickets
  const fetchTickets = async () => {
    try {
      const res = await axios.get(`/users/${currentUser.id}/tickets`);
      setTickets(res.data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
  };

  // Fetch hosted events
  const fetchEvents = async () => {
    try {
      const res = await axios.get(`/users/${currentUser.id}/events`);
      setEvents(res.data);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTickets(), fetchEvents()]);
      setLoading(false);
    };
    if (currentUser?.id) {
      loadData();
    }
  }, [currentUser]);

  if (loading) return <div className="profile-loading">Loading profile...</div>;

  return (
    <div className="profile-container">
      <h1>{currentUser.name}’s Profile</h1>
      <p className="profile-email">{currentUser.email}</p>

      {/* Tab Navigation */}
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

      {/* Tab Content */}
      <div className="profile-content">
        {activeTab === "tickets" && (
          tickets.length > 0 ? (
            <div className="ticket-list">
              {tickets.map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} />
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
                <EventCard key={event.id} event={event} />
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
