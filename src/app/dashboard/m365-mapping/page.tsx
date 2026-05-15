"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function M365MappingPage() {
  const { data: session } = useSession();
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/m365-mapping').then(r => r.json()).then(d => { setMappings(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  if (!session) return null;
  const role = (session.user as any).role;
  const isCentral = role.startsWith('CENTRAL');

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔗 M365 User–Device Mapping</h1>
          <p className="page-subtitle">
            {isCentral ? 'Mapping of M365 licenses to users and devices across all institutions' : 'Your institution\'s M365 license assignments mapped to hardware'}
          </p>
        </div>
        <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Print</button>
      </div>

      <div className="glass-panel">
        <div className="data-table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading mappings...</div>
          ) : mappings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔗</div>
              <div className="empty-state-title">No M365 user-device mappings yet</div>
              <div className="empty-state-text">Mappings are created when hardware surveys link M365 license assignments to physical devices.</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th><th>Email</th><th>Department</th><th>M365 License</th><th>Device</th>
                  {isCentral && <th>Organization</th>}
                </tr>
              </thead>
              <tbody>
                {mappings.map((m: any) => (
                  <tr key={m.id}>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{m.userName || '—'}</strong></td>
                    <td style={{ fontSize: '0.75rem' }}>{m.userEmail}</td>
                    <td>{m.department || '—'}</td>
                    <td><span className="badge" style={{ background: 'var(--accent-blue-bg)', color: 'var(--accent-blue)', border: 'none' }}>{m.m365License || '—'}</span></td>
                    <td>{m.deviceDescription || m.hardwareAsset?.make + ' ' + m.hardwareAsset?.model || '—'}</td>
                    {isCentral && <td style={{ fontSize: '0.75rem' }}>{m.organization?.name || '—'}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Integration note */}
      <div className="glass-panel" style={{ marginTop: '1.5rem', background: 'rgba(59,130,246,0.04)', borderColor: 'rgba(59,130,246,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '1.5rem' }}>💡</div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
            This mapping connects M365 license allocations from the{' '}
            <a href={process.env.NEXT_PUBLIC_M365_PORTAL_URL || 'http://localhost:3000'} target="_blank" rel="noopener noreferrer">M365 License Portal</a>
            {' '}to physical hardware registered in ICT surveys. It helps audit which users have licenses on which devices.
          </p>
        </div>
      </div>
    </div>
  );
}
