import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import MonitorForm from './MonitorForm';

/**
 * Displays a single monitor's summary card.
 * Shows status badge, response time, uptime %, and action buttons.
 */
export default function MonitorCard({ monitor, onDeleted, onUpdated }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const statusClass = {
    UP: 'badge-up',
    DOWN: 'badge-down',
    PENDING: 'badge-pending',
  }[monitor.status] || 'badge-pending';

  async function handleDelete() {
    if (!confirm(`Delete monitor "${monitor.name}"?`)) return;
    await api.delete(`/monitors/${monitor._id}`);
    onDeleted(monitor._id);
  }

  async function handleCheck() {
    setChecking(true);
    try {
      const { data } = await api.post(`/monitors/${monitor._id}/check`);
      onUpdated(data);
    } finally {
      setChecking(false);
    }
  }

  async function handleSave(formData) {
    setSaveLoading(true);
    try {
      const { data } = await api.put(`/monitors/${monitor._id}`, formData);
      onUpdated(data);
      setEditing(false);
    } finally {
      setSaveLoading(false);
    }
  }

  if (editing) {
    return (
      <div className="card">
        <h4 style={{ marginBottom: 14 }}>Edit Monitor</h4>
        <MonitorForm
          initialData={monitor}
          onSubmit={handleSave}
          onCancel={() => setEditing(false)}
          loading={saveLoading}
        />
      </div>
    );
  }

  return (
    <div className="card" style={styles.card}>
      <div style={styles.top}>
        <div>
          <span className={`badge ${statusClass}`}>{monitor.status}</span>
          <h3 style={styles.name}>{monitor.name}</h3>
          <a href={monitor.url} target="_blank" rel="noreferrer" style={styles.url}>
            {monitor.url}
          </a>
        </div>
        <div style={styles.stats}>
          <Stat label="Response" value={monitor.lastResponseTime ? `${monitor.lastResponseTime}ms` : '—'} />
          <Stat label="Uptime" value={monitor.uptimePercentage != null ? `${monitor.uptimePercentage}%` : '—'} />
          <Stat label="Interval" value={`${monitor.interval}m`} />
        </div>
      </div>

      <div style={styles.actions}>
        <button className="btn-ghost" onClick={() => navigate(`/monitor/${monitor._id}`)}>History</button>
        <button className="btn-ghost" onClick={handleCheck} disabled={checking}>
          {checking ? 'Checking...' : 'Check Now'}
        </button>
        <button className="btn-ghost" onClick={() => setEditing(true)}>Edit</button>
        <button className="btn-danger" onClick={handleDelete}>Delete</button>
      </div>

      {monitor.lastCheckedAt && (
        <p style={styles.lastChecked}>
          Last checked: {new Date(monitor.lastCheckedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

const styles = {
  card: { display: 'flex', flexDirection: 'column', gap: 14 },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
  name: { fontSize: 16, fontWeight: 600, marginTop: 6 },
  url: { fontSize: 13, color: '#6b7280' },
  stats: { display: 'flex', gap: 24 },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  lastChecked: { fontSize: 12, color: '#9ca3af' },
};
