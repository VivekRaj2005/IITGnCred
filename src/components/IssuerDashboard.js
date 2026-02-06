import React, { useState } from 'react';
import './IssuerDashboard.css';
import { issueCredential } from '../utils/api';

const IssuerDashboard = ({ user, onLogout }) => {
  const [holderUsername, setHolderUsername] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile({
          name: file.name,
          type: file.type,
          data: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    
    if (!holderUsername || !selectedFile) {
      setMessage({ type: 'error', text: 'Please provide holder username and select a file' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await issueCredential(holderUsername, selectedFile);
      setMessage({ type: 'success', text: result.message });
      
      setHolderUsername('');
      setSelectedFile(null);
      document.getElementById('file-input').value = '';
      
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="issuer-dashboard-container fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">🎫 Issuer Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back, {user.name}</p>
        </div>
        <button className="btn btn-secondary" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="issuer-main-card card">
        <div className="card-header">
          <h2 className="card-title">Issue New Credential</h2>
          <p className="card-description">
            Upload a credential file and assign it to a holder
          </p>
        </div>

        {message.text && (
          <div className={`message message-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleIssue} className="issue-form">
          <div className="form-group">
            <label className="form-label">Holder Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter holder's username"
              value={holderUsername}
              onChange={(e) => setHolderUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Credential File</label>
            <div className="file-upload-container">
              <input
                id="file-input"
                type="file"
                className="file-input"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                required
              />
              <label htmlFor="file-input" className="file-upload-label">
                <div className="file-upload-icon">📎</div>
                <div className="file-upload-text">
                  {selectedFile ? (
                    <>
                      <span className="file-name">{selectedFile.name}</span>
                      <span className="file-change">Click to change</span>
                    </>
                  ) : (
                    <>
                      <span className="file-prompt">Click to upload file</span>
                      <span className="file-formats">PDF, DOC, DOCX, JPG, PNG</span>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                Issuing Credential
                <span className="loading"></span>
              </>
            ) : (
              '🚀 Issue Credential'
            )}
          </button>
        </form>

        <div className="info-box">
          <div className="info-icon">ℹ️</div>
          <div className="info-content">
            <h4>Important Notes:</h4>
            <ul>
              <li>Ensure the holder is registered in the system</li>
              <li>Upload only legitimate and verified credentials</li>
              <li>Supported formats: PDF, DOC, DOCX, JPG, PNG</li>
              <li>Credentials are permanently stored and cannot be edited</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3 className="stat-value">Active</h3>
            <p className="stat-label">Account Status</p>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon">🔐</div>
          <div className="stat-content">
            <h3 className="stat-value">{user.did?.substring(0, 20)}...</h3>
            <p className="stat-label">Your DID</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssuerDashboard;