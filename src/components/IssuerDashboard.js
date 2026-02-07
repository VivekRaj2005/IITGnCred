import React, { useState } from 'react';
import './IssuerDashboard.css';
import { issueCredential, revokeCredential } from '../utils/api';

const IssuerDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('create');

  // CREATE STATE
  const [holderWallet, setHolderWallet] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [courseName, setCourseName] = useState(''); 

  // REVOKE STATE
  const [revokeId, setRevokeId] = useState('');
  
  // UI STATE
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile({
        name: file.name,
        type: file.type,
        data: reader.result, // Base64 data
      });
    };
    reader.readAsDataURL(file);
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!holderWallet || !selectedFile) {
      setMessage({ type: 'error', text: 'Please provide wallet address and select a file' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await issueCredential(holderWallet, selectedFile, courseName);
      setMessage({ type: 'success', text: result.message || "Credential issued successfully!" });
      
      // Reset Form
      setHolderWallet('');
      setCourseName('');
      setSelectedFile(null);
      const fileInput = document.getElementById('create-file-input');
      if(fileInput) fileInput.value = '';
    } catch (err) {
      setMessage({ type: 'error', text: err.message || "Issuance failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (e) => {
    e.preventDefault();
    if (!revokeId) {
      setMessage({ type: 'error', text: 'Please provide the Credential ID' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await revokeCredential(revokeId);
      setMessage({ type: 'success', text: result.message || "Credential revoked successfully" });
      setRevokeId('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || "Revocation failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="issuer-dashboard-container fade-in">
      {/* HEADER */}
      <div className="dashboard-header">
        <div className="header-info">
          <h1 className="dashboard-title">Issuer Dashboard</h1>
          <p className="dashboard-subtitle">
            Organization: <strong>{user.name}</strong>
          </p>
        </div>
        <button className="btn btn-secondary logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>

      {/* TABS */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => { setActiveTab('create'); setMessage({type:'', text:''}); }}
        >
          ➕ Issue
        </button>
        <button
          className={`tab-btn ${activeTab === 'revoke' ? 'active' : ''}`}
          onClick={() => { setActiveTab('revoke'); setMessage({type:'', text:''}); }}
        >
          🗑️ Revoke
        </button>
      </div>

      {/* MAIN CARD */}
      <div className="issuer-main-card card">
        <div className="card-header">
          <h2 className="card-title">
            {activeTab === 'create' ? 'Issue New Credential' : 'Revoke Credential'}
          </h2>
          <p className="card-description">
            {activeTab === 'create'
              ? 'Upload a document and link it to a student\'s wallet address.'
              : 'Permanently invalidate a credential on the blockchain.'}
          </p>
        </div>

        {message.text && (
          <div className={`message-banner message-${message.type}`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        {activeTab === 'create' ? (
          <form onSubmit={handleIssue} className="issue-form">
            <div className="form-group">
              <label className="form-label">Student Wallet Address</label>
              <input
                type="text"
                className="form-input mono-input"
                value={holderWallet}
                onChange={(e) => setHolderWallet(e.target.value)}
                placeholder="0x..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Credential Name / Course</label>
              <input
                type="text"
                className="form-input"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Master of Science in AI"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Upload Document (PDF/Image)</label>
              <div className="file-upload-wrapper">
                <input
                  id="create-file-input"
                  type="file"
                  className="hidden-file-input"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.png"
                  required
                />
                <label htmlFor="create-file-input" className="file-upload-label">
                  <div className="upload-icon">{selectedFile ? '📄' : '📤'}</div>
                  <div className="upload-text">
                    {selectedFile ? selectedFile.name : 'Click to select credential file'}
                  </div>
                </label>
              </div>
            </div>

            <button className="btn btn-primary submit-btn" disabled={loading}>
              {loading ? 'Minting on Blockchain...' : '🚀 Issue Credential'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRevoke} className="issue-form">
            <div className="form-group">
              <label className="form-label">Credential Hash/ID</label>
              <input
                type="text"
                className="form-input mono-input"
                value={revokeId}
                onChange={(e) => setRevokeId(e.target.value)}
                placeholder="Enter unique credential ID"
                required
              />
              <div className="warning-note">
                ⚠️ <strong>Caution:</strong> This action is written to the blockchain and cannot be undone.
              </div>
            </div>

            <button className="btn btn-danger submit-btn" disabled={loading}>
              {loading ? 'Revoking...' : '🗑️ Confirm Revocation'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default IssuerDashboard;
