import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div className="card" style={styles.box}>
        <h2 style={styles.title}>URL Monitor</h2>
        <p style={styles.sub}>Sign in to your account</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email" placeholder="Email" required
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password" placeholder="Password" required
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
          />
          {error && <p className="error-msg">{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={styles.link}>
          No account? <Link to="/signup" style={{ color: '#4f46e5' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
  box: { width: '100%', maxWidth: 380 },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  sub: { color: '#6b7280', fontSize: 14, marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  link: { marginTop: 16, textAlign: 'center', fontSize: 14, color: '#6b7280' },
};
