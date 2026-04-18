import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../services/api';

/**
 * Shows detailed history for a single monitor.
 * Includes a response time graph (recharts) and a table of recent checks.
 */
export default function MonitorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [monitor, setMonitor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [monRes, histRes] = await Promise.all([
          api.get('/monitors'),
          api.get(`/history/${id}?limit=50`),
        ]);
        const found = monRes.data.find(m => m._id === id);
        setMonitor(found);
        setData(histRes.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div style={styles.center}>Loading...</div>;
  if (!monitor) return <div style={styles.center}>Monitor not found.</div>;

  // Prepare chart data — reverse so oldest is on the left
  const chartData = [...(data?.history || [])]
    .reverse()
    .map(h => ({
      time: new Date(h.checkedAt).toLocaleTimeString(),
      responseTime: h.responseTime || 0,
      status: h.status,
    }));

  const statusClass = { UP: 'badge-up', DOWN: 'badge-down', PENDING: 'badge-pending' }[monitor.status];

  return (
    <div style={styles.page}>
      <div style={styles.content}>
        {/* Back button */}
        <button className="btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: 20 }}>
          ← Back to Dashboard
        </button>

        {/* Monitor header */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={styles.monitorHeader}>
            <div>
              <span className={`badge ${statusClass}`}>{monitor.status}</span>
              <h2 style={styles.name}>{monitor.name}</h2>
              <a href={monitor.url} target="_blank" rel="noreferrer" style={styles.url}>{monitor.url}</a>
            </div>
            <div style={styles.statsRow}>
              <Stat label="Uptime (last 100)" value={data?.uptimePercentage != null ? `${data.uptimePercentage}%` : '—'} />
              <Stat label="Last Response" value={monitor.lastResponseTime ? `${monitor.lastResponseTime}ms` : '—'} />
              <Stat label="Interval" value={`${monitor.interval} min`} />
              <Stat label="Total Checks" value={monitor.totalChecks} />
            </div>
          </div>
        </div>

        {/* Response time chart */}
        {chartData.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={styles.sectionTitle}>Response Time (ms)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} unit="ms" />
                <Tooltip formatter={(v) => [`${v}ms`, 'Response Time']} />
                <Line
                  type="monotone" dataKey="responseTime"
                  stroke="#4f46e5" strokeWidth={2} dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* History table */}
        <div className="card">
          <h3 style={styles.sectionTitle}>Recent Checks</h3>
          {data?.history?.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>No history yet.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Response Time</th>
                  <th>HTTP Code</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {data?.history?.map(h => (
                  <tr key={h._id} style={styles.row}>
                    <td>{new Date(h.checkedAt).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${h.status === 'UP' ? 'badge-up' : 'badge-down'}`}>
                        {h.status}
                      </span>
                    </td>
                    <td>{h.responseTime ? `${h.responseTime}ms` : '—'}</td>
                    <td>{h.statusCode || '—'}</td>
                    <td style={{ color: '#dc2626', fontSize: 12 }}>{h.error || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f0f2f5' },
  content: { maxWidth: 900, margin: '0 auto', padding: '24px 16px' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' },
  monitorHeader: { display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 },
  name: { fontSize: 20, fontWeight: 700, marginTop: 8 },
  url: { fontSize: 13, color: '#6b7280' },
  statsRow: { display: 'flex', gap: 28, alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: 600, marginBottom: 14 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thead: { background: '#f9fafb', color: '#6b7280', fontSize: 12, textTransform: 'uppercase' },
  row: { borderTop: '1px solid #f3f4f6' },
};
