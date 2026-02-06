import React, { useState } from 'react';
import './VerifierPage.css';
import { verifyCredential } from '../utils/api';

const VerifierPage = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

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
      setVerificationResult(null);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      return;
    }

    setLoading(true);
    setVerificationResult(null);

    try {
      const result = await verifyCredential(selectedFile);
      setVerificationResult(result);
    } catch (error) {
      setVerificationResult({
        success: false,
        isValid: false,
        message: 'Verification failed',
        details: { status: 'ERROR' }
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setVerificationResult(null);
    document.getElementById('verify-file-input').value = '';
  };

  return (
    <div className="verifier-page-container fade-in">
      <div className="verifier-header">
        <div className="verifier-icon-large">✓</div>
        <h1 className="verifier-title">Credential Verifier</h1>
        <p className="verifier-subtitle">
          Upload a credential file to verify its authenticity
        </p>
      </div>

      <div className="verifier-main-card card">
        <form onSubmit={handleVerify} className="verify-form">
          <div className="form-group">
            <label className="form-label">Select Credential File</label>
            <div className="file-upload-container">
              <input
                id="verify-file-input"
                type="file"
                className="file-input"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                required
              />
              <label htmlFor="verify-file-input" className="file-upload-label">
                <div className="file-upload-icon">📎</div>
                <div className="file-upload-text">
                  {selectedFile ? (
                    <>
                      <span className="file-name">{selectedFile.name}</span>
                      <span className="file-change">Click to change</span>
                    </>
                  ) : (
                    <>
                      <span className="file-prompt">Click to upload credential</span>
                      <span className="file-formats">PDF, DOC, DOCX, JPG, PNG</span>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="verify-actions">
            <button 
              type="submit" 
              className="btn btn-primary verify-btn"
              disabled={loading || !selectedFile}
            >
              {loading ? (
                <>
                  Verifying
                  <span className="loading"></span>
                </>
              ) : (
                '🔍 Verify Credential'
              )}
            </button>
            {selectedFile && !loading && (
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Reset
              </button>
            )}
          </div>
        </form>

        {verificationResult && (
          <div className={`verification-result ${verificationResult.isValid ? 'valid' : 'invalid'}`}>
            <div className="result-icon">
              {verificationResult.isValid ? '✓' : '✕'}
            </div>
            <div className="result-content">
              <h2 className="result-title">
                {verificationResult.isValid ? 'Credential Verified' : 'Verification Failed'}
              </h2>
              <p className="result-message">{verificationResult.message}</p>
              
              <div className="result-details">
                <div className="detail-row">
                  <span className="detail-label">File Name:</span>
                  <span className="detail-value">{verificationResult.details.fileName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Verification Time:</span>
                  <span className="detail-value">
                    {new Date(verificationResult.details.verifiedAt).toLocaleString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Issuer:</span>
                  <span className="detail-value">{verificationResult.details.issuer}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`status-badge ${verificationResult.isValid ? 'verified' : 'invalid'}`}>
                    {verificationResult.details.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="verifier-info card">
        <h3 className="info-title">How Verification Works</h3>
        <div className="info-steps">
          <div className="info-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Upload Credential</h4>
              <p>Select the credential file you want to verify</p>
            </div>
          </div>
          <div className="info-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Digital Signature Check</h4>
              <p>System validates the cryptographic signature</p>
            </div>
          </div>
          <div className="info-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Issuer Verification</h4>
              <p>Confirms the credential was issued by a trusted authority</p>
            </div>
          </div>
          <div className="info-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Get Results</h4>
              <p>Receive instant verification status and details</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifierPage;