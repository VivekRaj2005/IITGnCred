import React, { useState, useEffect } from 'react';
import './App.css';

// Component Imports
import AuthPage from './components/AuthPage';
import AdminDashboard from './components/AdminDashboard';
import IssuerDashboard from './components/IssuerDashboard';
import HolderDashboard from './components/HolderDashboard';
import VerifierPage from './components/VerifierPage';
import ChatAssistant from './components/ChatAssistant';

function App() {
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin', 'issuer', 'holder', 'verifier'
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Theme Management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Authentication Handlers
  const handleAuthSuccess = (userData, selectedRole) => {
    console.log("Login Success:", selectedRole, userData);
    setUser(userData);
    setRole(selectedRole);
  };

  const handleLogout = () => {
    setUser(null);
    setRole(null);
    setIsChatOpen(false); // Close chat on logout
  };

  return (
    <div className="App">
      {/* Theme Toggle Button */}
      <button 
        className="theme-toggle" 
        onClick={toggleTheme} 
        style={styles.themeBtn}
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* --- ROUTING LOGIC --- */}

      {/* 1. Auth Page (Login) - Shown when no user is logged in */}
      {!user && (
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      )}

      {/* 2. Admin Dashboard */}
      {user && role === 'admin' && (
        <AdminDashboard user={user} onLogout={handleLogout} />
      )}

      {/* 3. Issuer Dashboard */}
      {user && role === 'issuer' && (
        <IssuerDashboard user={user} onLogout={handleLogout} />
      )}

      {/* 4. Holder Dashboard */}
      {user && role === 'holder' && (
        <HolderDashboard user={user} onLogout={handleLogout} />
      )}

      {/* 5. Verifier Page */}
      {user && role === 'verifier' && (
        <VerifierPage onBack={handleLogout} />
      )}

      {/* --- FLOATING CHAT ASSISTANT --- */}
      {user && (
        <>
          {isChatOpen && (
            <div style={styles.chatWrapper} className="fade-in-up">
              {/* Passing user context to chat if needed for personalization */}
              <ChatAssistant user={user} role={role} />
            </div>
          )}

          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            style={styles.fab}
            title={isChatOpen ? "Close Assistant" : "Open Assistant"}
            className="fab-btn"
          >
            {isChatOpen ? '❌' : '💬'}
          </button>
        </>
      )}
    </div>
  );
}

// Inline styles for floating elements
const styles = {
  themeBtn: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 1000,
    background: 'var(--card-bg)', // Uses CSS variable if available
    border: '1px solid var(--border-color)',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
  },
  chatWrapper: {
    position: 'fixed',
    bottom: '90px',
    right: '20px',
    zIndex: 9999,
    width: '350px',
    maxHeight: '600px',
  },
  fab: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    fontSize: '24px',
    cursor: 'pointer',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s, background-color 0.2s',
  }
};

export default App;
