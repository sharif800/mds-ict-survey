"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ['#14b8a6', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e', '#64748b'];

function MetricCard({ label, value, sub, icon, variant }: { label: string; value: string; sub?: string; icon: string; variant: string }) {
  return (
    <div className={`metric-card ${variant} fade-in`}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

export default function IntegratedViewPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/integrated').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (!session) return null;
  const role = (session.user as any).role;
  const isCentral = ['CENTRAL_APPROVER', 'CENTRAL_IT', 'CENTRAL_VIEWER'].includes(role);

  if (loading || !data) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Integrated View</h1>
            <p className="page-subtitle">Loading cross-portal data...</p>
          </div>
        </div>
        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="metric-card" style={{ height: '100px' }}>
              <div className="loading-shimmer" style={{ height: '14px', width: '60%', marginBottom: '0.75rem' }} />
              <div className="loading-shimmer" style={{ height: '32px', width: '40%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Process Win11 data for pie chart
  const win11Data = data.win11Stats?.map((s: any) => ({
    name: s.status === 'YES' ? 'Compatible' : s.status === 'NO' ? 'Not Compatible' : 'Unknown',
    value: s.count,
  })) || [];

  const totalComputers = win11Data.reduce((s: number, d: any) => s + d.value, 0);
  const compatibleCount = win11Data.find((d: any) => d.name === 'Compatible')?.value || 0;
  const readinessPercent = totalComputers > 0 ? Math.round((compatibleCount / totalComputers) * 100) : 0;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔗 Integrated View</h1>
          <p className="page-subtitle">
            {isCentral
              ? 'Combined data from ICT Survey & M365 License Portal across all institutions'
              : 'Your institution\'s complete IT landscape — hardware, licenses, and M365 assignments'}
          </p>
        </div>
      </div>

      {/* Unified Metrics */}
      <div className="grid-5" style={{ marginBottom: '2rem' }}>
        <MetricCard label="Hardware Assets" value={String(data.totalHardware || 0)} sub="All categories" icon="🖥️" variant="teal" />
        <MetricCard label="Win11 Ready" value={`${readinessPercent}%`} sub={`${compatibleCount}/${totalComputers} devices`} icon="🪟" variant="green" />
        <MetricCard label="Software Licenses" value={String(data.totalSoftware || 0)} sub="Non-M365" icon="📦" variant="purple" />
        <MetricCard label="M365 Mapped" value={String(data.m365Mappings || 0)} sub="User-device links" icon="🔗" variant="blue" />
        <MetricCard label="Needs Replacement" value={String(data.assetsNeedingReplacement || 0)} sub="Past useful life" icon="⚠️" variant="red" />
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Win11 Readiness Pie */}
        <div className="glass-panel">
          <h2>Windows 11 Readiness</h2>
          {win11Data.length > 0 ? (
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={win11Data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {win11Data.map((_: any, i: number) => (
                      <Cell key={i} fill={['#22c55e', '#ef4444', '#64748b'][i % 3]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', fontSize: '12px', borderRadius: '6px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state-text">No hardware data to analyze</div></div>
          )}
        </div>

        {/* Hardware by Category Bar */}
        <div className="glass-panel">
          <h2>Hardware by Category</h2>
          {data.hardwareByCategory?.length > 0 ? (
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hardwareByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="category" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', fontSize: '12px', borderRadius: '6px' }} />
                  <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state-text">No hardware data yet</div></div>
          )}
        </div>
      </div>

      {/* Organization Breakdown (Central only) */}
      {isCentral && data.orgBreakdown?.length > 0 && (
        <div className="glass-panel">
          <h2>Institution ICT Landscape</h2>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Institution</th>
                  <th style={{ textAlign: 'right' }}>Hardware</th>
                  <th style={{ textAlign: 'right' }}>Software</th>
                  <th style={{ textAlign: 'right' }}>Systems</th>
                  <th style={{ textAlign: 'right' }}>Total ICT Assets</th>
                </tr>
              </thead>
              <tbody>
                {data.orgBreakdown.map((org: any) => (
                  <tr key={org.tenantName}>
                    <td>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{org.name}</span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{org.tenantName}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{org.hardware}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{org.software}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{org.systems}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                      {org.hardware + org.software + org.systems}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* M365 Portal Integration Note */}
      <div className="glass-panel" style={{ background: 'rgba(59,130,246,0.04)', borderColor: 'rgba(59,130,246,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '1.5rem' }}>💡</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--accent-blue)' }}>M365 License Data</strong> — License allocation, cost breakdown, and organizational billing data is available in the
              <a href={process.env.NEXT_PUBLIC_M365_PORTAL_URL || 'http://localhost:3000'} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '0.25rem' }}>M365 License Portal</a>.
              Use the M365 User-Device Mapping to link license assignments to specific hardware.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
