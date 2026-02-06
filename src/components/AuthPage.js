import React, { useState } from 'react';
import './AuthPage.css';
import { registerUser, loginUser, adminLogin } from '../utils/api';
import { decryptData } from '../utils/crypto';

const AuthPage = ({ onAuthSuccess }) => {
  const [role, setRole] = useState('');
  const [isLogin, setIsLogin] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    setRole(selectedRole);
    setIsLogin(selectedRole === 'admin'); // admin = login only
    setMessage({ type: '', text: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (role === 'admin') {
        await adminLogin(formData.username, formData.password);
        onAuthSuccess({ username: formData.username }, 'admin');
        return;
      }

      if (role === 'verifier') {
        onAuthSuccess({ verifier: true }, 'verifier');
        return;
      }

      const result = await loginUser(formData.username, formData.password, role);
      const decryptedData = decryptData(
        result.encryptedFile,
        formData.username,
        formData.password
      );

      onAuthSuccess(
        {
          ...decryptedData,
          name: result.name,
          username: formData.username
        },
        role
      );
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await registerUser(
        formData.name,
        formData.username,
        formData.password,
        role
      );

      setMessage({ type: 'success', text: result.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container fade-in">
      <div className="auth-card card">

        <h1 className="auth-title">IITGnCred</h1>

        {/* ROLE DROPDOWN */}
        <div className="form-group">
          <label className="form-label">Select Role</label>
          <select
            className="form-input"
            value={role}
            onChange={handleRoleChange}
            required
          >
            <option value="">-- Choose role --</option>
            <option value="admin">Admin</option>
            <option value="issuer">Issuer</option>
            <option value="holder">Holder</option>
            <option value="verifier">Verifier</option>
          </select>
        </div>

        {message.text && (
          <div className={`message message-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* FORM ONLY WHEN ROLE SELECTED */}
        {role && role !== 'verifier' && (
          <form onSubmit={isLogin ? handleLogin : handleRegister}>

            {!isLogin && role !== 'admin' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                className="form-input"
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-input"
                onChange={handleChange}
                required
              />
            </div>

            <button className="btn btn-primary" disabled={loading}>
              {isLogin ? 'Login' : 'Register'}
            </button>
          </form>
        )}

        {/* VERIFIER QUICK ACCESS */}
        {role === 'verifier' && (
          <button className="btn btn-primary" onClick={handleLogin}>
            Continue as Verifier
          </button>
        )}

        {/* TOGGLE */}
        {role && role !== 'admin' && role !== 'verifier' && (
          <div className="auth-toggle">
            <span>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Register' : 'Login'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AuthPage;
