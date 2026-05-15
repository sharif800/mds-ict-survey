"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function HardwareAssetsPage() {
  const { data: session } = useSession();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/surveys').then(r => r.json()).then(d => { setSurveys(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  if (!session) return null;
  const role = (session.user as any).role;
  const showCosts = ['TENANT_IT', 'TENANT_ADMIN', 'CENTRAL_APPROVER', 'CENTRAL_IT'].includes(role);

  // Flatten all hardware from all surveys
  const allHardware = surveys.flatMap((s: any) =>
    (s.hardwareAssets || []).map((a: any) => ({ ...a, orgName: s.organization?.name, surveyRef: s.referenceNumber }))
  );

  // Since surveys API uses _count, we need to fetch individual surveys for full data
  // For now, let's use the integrated API approach
  const [assets, setAssets] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    // Fetch all surveys with full hardware data
    fetch('/api/reports?type=hardware_summary').then(r => r.json()).then(d => {
      setAssets(d.assets || []);
      setLoading(false);
    });
  }, []);

  const filtered = filter === 'ALL' ? assets : assets.filter(a => a.category === filter);
  const categories = [...new Set(assets.map(a => a.category))];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hardware Assets</h1>
          <p className="page-subtitle">All registered hardware across {role.startsWith('CENTRAL') ? 'all institutions' : 'your institution'}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Print</button>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className={`btn ${filter === 'ALL' ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => setFilter('ALL')}>All ({assets.length})</button>
        {categories.map(c => (
          <button key={c} className={`btn ${filter === c ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => setFilter(c)}>
            {c} ({assets.filter(a => a.category === c).length})
          </button>
        ))}
      </div>

      <div className="glass-panel">
        <div className="data-table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading assets...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">🖥️</div><div className="empty-state-title">No hardware assets found</div></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset Tag</th><th>Category</th><th>Make / Model</th>
                  <th>Processor</th><th>RAM</th><th>OS</th><th>Condition</th>
                  <th>Department</th><th>Assigned To</th>
                  {role.startsWith('CENTRAL') && <th>Organization</th>}
                  {showCosts && <th>Cost</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a: any, i: number) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{a.assetTag || '—'}</td>
                    <td><span className="badge" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', border: 'none' }}>{a.category}</span></td>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{a.make}</strong> {a.model}</td>
                    <td style={{ fontSize: '0.75rem' }}>{a.processorModel || '—'}</td>
                    <td>{a.ramGb ? `${a.ramGb}GB` : '—'}</td>
                    <td style={{ fontSize: '0.75rem' }}>{a.currentOs || '—'}</td>
                    <td><span className={`badge badge-${a.condition || 'OPERATIONAL'}`}>{a.condition || '—'}</span></td>
                    <td>{a.department || '—'}</td>
                    <td>{a.assignedTo || '—'}</td>
                    {role.startsWith('CENTRAL') && <td style={{ fontSize: '0.75rem' }}>{a.organization}</td>}
                    {showCosts && <td style={{ textAlign: 'right', fontWeight: 600 }}>{a.purchaseCost ? `$${a.purchaseCost.toLocaleString()}` : '—'}</td>}
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
