import React, { useState, useEffect } from 'react';
import { getMySwapRequests, respondToSwapRequest } from '../../services/api';
import './Requests.css';

const Requests = () => {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await getMySwapRequests();
      setIncomingRequests(response.data.incoming);
      setOutgoingRequests(response.data.outgoing);
      setError('');
    } catch (err) {
      setError('Failed to load requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId, accept) => {
    if (!window.confirm(`Are you sure you want to ${accept ? 'accept' : 'reject'} this swap request?`)) {
      return;
    }

    setProcessingId(requestId);
    try {
      await respondToSwapRequest(requestId, accept);
      alert(`Swap request ${accept ? 'accepted' : 'rejected'} successfully!`);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to process request');
    } finally {
      setProcessingId(null);
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
      PENDING: { class: 'badge-pending', text: 'Pending' },
      ACCEPTED: { class: 'badge-accepted', text: 'Accepted' },
      REJECTED: { class: 'badge-rejected', text: 'Rejected' }
    };
    const badge = badges[status] || badges.PENDING;
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  if (loading) {
    return <div className="loading">Loading requests...</div>;
  }

  return (
    <div className="requests-container">
      <h1>Swap Requests</h1>
      {error && <div className="error-message">{error}</div>}

      <section className="requests-section">
        <h2>Incoming Requests</h2>
        <p className="section-description">Others want to swap with you</p>
        
        {incomingRequests.length === 0 ? (
          <div className="empty-state">
            <p>No incoming swap requests</p>
          </div>
        ) : (
          <div className="requests-grid">
            {incomingRequests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <h3>Swap Request from {request.requester_name}</h3>
                  {getStatusBadge(request.status)}
                </div>

                <div className="swap-details">
                  <div className="slot-info">
                    <h4>They offer:</h4>
                    <p><strong>{request.their_slot_title}</strong></p>
                    <p>{formatDateTime(request.their_slot_start)}</p>
                    <p>{formatDateTime(request.their_slot_end)}</p>
                  </div>

                  <div className="swap-arrow">↔️</div>

                  <div className="slot-info">
                    <h4>For your:</h4>
                    <p><strong>{request.my_slot_title}</strong></p>
                    <p>{formatDateTime(request.my_slot_start)}</p>
                    <p>{formatDateTime(request.my_slot_end)}</p>
                  </div>
                </div>

                {request.status === 'PENDING' && (
                  <div className="request-actions">
                    <button
                      className="btn btn-success"
                      onClick={() => handleResponse(request.id, true)}
                      disabled={processingId === request.id}
                    >
                      {processingId === request.id ? 'Processing...' : 'Accept'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleResponse(request.id, false)}
                      disabled={processingId === request.id}
                    >
                      {processingId === request.id ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                )}

                <p className="request-date">
                  Received: {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="requests-section">
        <h2>Outgoing Requests</h2>
        <p className="section-description">Swaps you've requested from others</p>
        
        {outgoingRequests.length === 0 ? (
          <div className="empty-state">
            <p>No outgoing swap requests</p>
          </div>
        ) : (
          <div className="requests-grid">
            {outgoingRequests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <h3>Request to {request.owner_name}</h3>
                  {getStatusBadge(request.status)}
                </div>

                <div className="swap-details">
                  <div className="slot-info">
                    <h4>You offered:</h4>
                    <p><strong>{request.my_slot_title}</strong></p>
                    <p>{formatDateTime(request.my_slot_start)}</p>
                    <p>{formatDateTime(request.my_slot_end)}</p>
                  </div>

                  <div className="swap-arrow">↔️</div>

                  <div className="slot-info">
                    <h4>For their:</h4>
                    <p><strong>{request.their_slot_title}</strong></p>
                    <p>{formatDateTime(request.their_slot_start)}</p>
                    <p>{formatDateTime(request.their_slot_end)}</p>
                  </div>
                </div>

                <p className="request-date">
                  Sent: {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Requests;