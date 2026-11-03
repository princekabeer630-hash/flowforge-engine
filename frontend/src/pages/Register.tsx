import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Registration successful! Please log in.');
        navigate('/login');
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during registration.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '30px',
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        <h2 style={{ marginBottom: '24px', color: '#333', fontSize: '24px', fontWeight: '600' }}>
          Register for FlowForge
        </h2>
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', color: '#555', fontWeight: '500' }}>Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                padding: '12px',
                fontSize: '15px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', color: '#555', fontWeight: '500' }}>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: '12px',
                fontSize: '15px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', color: '#555', fontWeight: '500' }}>Password</label>
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: '12px',
                fontSize: '15px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              marginTop: '8px',
              padding: '12px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: '#28a745',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Register
          </button>
        </form>
        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
          Already have an account? <Link to="/login" style={{ color: '#007bff', textDecoration: 'none', fontWeight: '500' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
}