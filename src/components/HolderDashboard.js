import React, { useState, useEffect } from 'react';
import './HolderDashboard.css';
import { getHolderCredentials } from '../utils/api';

const HolderDashboard = ({ user, onLogout }) => {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState(null);

  useEffect(() => {
    if (user && user.wallet) {
      loadCredentials();
    }
  }, [user]);

  const loadCredentials = async () => {
    setLoading(true);
    try {
      // UPDATED: Use wallet address instead of username
      const creds = await getHolderCredentials(user.wallet);
      console.log("Fetched credentials for wallet:", user.wallet);
      console.log("Credentials data:", creds);
      setCredentials(creds || []);
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
    // UPDATED: Check for 'file' property (common in IPFS/Blockchain responses)
    const fileUrl = "http://localhost:8080/ipfs/" + credential.cid;
    
    if (!fileUrl) {
      alert("File data not available");
      return;
    }

    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = credential.fileName || `credential-${credential.id}.pdf`;
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
          <h1 className="dashboard-title">Holder Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, {user.name} 
            <span className="mono-badge">{user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}</span>
          </p>
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
            <div className="loading-spinner"></div>
            <p>Loading credentials...</p>
          </div>
        ) : credentials.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📭</div>
            <h3>No Credentials Yet</h3>
            <p>You haven't received any credentials. They will appear here once issued by your university.</p>
          </div>
        ) : (
          <div className="credentials-grid">
            {credentials.map((credential, index) => (
              <div 
                key={credential.id || index} 
                className="credential-card card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="credential-header">
                  <div className="credential-icon">
                    {/* Check file type safely */}
                    {(credential.fileType || '').includes('pdf') ? '📄' : '🎓'}
                  </div>
                  <div className="credential-badge">Verified</div>
                </div>
                
                <div className="credential-body">
                  <h3 className="credential-name">{credential.courseName || credential.fileName || "Credential"}</h3>
                  
                  <div className="credential-meta">
                    <div className="meta-item">
                      <span className="meta-label">Issuer:</span>
                      <span className="meta-value">{credential.issuerName || credential.issuer}</span>
                    </div>
                    
                    <div className="meta-item">
                      <span className="meta-label">Issued:</span>
                      <span className="meta-value">
                        {credential.timestamp 
                          ? new Date(credential.timestamp).toLocaleDateString() 
                          : new Date().toLocaleDateString()}
                      </span>
                    </div>

                    <div className="meta-item">
                      <span className="meta-label">ID:</span>
                      <span className="meta-value credential-id" title={credential.id}>
                        {credential.id ? credential.id.toString().slice(0, 8) + '...' : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="credential-actions">
                  <button 
                    className="btn btn-secondary action-btn"
                    onClick={() => handleView(credential)}
                  >
                    View
                  </button>
                  <button 
                    className="btn btn-primary action-btn"
                    onClick={() => handleDownload(credential)}
                  >
                    Download
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
              <h2 className="modal-title">
                {selectedCredential.courseName || selectedCredential.fileName}
              </h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            
            <div className="modal-body">
              {/* Flexible viewer for PDF or Image */}
              {(selectedCredential.fileType || '').includes('image') ? (
                <img 
                  src={selectedCredential.file || selectedCredential.fileData} 
                  alt="Credential"
                  className="image-viewer"
                />
              ) : (
                <iframe 
                  src={selectedCredential.file || selectedCredential.fileData} 
                  className="pdf-viewer"
                  title="Credential Preview"
                />
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-primary"
                onClick={() => handleDownload(selectedCredential)}
              >
                Download Original
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
