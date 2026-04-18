import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MonitorCard from '../components/MonitorCard';
import MonitorForm from '../components/MonitorForm';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchMonitors();
    // Auto-refresh every 30 seconds to show updated statuses
    const interval = setInterval(fetchMonitors, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMonitors() {
    try {
      const { data } = await api.get('/monitors');
      setMonitors(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(formData) {
    setCreateLoading(true);
    try {
      const { data } = await api.post('/monitors', formData);
      setMonitors(prev => [data, ...prev]);
      setShowForm(false);
    } finally {
      setCreateLoading(false);
    }
  }

  function handleDeleted(id) {
    setMonitors(prev => prev.filter(m => m._id !== id));
  }

  function handleUpdated(updated) {
    setMonitors(prev => prev.map(m => m._id === updated._id ? updated : m));
  }

  // Summary stats
  const upCount = monitors.filter(m => m.status === 'UP').length;
  const downCount = monitors.filter(m => m.status === 'DOWN').length;

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <span style={styles.brand}>URL Monitor</span>
        <div style={styles.navRight}>
          <span style={styles.greeting}>Hi, {user?.name}</span>
          <button className="btn-ghost" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div style={styles.content}>
        {/* Summary bar */}
        <div style={styles.summaryBar}>
          <SummaryCard label="Total" value={monitors.length} color="#4f46e5" />
          <SummaryCard label="Up" value={upCount} color="#16a34a" />
          <SummaryCard label="Down" value={downCount} color="#dc2626" />
        </div>

        {/* Header + Add button */}
        <div style={styles.header}>
          <h2 style={styles.heading}>Monitors</h2>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Monitor'}
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 14 }}>New Monitor</h4>
            <MonitorForm onSubmit={handleCreate} loading={createLoading} />
          </div>
        )}

        {/* Monitor list */}
        {loading ? (
          <p style={styles.empty}>Loading monitors...</p>
        ) : monitors.length === 0 ? (
          <div className="card" style={styles.emptyCard}>
            <p>No monitors yet. Add your first URL to start monitoring.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {monitors.map(m => (
              <MonitorCard
                key={m._id}
                monitor={m}
                onDeleted={handleDeleted}
                onUpdated={handleUpdated}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6b7280' }}>{label}</div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f0f2f5' },
  nav: {
    background: '#fff', padding: '14px 24px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  brand: { fontWeight: 700, fontSize: 18, color: '#4f46e5' },
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  greeting: { fontSize: 14, color: '#6b7280' },
  content: { maxWidth: 900, margin: '0 auto', padding: '24px 16px' },
  summaryBar: { display: 'flex', gap: 16, marginBottom: 24 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heading: { fontSize: 20, fontWeight: 600 },
  grid: { display: 'flex', flexDirection: 'column', gap: 16 },
  empty: { textAlign: 'center', color: '#9ca3af', padding: 40 },
  emptyCard: { textAlign: 'center', color: '#6b7280', padding: 40 },
};
