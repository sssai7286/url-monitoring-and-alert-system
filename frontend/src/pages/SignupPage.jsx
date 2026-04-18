import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', form);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Signup failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div className="card" style={styles.box}>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.sub}>Start monitoring your URLs</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            placeholder="Full name" required
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="email" placeholder="Email" required
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password" placeholder="Password (min 6 chars)" required
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
          />
          {error && <p className="error-msg">{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p style={styles.link}>
          Have an account? <Link to="/login" style={{ color: '#4f46e5' }}>Sign in</Link>
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
