import React, { useState, useEffect } from 'react';
import { getSwappableSlots, getMyEvents } from '../../services/api';
import SwapModal from './SwapModal';
import './Marketplace.css';

const Marketplace = () => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [mySwappableSlots, setMySwappableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [slotsResponse, eventsResponse] = await Promise.all([
        getSwappableSlots(),
        getMyEvents()
      ]);
      
      setAvailableSlots(slotsResponse.data.slots);
      
      const swappable = eventsResponse.data.events.filter(
        event => event.status === 'SWAPPABLE'
      );
      setMySwappableSlots(swappable);
      setError('');
    } catch (err) {
      setError('Failed to load marketplace');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSwap = (slot) => {
    if (mySwappableSlots.length === 0) {
      alert('You need to have at least one swappable slot to request a swap. Go to Dashboard and mark an event as swappable.');
      return;
    }
    setSelectedSlot(slot);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSlot(null);
  };

  const handleSwapSuccess = () => {
    setShowModal(false);
    setSelectedSlot(null);
    fetchData();
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

  if (loading) {
    return <div className="loading">Loading marketplace...</div>;
  }

  return (
    <div className="marketplace-container">
      <div className="marketplace-header">
        <h1>Slot Marketplace</h1>
        <p>Browse and request swaps for available time slots</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {mySwappableSlots.length === 0 && (
        <div className="info-banner">
          <p>💡 You don't have any swappable slots yet. Go to your Dashboard and mark an event as swappable to participate in swaps.</p>
        </div>
      )}

      {availableSlots.length === 0 ? (
        <div className="empty-state">
          <p>No slots available for swapping at the moment.</p>
          <p>Check back later!</p>
        </div>
      ) : (
        <div className="slots-grid">
          {availableSlots.map((slot) => (
            <div key={slot.id} className="slot-card">
              <div className="slot-header">
                <h3>{slot.title}</h3>
                <span className="slot-owner">by {slot.owner_name}</span>
              </div>
              
              <div className="slot-time">
                <p><strong>Start:</strong> {formatDateTime(slot.start_time)}</p>
                <p><strong>End:</strong> {formatDateTime(slot.end_time)}</p>
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={() => handleRequestSwap(slot)}
                disabled={mySwappableSlots.length === 0}
              >
                Request Swap
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <SwapModal
          slot={selectedSlot}
          mySwappableSlots={mySwappableSlots}
          onClose={handleCloseModal}
          onSuccess={handleSwapSuccess}
        />
      )}
    </div>
  );
};

export default Marketplace;