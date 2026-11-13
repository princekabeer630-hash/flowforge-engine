import React, { useEffect, useState } from 'react';

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/workflows/analytics/metrics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': 'default-tenant'
        }
      });
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading analytics...</div>;

  return (
    <div style={{ padding: '24px', background: '#f8f9fa', borderRadius: '12px', margin: '20px' }}>
      <h2>📊 FlowForge Admin Analytics</h2>
      <p style={{ color: '#6c757d', marginBottom: '24px' }}>Real-time execution telemetry and tenant resource monitoring.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Card 1: Total Workflows */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>Total Workflows</h4>
          <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#007bff' }}>{metrics?.totalWorkflows || 0}</span>
        </div>

        {/* Card 2: Active Workflows */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>Active States</h4>
          <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#28a745' }}>{metrics?.activeWorkflows || 0}</span>
        </div>

        {/* Card 3: Dead-Letter Queue Errors */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>DLQ Failed Tasks</h4>
          <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc3545' }}>{metrics?.totalDlqErrors || 0}</span>
        </div>

        {/* Card 4: System Health */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>System Health</h4>
          <span style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: metrics?.systemHealth === 'Healthy' ? '#28a745' : '#ffc107',
            background: metrics?.systemHealth === 'Healthy' ? '#e6ffe6' : '#fff3cd',
            padding: '4px 10px',
            borderRadius: '4px'
          }}>
            {metrics?.systemHealth || 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  );
};