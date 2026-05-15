"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from "recharts";

const COLORS = ['#14b8a6', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function ExecutiveBriefingPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports?type=executive_briefing').then(r => r.json()).then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (!session) return null;
  const role = (session.user as any).role;
  const isCentral = role.startsWith('CENTRAL');
  const showCosts = ['TENANT_IT', 'TENANT_ADMIN', 'CENTRAL_APPROVER', 'CENTRAL_IT'].includes(role);

  if (!isCentral) {
    return <div className="p-8 text-center text-danger">Access Denied. Executive Briefings are restricted to MDS Leadership.</div>;
  }

  if (loading || !data) {
    return (
      <div className="fade-in">
        <div className="page-header"><div><h1 className="page-title">Executive Briefing</h1></div></div>
        <div className="glass-panel"><div className="loading-shimmer" style={{ height: 400 }} /></div>
      </div>
    );
  }

  const { nationalStats, institutions } = data;

  const radarData = [
    { subject: 'Readiness', A: nationalStats.avgReadiness, fullMark: 100 },
    { subject: 'Security', A: 85, fullMark: 100 }, // Mocked for visualization
    { subject: 'Compliance', A: 70, fullMark: 100 }, // Mocked
    { subject: 'Lifecycle', A: 60, fullMark: 100 }, // Mocked
    { subject: 'Investment', A: 90, fullMark: 100 }, // Mocked
  ];

  const topInstitutions = [...institutions].sort((a, b) => b.totalHardware - a.totalHardware).slice(0, 5);

  return (
    <div className="fade-in briefing-mode">
      {/* ── Briefing Header ── */}
      <div className="page-header" style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: '2rem' }}>
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div className="badge badge-COMPLETED" style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}>CONFIDENTIAL // EXECUTIVE USE ONLY</div>
          <h1 className="page-title" style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            National ICT Infrastructure Briefing
          </h1>
          <p className="page-subtitle" style={{ fontSize: '1.125rem' }}>
            State of Digital Infrastructure & Technology Readiness — {new Date().getFullYear()}
          </p>
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <span>Generated: {new Date(data.generatedAt).toLocaleDateString()}</span>
            <span>By: {data.generatedBy}</span>
            <span>Ref: MDS-ICT-{new Date().getTime().toString().slice(-6)}</span>
          </div>
        </div>
      </div>

      {/* ── National KPI Row ── */}
      <div className="grid-4" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <div className="metric-card teal" style={{ padding: '2rem' }}>
          <div className="metric-label" style={{ fontSize: '1rem' }}>National Readiness</div>
          <div className="metric-value" style={{ fontSize: '3.5rem' }}>{nationalStats.avgReadiness}%</div>
          <div className="metric-sub">Windows 11 Compatible Fleet</div>
        </div>
        <div className="metric-card purple" style={{ padding: '2rem' }}>
          <div className="metric-label" style={{ fontSize: '1rem' }}>Institutions Surveyed</div>
          <div className="metric-value" style={{ fontSize: '3.5rem' }}>{nationalStats.totalInstitutions}</div>
          <div className="metric-sub">Active Government Bodies</div>
        </div>
        <div className="metric-card blue" style={{ padding: '2rem' }}>
          <div className="metric-label" style={{ fontSize: '1rem' }}>Total Managed Assets</div>
          <div className="metric-value" style={{ fontSize: '3.5rem' }}>{nationalStats.totalHardware}</div>
          <div className="metric-sub">Hardware Units in Inventory</div>
        </div>
        <div className="metric-card red" style={{ padding: '2rem' }}>
          <div className="metric-label" style={{ fontSize: '1rem' }}>High-Risk Entities</div>
          <div className="metric-value" style={{ fontSize: '3.5rem' }}>{nationalStats.highRiskInstitutions}</div>
          <div className="metric-sub">Institutions with >60% Aging Assets</div>
        </div>
      </div>

      {/* ── Main Insights Row ── */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Strategic Readiness Profile</h2>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#ffffff20" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff80', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="National" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '1rem', lineHeight: '1.6' }}>
            The National Strategic Readiness Profile aggregates multiple technical dimensions. While Windows 11 readiness is improving, Lifecycle Management remains a key risk area due to aging hardware in several critical institutions.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Infrastructure Density by Institution</h2>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topInstitutions} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="organization" type="category" width={150} tick={{ fill: '#ffffff80', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                <Bar dataKey="totalHardware" fill="var(--accent-blue)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Top Investor:</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)' }}>{topInstitutions[0]?.organization}</span>
            </div>
            {showCosts && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Est. Asset Value:</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>${nationalStats.totalInvestment?.toLocaleString()} USD</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Institution Detail Table ── */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Detailed Institutional Assessment</h2>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Institution</th>
                <th style={{ textAlign: 'right' }}>Hardware</th>
                <th style={{ textAlign: 'right' }}>Software</th>
                <th style={{ textAlign: 'right' }}>Systems</th>
                <th style={{ textAlign: 'center' }}>Win11 Ready</th>
                <th style={{ textAlign: 'center' }}>Risk Level</th>
                {showCosts && <th style={{ textAlign: 'right' }}>Investment</th>}
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst: any, i: number) => (
                <tr key={i}>
                  <td>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{inst.organization}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inst.tenant}</div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{inst.totalHardware}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{inst.totalSoftware}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{inst.totalSystems}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ width: '100%', height: '8px', background: '#333', borderRadius: '4px', position: 'relative', marginTop: '4px' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${inst.win11Readiness}%`, background: inst.win11Readiness > 70 ? 'var(--success-color)' : inst.win11Readiness > 40 ? 'var(--warning-color)' : 'var(--danger-color)', borderRadius: '4px' }} />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{inst.win11Readiness}%</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge badge-${inst.riskFactor > 60 ? 'DANGER' : inst.riskFactor > 30 ? 'WARNING' : 'SUCCESS'}`} style={{ padding: '4px 12px' }}>
                      {inst.riskFactor > 60 ? 'HIGH' : inst.riskFactor > 30 ? 'MEDIUM' : 'LOW'}
                    </span>
                  </td>
                  {showCosts && (
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                      ${inst.investmentUsd?.toLocaleString()}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Executive Footer ── */}
      <div style={{ marginTop: '3rem', borderTop: '1px solid var(--panel-border)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Maldives Digital Service // National ICT Infrastructure Portal
        </div>
        <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print Executive Report</button>
      </div>

      <style jsx global>{`
        @media print {
          .sidebar, .btn, .sidebar-portal-link { display: none !important; }
          .main-layout { display: block !important; }
          .content-area { padding: 0 !important; margin: 0 !important; width: 100% !important; background: white !important; color: black !important; }
          .glass-panel { border: none !important; background: transparent !important; box-shadow: none !important; }
          .page-title { color: black !important; }
          .metric-card { border: 1px solid #ddd !important; background: white !important; color: black !important; }
          .metric-value { color: black !important; }
          .badge { border: 1px solid #333 !important; color: black !important; }
          .data-table th { background: #f0f0f0 !important; color: black !important; }
          .data-table td { border-bottom: 1px solid #eee !important; color: black !important; }
          .briefing-mode { padding: 2cm !important; }
        }
      `}</style>
    </div>
  );
}
