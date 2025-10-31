import React, { useState, useEffect } from 'react';
import { getMyEvents, updateEvent, deleteEvent } from '../../services/api';
import EventForm from './EventForm';
import './Dashboard.css';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await getMyEvents();
      setEvents(response.data.events);
      setError('');
    } catch (err) {
      setError('Failed to load events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSwappable = async (event) => {
    try {
      const newStatus = event.status === 'BUSY' ? 'SWAPPABLE' : 'BUSY';
      await updateEvent(event.id, { status: newStatus });
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update event');
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(eventId);
        fetchEvents();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete event');
      }
    }
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      BUSY: { class: 'badge-busy', text: 'Busy' },
      SWAPPABLE: { class: 'badge-swappable', text: 'Swappable' },
      SWAP_PENDING: { class: 'badge-pending', text: 'Swap Pending' }
    };
    const badge = badges[status] || badges.BUSY;
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  if (loading) {
    return <div className="loading">Loading your events...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>My Calendar</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Event'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <EventForm 
          onSuccess={() => {
            setShowForm(false);
            fetchEvents();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {events.length === 0 ? (
        <div className="empty-state">
          <p>No events yet. Create your first event to get started!</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <div key={event.id} className="event-card">
              <div className="event-header">
                <h3>{event.title}</h3>
                {getStatusBadge(event.status)}
              </div>
              
              <div className="event-time">
                <p><strong>Start:</strong> {formatDateTime(event.start_time)}</p>
                <p><strong>End:</strong> {formatDateTime(event.end_time)}</p>
              </div>

              {event.status !== 'SWAP_PENDING' && (
                <div className="event-actions">
                  <button
                    className={`btn ${event.status === 'SWAPPABLE' ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => handleToggleSwappable(event)}
                  >
                    {event.status === 'SWAPPABLE' ? 'Mark as Busy' : 'Make Swappable'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(event.id)}
                  >
                    Delete
                  </button>
                </div>
              )}

              {event.status === 'SWAP_PENDING' && (
                <p className="event-note">
                  This slot is involved in a pending swap request.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;