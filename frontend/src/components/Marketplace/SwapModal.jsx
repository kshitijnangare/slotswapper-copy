import React, { useState } from 'react';
import { createSwapRequest } from '../../services/api';
import './SwapModal.css';

const SwapModal = ({ slot, mySwappableSlots, onClose, onSuccess }) => {
  const [selectedMySlot, setSelectedMySlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedMySlot) {
      setError('Please select one of your slots');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createSwapRequest({
        mySlotId: parseInt(selectedMySlot),
        theirSlotId: slot.id
      });
      alert('Swap request sent successfully!');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create swap request');
    } finally {
      setLoading(false);
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Request Swap</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="swap-preview">
            <div className="slot-preview">
              <h4>You want:</h4>
              <div className="slot-details">
                <p><strong>{slot.title}</strong></p>
                <p>Owner: {slot.owner_name}</p>
                <p>{formatDateTime(slot.start_time)} - {formatDateTime(slot.end_time)}</p>
              </div>
            </div>

            <div className="swap-arrow">↔️</div>

            <div className="slot-preview">
              <h4>You offer:</h4>
              {!selectedMySlot ? (
                <p className="placeholder-text">Select a slot below</p>
              ) : (
                <div className="slot-details">
                  {mySwappableSlots.find(s => s.id === parseInt(selectedMySlot)) && (
                    <>
                      <p><strong>{mySwappableSlots.find(s => s.id === parseInt(selectedMySlot)).title}</strong></p>
                      <p>{formatDateTime(mySwappableSlots.find(s => s.id === parseInt(selectedMySlot)).start_time)} - {formatDateTime(mySwappableSlots.find(s => s.id === parseInt(selectedMySlot)).end_time)}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="mySlot">Select your slot to offer:</label>
              <select
                id="mySlot"
                value={selectedMySlot}
                onChange={(e) => {
                  setSelectedMySlot(e.target.value);
                  setError('');
                }}
                required
              >
                <option value="">-- Choose a slot --</option>
                {mySwappableSlots.map((mySlot) => (
                  <option key={mySlot.id} value={mySlot.id}>
                    {mySlot.title} ({formatDateTime(mySlot.start_time)})
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SwapModal;