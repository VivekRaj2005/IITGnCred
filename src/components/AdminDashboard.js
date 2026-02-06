import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { getApprovedIssuers, getPendingIssuers, approveIssuer, rejectIssuer } from '../utils/api';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [approvedIssuers, setApprovedIssuers] = useState([]);
  const [pendingIssuers, setPendingIssuers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadIssuers();
  }, []);

  const loadIssuers = async () => {
    setLoading(true);
    try {
      const approved = await getApprovedIssuers();
      const pending = await getPendingIssuers();
      setApprovedIssuers(approved);
      setPendingIssuers(pending);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load issuers' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (username) => {
    try {
      await approveIssuer(username);
      setMessage({ type: 'success', text: 'Issuer approved successfully' });
      loadIssuers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleReject = async (username) => {
    try {
      await rejectIssuer(username);
      setMessage({ type: 'success', text: 'Issuer rejected' });
      loadIssuers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <div className="admin-dashboard-container fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">👑 Admin Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back, {user.username}</p>
        </div>
        <button className="btn btn-secondary" onClick={onLogout}>
          Logout
        </button>
      </div>

      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals
          {pendingIssuers.length > 0 && (
            <span className="badge">{pendingIssuers.length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved Issuers
          {approvedIssuers.length > 0 && (
            <span className="badge badge-success">{approvedIssuers.length}</span>
          )}
        </button>
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div className="loading-container">
            <span className="loading"></span>
            <p>Loading issuers...</p>
          </div>
        ) : (
          <>
            {activeTab === 'pending' && (
              <div className="issuers-grid">
                {pendingIssuers.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>No Pending Approvals</h3>
                    <p>All issuer requests have been processed</p>
                  </div>
                ) : (
                  pendingIssuers.map((issuer, index) => (
                    <div key={index} className="issuer-card card" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="issuer-header">
                        <div className="issuer-icon">🎫</div>
                        <div className="issuer-info">
                          <h3 className="issuer-name">{issuer.name}</h3>
                          <p className="issuer-username">@{issuer.username}</p>
                        </div>
                      </div>
                      <div className="issuer-meta">
                        <span className="meta-label">Registered:</span>
                        <span className="meta-value">
                          {new Date(issuer.registeredAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="issuer-actions">
                        <button
                          className="btn btn-success"
                          onClick={() => handleApprove(issuer.username)}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleReject(issuer.username)}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'approved' && (
              <div className="issuers-grid">
                {approvedIssuers.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📂</div>
                    <h3>No Approved Issuers</h3>
                    <p>Approve issuers from the pending tab</p>
                  </div>
                ) : (
                  approvedIssuers.map((issuer, index) => (
                    <div key={index} className="issuer-card card approved" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="issuer-header">
                        <div className="issuer-icon">✓</div>
                        <div className="issuer-info">
                          <h3 className="issuer-name">{issuer.name}</h3>
                          <p className="issuer-username">@{issuer.username}</p>
                        </div>
                      </div>
                      <div className="issuer-meta">
                        <span className="meta-label">Status:</span>
                        <span className="status-badge active">Active</span>
                      </div>
                      <div className="issuer-meta">
                        <span className="meta-label">Approved:</span>
                        <span className="meta-value">
                          {new Date(issuer.approvedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;