"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export default function Win11ReadinessPage() {
  const { data: session } = useSession();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports?type=win11_readiness').then(r => r.json()).then(d => { setReport(d); setLoading(false); });
  }, []);

  if (!session) return null;
  const role = (session.user as any).role;
  const isCentral = role.startsWith('CENTRAL');

  if (loading || !report) {
    return (
      <div className="fade-in">
        <div className="page-header"><div><h1 className="page-title">Windows 11 Readiness</h1></div></div>
        <div className="glass-panel"><div className="loading-shimmer" style={{ height: 300 }} /></div>
      </div>
    );
  }

  const pieData = [
    { name: 'Compatible', value: report.compatible, color: '#22c55e' },
    { name: 'Not Compatible', value: report.notCompatible, color: '#ef4444' },
    { name: 'Unknown', value: report.unknown, color: '#64748b' },
  ].filter(d => d.value > 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🪟 Windows 11 Readiness</h1>
          <p className="page-subtitle">{isCentral ? 'National readiness assessment across all institutions' : 'Your institution\'s device compatibility check'}</p>
        </div>
        <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Print Report</button>
      </div>

      {/* Readiness Summary */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="metric-card teal">
          <div className="metric-label">Total Devices</div>
          <div className="metric-value">{report.totalDevices}</div>
          <div className="metric-sub">Desktops & Laptops</div>
        </div>
        <div className="metric-card green">
          <div className="metric-label">Compatible</div>
          <div className="metric-value">{report.compatible}</div>
          <div className="metric-sub">{report.readinessPercent}% ready</div>
        </div>
        <div className="metric-card red">
          <div className="metric-label">Not Compatible</div>
          <div className="metric-value">{report.notCompatible}</div>
          <div className="metric-sub">Needs replacement</div>
        </div>
        <div className="metric-card amber">
          <div className="metric-label">Unknown</div>
          <div className="metric-value">{report.unknown}</div>
          <div className="metric-sub">Needs verification</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Readiness Gauge */}
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <h2>Readiness Overview</h2>
          {report.totalDevices > 0 ? (
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value"
                    label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', fontSize: '12px', borderRadius: '6px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state-text">No desktop/laptop data</div></div>
          )}
          <div style={{ fontSize: '3rem', fontWeight: 800, color: report.readinessPercent >= 70 ? 'var(--success-color)' : report.readinessPercent >= 40 ? 'var(--warning-color)' : 'var(--danger-color)' }}>
            {report.readinessPercent}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Overall Readiness</div>
        </div>

        {/* Incompatible Devices List */}
        <div className="glass-panel">
          <h2>⚠️ Devices Needing Replacement ({report.incompatibleDevices?.length || 0})</h2>
          {report.incompatibleDevices?.length > 0 ? (
            <div className="data-table-container" style={{ maxHeight: '400px', overflow: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Make / Model</th><th>Processor</th><th>RAM</th><th>TPM</th><th>Dept</th>{isCentral && <th>Org</th>}</tr>
                </thead>
                <tbody>
                  {report.incompatibleDevices.map((d: any, i: number) => (
                    <tr key={i}>
                      <td><strong style={{ color: 'var(--text-primary)' }}>{d.make}</strong> {d.model}</td>
                      <td style={{ fontSize: '0.75rem' }}>{d.processor || '—'}</td>
                      <td>{d.ram ? `${d.ram}GB` : '—'}</td>
                      <td><span className="badge badge-NO">{d.tpm || 'N/A'}</span></td>
                      <td>{d.department || '—'}</td>
                      {isCentral && <td style={{ fontSize: '0.75rem' }}>{d.organization}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state-text">All devices are Win11 compatible! 🎉</div></div>
          )}
        </div>
      </div>
    </div>
  );
}
