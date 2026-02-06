import React, { useState, useEffect } from 'react';
import './App.css';

import AuthPage from './components/AuthPage';
import AdminDashboard from './components/AdminDashboard';
import IssuerDashboard from './components/IssuerDashboard';
import HolderDashboard from './components/HolderDashboard';
import VerifierPage from './components/VerifierPage';
import ChatAssistant from './components/ChatAssistant';

function App() {
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  
  const [isChatOpen, setIsChatOpen] = useState(false);

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

  const handleAuthSuccess = (userData, selectedRole) => {
    setUser(userData);
    setRole(selectedRole);
  };

  const handleLogout = () => {
    setUser(null);
    setRole(null);
  };

  return (
    <div className="App">
      <button className="theme-toggle" onClick={toggleTheme} style={styles.themeBtn}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* NOT LOGGED IN */}
      {!user && (
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      )}

      {/* VERIFIER */}
      {user && role === 'verifier' && (
        <VerifierPage onBack={handleLogout} />
      )}

      {/* DASHBOARDS */}
      {user && role === 'admin' && (
        <AdminDashboard user={user} onLogout={handleLogout} />
      )}

      {user && role === 'issuer' && (
        <IssuerDashboard user={user} onLogout={handleLogout} />
      )}

      {user && role === 'holder' && (
        <HolderDashboard user={user} onLogout={handleLogout} />
      )}

      {isChatOpen && (
        <div style={styles.chatWrapper}>
           <ChatAssistant />
        </div>
      )}

      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={styles.fab}
        title={isChatOpen ? "Close Chat" : "Open Help"}
      >
        {isChatOpen ? 'X' : '💬'}
      </button>

    </div>
  );
}

const styles = {
  themeBtn: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 1000,
    background: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer'
  },
  chatWrapper: {
    position: 'fixed',
    bottom: '80px',
    right: '20px',
    zIndex: 9999,
  },
  fab: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    fontSize: '24px',
    cursor: 'pointer',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s',
  }
};

export default App;
