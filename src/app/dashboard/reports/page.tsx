"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";

const REPORT_TYPES = [
  { id: 'hardware_summary', label: 'Hardware Asset Summary', icon: '🖥️', desc: 'Complete hardware inventory with specs, condition, and depreciation' },
  { id: 'win11_readiness', label: 'Windows 11 Readiness', icon: '🪟', desc: 'Device compatibility assessment for Win11 upgrade planning' },
  { id: 'software_audit', label: 'Software License Audit', icon: '📦', desc: 'Non-M365 software licenses, quantities, and expiry tracking' },
  { id: 'depreciation', label: 'Asset Depreciation & Lifecycle', icon: '📉', desc: 'Book value, accumulated depreciation, and replacement planning' },
  { id: 'survey_status', label: 'Survey Submission Status', icon: '📋', desc: 'Overview of all ICT survey submissions and approval status' },
];

export default function ReportsPage() {
  const { data: session } = useSession();
  const [selected, setSelected] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  if (!session) return null;
  const role = (session.user as any).role;
  const isCentral = role.startsWith('CENTRAL');
  const showCosts = ['TENANT_IT', 'TENANT_ADMIN', 'CENTRAL_APPROVER', 'CENTRAL_IT'].includes(role);

  const generateReport = async (type: string) => {
    setSelected(type);
    setLoading(true);
    const res = await fetch(`/api/reports?type=${type}`);
    const data = await res.json();
    setReport(data);
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Standard Reports</h1>
          <p className="page-subtitle">{isCentral ? 'Generate national-level reports across all institutions' : 'Generate reports for your institution'}</p>
        </div>
      </div>

      {/* Report Selector */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        {REPORT_TYPES.map(r => (
          <div key={r.id} className="glass-panel" style={{ cursor: 'pointer', textAlign: 'center', padding: '1.5rem', borderColor: selected === r.id ? 'var(--primary)' : undefined, background: selected === r.id ? 'var(--primary-subtle)' : undefined }}
            onClick={() => generateReport(r.id)}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{r.icon}</div>
            <h2 style={{ marginBottom: '0.375rem', fontSize: '0.875rem' }}>{r.label}</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Report Output */}
      {loading && (
        <div className="glass-panel"><div className="loading-shimmer" style={{ height: 200 }} /><p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem' }}>Generating report...</p></div>
      )}

      {!loading && report && (
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ marginBottom: '0.25rem' }}>{report.reportTitle}</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Generated: {new Date(report.generatedAt).toLocaleString()} by {report.generatedBy}</p>
            </div>
            <button className="btn btn-primary" onClick={() => window.print()}>
              🖨️ Print Report
            </button>
          </div>

          {/* Dynamic rendering based on report type */}
          {report.assets && (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {report.assets[0] && Object.keys(report.assets[0]).filter(k => !showCosts ? !['cost', 'purchaseCost', 'bookValue', 'accumulatedDep'].includes(k) : true).map(k => (
                      <th key={k}>{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.assets.map((row: any, i: number) => (
                    <tr key={i}>
                      {Object.entries(row).filter(([k]) => !showCosts ? !['cost', 'purchaseCost', 'bookValue', 'accumulatedDep'].includes(k) : true).map(([k, v]: [string, any]) => (
                        <td key={k} style={typeof v === 'number' ? { textAlign: 'right' } : undefined}>
                          {v instanceof Date || (typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}/))
                            ? new Date(v).toLocaleDateString()
                            : typeof v === 'boolean' ? (v ? '✅' : '❌')
                            : typeof v === 'number' ? (k.toLowerCase().includes('cost') || k.toLowerCase().includes('value') ? `$${v.toLocaleString()}` : v)
                            : String(v ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {report.licenses && !report.assets && (
            <div className="data-table-container">
              <table className="data-table">
                <thead><tr><th>Software</th><th>Vendor</th><th>Type</th><th>Qty</th><th>Assigned</th>{showCosts && <th>Annual Cost</th>}<th>Expiry</th>{isCentral && <th>Organization</th>}</tr></thead>
                <tbody>
                  {report.licenses.map((l: any, i: number) => (
                    <tr key={i}>
                      <td><strong style={{ color: 'var(--text-primary)' }}>{l.name}</strong></td>
                      <td>{l.vendor || '—'}</td><td>{l.type}</td>
                      <td style={{ textAlign: 'center' }}>{l.quantity}</td>
                      <td style={{ textAlign: 'center' }}>{l.assigned}</td>
                      {showCosts && <td style={{ textAlign: 'right' }}>{l.cost ? `$${l.cost.toLocaleString()}` : '—'}</td>}
                      <td>{l.expiry ? new Date(l.expiry).toLocaleDateString() : '—'}</td>
                      {isCentral && <td>{l.organization}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {report.surveys && (
            <div className="data-table-container">
              <table className="data-table">
                <thead><tr><th>Reference</th><th>Organization</th><th>Period</th><th>Status</th><th>HW</th><th>SW</th><th>Sys</th><th>Attach.</th><th>Submitted</th></tr></thead>
                <tbody>
                  {report.surveys.map((s: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace' }}>{s.reference}</td>
                      <td>{s.organization}</td>
                      <td>{s.year}{s.quarter ? ` Q${s.quarter}` : ''}</td>
                      <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                      <td style={{ textAlign: 'center' }}>{s.hardware}</td>
                      <td style={{ textAlign: 'center' }}>{s.software}</td>
                      <td style={{ textAlign: 'center' }}>{s.systems}</td>
                      <td style={{ textAlign: 'center' }}>{s.attachments}</td>
                      <td>{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary stats */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--border-radius-sm)', display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.8125rem' }}>
            {Object.entries(report).filter(([k, v]) => typeof v === 'number' && !['totalAssets'].includes(k) && (showCosts || (!k.toLowerCase().includes('cost') && !k.toLowerCase().includes('value')))).map(([k, v]) => (
              <div key={k}>
                <span style={{ color: 'var(--text-muted)' }}>{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}: </span>
                <strong style={{ color: 'var(--primary)' }}>
                  {k.toLowerCase().includes('cost') || k.toLowerCase().includes('value') ? `$${(v as number).toLocaleString()}` : String(v)}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
