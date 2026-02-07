import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import {
  getApprovedIssuers,
  getPendingIssuers,
  approveIssuer,
  rejectIssuer,
} from "../utils/api";

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [approvedIssuers, setApprovedIssuers] = useState([]);
  const [pendingIssuers, setPendingIssuers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    loadIssuers();
  }, []);

  const loadIssuers = async () => {
    setLoading(true);
    try {
      const approved = await getApprovedIssuers(); 
      const pending = await getPendingIssuers();   
      setApprovedIssuers(approved || []);
      setPendingIssuers(pending || []);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to load issuers" });
    } finally {
      setLoading(false);
    }
  };

  // --- UPDATED: Use walletAddress as the identifier ---
  const handleApprove = async (walletAddress) => {
    try {
      await approveIssuer(walletAddress);
      setMessage({ type: "success", text: "University approved successfully" });
      loadIssuers(); // Refresh list
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Approval failed" });
    }
  };

  const handleReject = async (walletAddress) => {
    try {
      await rejectIssuer(walletAddress);
      setMessage({ type: "success", text: "University rejected" });
      loadIssuers(); // Refresh list
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Rejection failed" });
    }
  };

  return (
    <div className="admin-dashboard-container fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Government Dashboard</h1>
          <p className="dashboard-subtitle">
            Admin Wallet: <span className="mono">{user.wallet}</span>
          </p>
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

      {/* TABS */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          Pending Requests
          {pendingIssuers.length > 0 && (
            <span className="badge">{pendingIssuers.length}</span>
          )}
        </button>

        <button 
          className={`tab-btn ${activeTab === "approved" ? "active" : ""}`}
          onClick={() => setActiveTab("approved")}
        >
          Approved Issuers
          {approvedIssuers.length > 0 && (
            <span className="badge badge-success">
              {approvedIssuers.length}
            </span>
          )}
        </button>
      </div>

      {/* CONTENT */}
      <div className="dashboard-content">
        {loading ? (
          <div className="loading-spinner">Loading Data...</div>
        ) : (
          <>
            {/* --- PENDING TAB --- */}
            {activeTab === "pending" && (
              <div className="issuers-grid">
                {pendingIssuers.length === 0 ? (
                  <p className="empty-state">No pending requests</p>
                ) : (
                  pendingIssuers.map((issuer) => (
                    <div key={issuer.walletAddress} className="issuer-card card">
                      <div className="card-header">
                        <h3>{issuer.name || "Unknown University"}</h3>
                        <span className="role-tag">Issuer Request</span>
                      </div>
                      
                      <div className="card-body">
                        <label>Wallet Address:</label>
                        <p className="mono small">{issuer.walletAddress}</p>
                        
                        {issuer.username && (
                           <p className="small text-muted">User: @{issuer.username}</p>
                        )}
                      </div>

                      <div className="issuer-actions">
                        <button
                          className="btn btn-success"
                          onClick={() => handleApprove(issuer.walletAddress)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleReject(issuer.walletAddress)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* --- APPROVED TAB --- */}
            {activeTab === "approved" && (
              <div className="issuers-grid">
                {approvedIssuers.length === 0 ? (
                  <p className="empty-state">No approved issuers yet</p>
                ) : (
                  approvedIssuers.map((issuer) => (
                    <div key={issuer.walletAddress} className="issuer-card card approved">
                      <div className="card-header">
                        <h3>{issuer.name || "Unknown University"}</h3>
                        <span className="status-badge active">Active</span>
                      </div>
                      <div className="card-body">
                        <p className="mono small">{issuer.walletAddress}</p>
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
