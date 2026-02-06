import React, { useState, useEffect } from 'react';
import './App.css';

import AuthPage from './components/AuthPage';
import AdminDashboard from './components/AdminDashboard';
import IssuerDashboard from './components/IssuerDashboard';
import HolderDashboard from './components/HolderDashboard';
import VerifierPage from './components/VerifierPage';

function App() {
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

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
      <button className="theme-toggle" onClick={toggleTheme}>
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
    </div>
  );
}

export default App;
