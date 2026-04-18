import React, { useState } from 'react';

const INTERVALS = [
  { label: 'Every 1 minute', value: 1 },
  { label: 'Every 5 minutes', value: 5 },
  { label: 'Every 10 minutes', value: 10 },
  { label: 'Every 30 minutes', value: 30 },
  { label: 'Every 60 minutes', value: 60 },
];

/**
 * Reusable form for creating or editing a monitor.
 * Props: initialData, onSubmit(data), onCancel, loading
 */
export default function MonitorForm({ initialData = {}, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: initialData.name || '',
    url: initialData.url || '',
    interval: initialData.interval || 5,
  });
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Name is required');
    if (!form.url.startsWith('http')) return setError('URL must start with http:// or https://');
    onSubmit({ ...form, interval: parseInt(form.interval) });
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.field}>
        <label style={styles.label}>Monitor Name</label>
        <input name="name" placeholder="e.g. My Website" value={form.name} onChange={handleChange} required />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>URL</label>
        <input name="url" placeholder="https://example.com" value={form.url} onChange={handleChange} required />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Check Interval</label>
        <select name="interval" value={form.interval} onChange={handleChange}>
          {INTERVALS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
        </select>
      </div>
      {error && <p className="error-msg">{error}</p>}
      <div style={styles.actions}>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Monitor'}
        </button>
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}

const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 13, fontWeight: 500, color: '#374151' },
  actions: { display: 'flex', gap: 10, marginTop: 4 },
};
