import React, { useState, useRef, useEffect } from 'react';
import './VerifierPage.css';
import { verifyCredential } from '../utils/api';

const VerifierPage = () => {
  const [mode, setMode] = useState('single'); // 'single' | 'batch'
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verificationResults, setVerificationResults] = useState([]);
  const fileInputRef = useRef(null);

  // Supported extensions for filtering folder contents
  const SUPPORTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

  // Clear state when switching modes
  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
      // Filter files based on extensions (crucial for Folder upload)
      const validFiles = files.filter(file => 
        SUPPORTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))
      );

      if (validFiles.length === 0 && files.length > 0) {
        alert("No supported credential files found in this selection.");
        return;
      }

      // If in single mode, ensure we only take the first valid file
      const filesToProcess = mode === 'single' ? [validFiles[0]] : validFiles;

      const filePromises = filesToProcess.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              data: reader.result // Base64
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(filePromises).then(processedFiles => {
        setSelectedFiles(processedFiles);
        setVerificationResults([]); 
      });
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setLoading(true);
    setVerificationResults([]);

    try {
      const results = await Promise.all(selectedFiles.map(async (file) => {
        try {
          // Simulate staggered API calls for visual effect
          await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
          
          const result = await verifyCredential(file.data);
          
          return { fileName: file.name, ...result };
        } catch (error) {
          return {
            fileName: file.name,
            isValid: false,
            message: 'Verification failed',
            details: { status: 'ERROR', error: error.message }
          };
        }
      }));

      setVerificationResults(results);
    } catch (error) {
      console.error("Batch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFiles([]);
    setVerificationResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper: Apply 'webkitdirectory' attribute manually for React compatibility
  useEffect(() => {
    if (fileInputRef.current) {
      if (mode === 'batch') {
        fileInputRef.current.setAttribute('webkitdirectory', 'true');
        fileInputRef.current.setAttribute('directory', 'true');
        fileInputRef.current.setAttribute('multiple', 'true');
      } else {
        fileInputRef.current.removeAttribute('webkitdirectory');
        fileInputRef.current.removeAttribute('directory');
        fileInputRef.current.removeAttribute('multiple');
      }
    }
  }, [mode]);

  // --- Render Helpers ---

  const renderSingleResult = (result) => (
    <div className={`verification-result ${result.isValid ? 'valid' : 'invalid'}`}>
      <div className="result-icon">{result.isValid ? '✓' : '✕'}</div>
      <div className="result-content">
        <h2 className="result-title">{result.isValid ? 'Valid Credential' : 'Invalid Credential'}</h2>
        <p className="result-message">{result.message}</p>
        <div className="result-details">
          <div className="detail-row">
            <span className="detail-label">File Name:</span>
            <span className="detail-value">{result.fileName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Issuer:</span>
            <span className="detail-value">{result.details?.issuer || "Unknown"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`status-badge ${result.isValid ? 'verified' : 'rejected'}`}>
              {result.isValid ? 'VERIFIED' : 'REJECTED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBatchResults = () => (
    <div className="batch-results-container">
      <h3>Folder Verification Results</h3>
      <div className="batch-summary">
        <span>Files Scanned: {verificationResults.length}</span>
        <span className="text-success">Valid: {verificationResults.filter(r => r.isValid).length}</span>
        <span className="text-danger">Invalid: {verificationResults.filter(r => !r.isValid).length}</span>
      </div>
      
      <div className="table-responsive">
        <table className="batch-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>File Name</th>
              <th>Issuer</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {verificationResults.map((result, index) => (
              <tr key={index} className={result.isValid ? 'row-valid' : 'row-invalid'}>
                <td className="text-center">
                  <span className={`status-icon ${result.isValid ? 'icon-valid' : 'icon-invalid'}`}>
                    {result.isValid ? '✓' : '✕'}
                  </span>
                </td>
                <td className="font-medium">{result.fileName}</td>
                <td>{result.details?.issuer || "-"}</td>
                <td className="text-small">{result.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={resetForm} className="btn btn-secondary mt-3">Scan New Folder</button>
    </div>
  );

  return (
    <div className="verifier-page-container fade-in">
      <div className="verifier-header">
        <h1 className="verifier-title">Certificate Verification</h1>
        <p className="verifier-subtitle">
          Verify digital credentials instantly.
        </p>
      </div>

      <div className="verifier-main-card card">
        
        {/* Mode Toggle Switch */}
        <div className="mode-toggle-container">
          <button 
            className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('single')}
          >
            Single Document
          </button>
          <button 
            className={`mode-btn ${mode === 'batch' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('batch')}
          >
            Batch Folder
          </button>
        </div>

        {verificationResults.length === 0 && (
          <form onSubmit={handleVerify} className="verify-form">
            <div className="form-group">
              <div className="file-upload-container">
                <input
                  ref={fileInputRef}
                  id="verify-file-input"
                  type="file"
                  className="file-input"
                  onChange={handleFileChange}
                  accept={mode === 'single' ? ".pdf,.doc,.docx,.jpg,.jpeg,.png" : undefined}
                />
                <label htmlFor="verify-file-input" className="file-upload-label">
                  <div className="file-upload-icon">
                    {selectedFiles.length > 0 ? (mode === 'batch' ? '📚' : '📄') : (mode === 'batch' ? '📂' : '📎')}
                  </div>
                  <div className="file-upload-text">
                    {selectedFiles.length > 0 ? (
                      <>
                        <span className="file-name">
                          {mode === 'single' 
                            ? selectedFiles[0].name 
                            : `${selectedFiles.length} valid files found in folder`}
                        </span>
                        <span className="file-change">Click to change</span>
                      </>
                    ) : (
                      <>
                        <span className="file-prompt">
                          {mode === 'batch' ? "Click to select a Folder" : "Click to upload Document"}
                        </span>
                        <span className="file-formats">
                          {mode === 'batch' ? "Scans folder for PDF, JPG, PNG" : "Supports PDF, JPG, PNG"}
                        </span>
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
                disabled={loading || selectedFiles.length === 0}
              >
                {loading 
                  ? 'Verifying...' 
                  : `Verify ${mode === 'batch' ? 'Files' : 'Certificate'}`
                }
              </button>
            </div>
          </form>
        )}

        {/* Results */}
        {verificationResults.length > 0 && (
          <div className="results-wrapper">
            {mode === 'single' 
              ? <>
                  {renderSingleResult(verificationResults[0])}
                  <div className="text-center mt-3">
                    <button onClick={resetForm} className="btn btn-outline">Verify Another</button>
                  </div>
                </>
              : renderBatchResults()
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifierPage;
