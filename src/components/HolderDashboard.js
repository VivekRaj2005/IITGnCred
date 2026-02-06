import React, { useState, useEffect } from 'react';
import './HolderDashboard.css';
import { getHolderCredentials } from '../utils/api';

const HolderDashboard = ({ user, onLogout }) => {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState(null);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    setLoading(true);
    try {
      const creds = await getHolderCredentials(user.username);
      setCredentials(creds);
    } catch (error) {
      console.error('Failed to load credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (credential) => {
    setSelectedCredential(credential);
  };

  const handleDownload = (credential) => {
    const link = document.createElement('a');
    link.href = credential.fileData;
    link.download = credential.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closeModal = () => {
    setSelectedCredential(null);
  };

  return (
    <div className="holder-dashboard-container fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">🎒 Holder Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back, {user.name}</p>
        </div>
        <button className="btn btn-secondary" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="credentials-section">
        <div className="section-header">
          <h2 className="section-title">Your Credentials</h2>
          <div className="credential-count">
            <span className="count-number">{credentials.length}</span>
            <span className="count-label">Total</span>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <span className="loading"></span>
            <p>Loading credentials...</p>
          </div>
        ) : credentials.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📭</div>
            <h3>No Credentials Yet</h3>
            <p>You haven't received any credentials. They will appear here once issued.</p>
          </div>
        ) : (
          <div className="credentials-grid">
            {credentials.map((credential, index) => (
              <div 
                key={credential.id} 
                className="credential-card card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="credential-header">
                  <div className="credential-icon">
                    {credential.fileType.includes('pdf') ? '📄' : '🖼️'}
                  </div>
                  <div className="credential-badge">Verified</div>
                </div>
                
                <div className="credential-body">
                  <h3 className="credential-name">{credential.fileName}</h3>
                  <div className="credential-meta">
                    <div className="meta-item">
                      <span className="meta-label">Issuer:</span>
                      <span className="meta-value">{credential.issuer}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Issued:</span>
                      <span className="meta-value">
                        {new Date(credential.issuedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">ID:</span>
                      <span className="meta-value credential-id">{credential.id}</span>
                    </div>
                  </div>
                </div>
                
                <div className="credential-actions">
                  <button 
                    className="btn btn-secondary action-btn"
                    onClick={() => handleView(credential)}
                  >
                    👁️ View
                  </button>
                  <button 
                    className="btn btn-primary action-btn"
                    onClick={() => handleDownload(credential)}
                  >
                    ⬇️ Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCredential && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedCredential.fileName}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              {selectedCredential.fileType.includes('pdf') ? (
                <iframe 
                  src={selectedCredential.fileData} 
                  className="pdf-viewer"
                  title="Credential Preview"
                />
              ) : (
                <img 
                  src={selectedCredential.fileData} 
                  alt={selectedCredential.fileName}
                  className="image-viewer"
                />
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-primary"
                onClick={() => handleDownload(selectedCredential)}
              >
                ⬇️ Download
              </button>
              <button 
                className="btn btn-secondary"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolderDashboard;