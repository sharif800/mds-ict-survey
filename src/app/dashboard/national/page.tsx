"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

function MetricCard({ label, value, sub, variant }: { label: string; value: string; sub?: string; variant: string }) {
  return (
    <div className={`metric-card ${variant} fade-in`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

const COLORS = ['#14b8a6', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e', '#64748b', '#ec4899'];

export default function NationalAnalyticsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/integrated').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (!session) return null;
  const role = (session.user as any).role;
  if (!role.startsWith('CENTRAL')) {
    return (
      <div className="fade-in">
        <div className="page-header"><div><h1 className="page-title">Access Denied</h1></div></div>
        <div className="glass-panel"><p style={{ color: 'var(--danger-color)' }}>National Analytics is only available to MDS central administrators.</p></div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="fade-in">
        <div className="page-header"><div><h1 className="page-title">National Analytics</h1></div></div>
        <div className="grid-4">{[1,2,3,4].map(i => <div key={i} className="metric-card"><div className="loading-shimmer" style={{ height: 80 }} /></div>)}</div>
      </div>
    );
  }

  const surveyData = data.surveyStatuses?.map((s: any) => ({ name: s.status.replace(/_/g, ' '), value: s.count })) || [];
  const hwData = data.hardwareByCategory?.map((h: any) => ({ name: h.category, count: h.count })) || [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏛️ National ICT Analytics</h1>
          <p className="page-subtitle">Cross-institutional infrastructure overview — MDS administrative view</p>
        </div>
        <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Print Dashboard</button>
      </div>

      {/* National Metrics */}
      <div className="grid-5" style={{ marginBottom: '2rem' }}>
        <MetricCard label="Total Hardware" value={String(data.totalHardware || 0)} sub="All institutions" variant="teal" />
        <MetricCard label="Software Licenses" value={String(data.totalSoftware || 0)} sub="Non-M365" variant="purple" />
        <MetricCard label="Info Systems" value={String(data.totalSystems || 0)} sub="Registered" variant="blue" />
        <MetricCard label="M365 Mapped" value={String(data.m365Mappings || 0)} sub="User-device links" variant="amber" />
        <MetricCard label="Needs Replacement" value={String(data.assetsNeedingReplacement || 0)} sub="Past useful life" variant="red" />
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Hardware by Category */}
        <div className="glass-panel">
          <h2>Hardware by Category</h2>
          {hwData.length > 0 ? (
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hwData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', fontSize: '12px', borderRadius: '6px' }} />
                  <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="empty-state"><div className="empty-state-text">No data yet</div></div>}
        </div>

        {/* Survey Status */}
        <div className="glass-panel">
          <h2>Survey Status Overview</h2>
          {surveyData.length > 0 ? (
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={surveyData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}>
                    {surveyData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', fontSize: '12px', borderRadius: '6px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="empty-state"><div className="empty-state-text">No survey data</div></div>}
        </div>
      </div>

      {/* Institution Breakdown Table */}
      {data.orgBreakdown?.length > 0 && (
        <div className="glass-panel">
          <h2>Institution-Level ICT Inventory</h2>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr><th>Institution</th><th>Tenant</th><th style={{ textAlign: 'right' }}>Hardware</th><th style={{ textAlign: 'right' }}>Software</th><th style={{ textAlign: 'right' }}>Systems</th><th style={{ textAlign: 'right' }}>Total Assets</th></tr>
              </thead>
              <tbody>
                {data.orgBreakdown.map((org: any) => (
                  <tr key={org.tenantName}>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{org.name}</strong></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{org.tenantName}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{org.hardware}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{org.software}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{org.systems}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{org.hardware + org.software + org.systems}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
