"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";

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

export default function DashboardPage() {
  const { data: session } = useSession();
  if (!session) return null;

  const role = (session.user as any).role;
  const isCentral = role === 'CENTRAL_APPROVER' || role === 'CENTRAL_IT' || role === 'CENTRAL_VIEWER';

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isCentral ? 'National ICT Overview' : 'Institute ICT Dashboard'}
          </h1>
          <p className="page-subtitle">
            {isCentral
              ? 'Infrastructure survey data across all government institutions'
              : 'Manage your institution\'s ICT asset inventory and surveys'}
          </p>
        </div>
        <Link href="/dashboard/surveys/new" className="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Survey
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <MetricCard label="Total Hardware" value="—" sub="Assets registered" icon="🖥️" variant="teal" />
        <MetricCard label="Win11 Ready" value="—%" sub="Compatible devices" icon="✅" variant="green" />
        <MetricCard label="Active Surveys" value="—" sub="In progress" icon="📋" variant="amber" />
        <MetricCard label="Software Licenses" value="—" sub="Non-M365 tracked" icon="📦" variant="purple" />
      </div>

      {/* Quick Actions */}
      <div className="grid-3">
        {/* Start New Survey */}
        <Link href="/dashboard/surveys/new" style={{ textDecoration: 'none' }}>
          <div className="glass-panel" style={{ cursor: 'pointer', textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📝</div>
            <h2 style={{ marginBottom: '0.5rem' }}>Start New Survey</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Submit your institution&apos;s quarterly ICT infrastructure inventory
            </p>
          </div>
        </Link>

        {/* Hardware Inventory */}
        <Link href="/dashboard/hardware" style={{ textDecoration: 'none' }}>
          <div className="glass-panel" style={{ cursor: 'pointer', textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🖥️</div>
            <h2 style={{ marginBottom: '0.5rem' }}>Hardware Assets</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              View desktops, laptops, servers, and network equipment
            </p>
          </div>
        </Link>

        {/* Win11 Readiness */}
        <Link href="/dashboard/win11" style={{ textDecoration: 'none' }}>
          <div className="glass-panel" style={{ cursor: 'pointer', textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🪟</div>
            <h2 style={{ marginBottom: '0.5rem' }}>Win11 Readiness</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Check which devices are ready for Windows 11 upgrade
            </p>
          </div>
        </Link>
      </div>

      {/* M365 Integration Banner */}
      <div className="glass-panel" style={{ marginTop: '1.5rem', background: 'rgba(59,130,246,0.04)', borderColor: 'rgba(59,130,246,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ fontSize: '2rem' }}>🔗</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: 'var(--accent-blue)', marginBottom: '0.25rem' }}>Integrated with M365 License Portal</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              View which M365 licenses are assigned to which users and devices. Data flows between both portals to provide a complete picture of your institution&apos;s IT landscape.
            </p>
          </div>
          <a href={process.env.NEXT_PUBLIC_M365_PORTAL_URL || 'http://localhost:3000'} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            Open M365 Portal →
          </a>
        </div>
      </div>
    </div>
  );
}
