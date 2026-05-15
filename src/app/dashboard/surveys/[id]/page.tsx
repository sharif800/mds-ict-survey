"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Draft', cls: 'badge-DRAFT' },
  SUBMITTED: { label: 'Submitted', cls: 'badge-SUBMITTED' },
  INSTITUTE_APPROVED: { label: 'Inst. Approved', cls: 'badge-INSTITUTE_APPROVED' },
  MDS_REVIEWED: { label: 'MDS Reviewed', cls: 'badge-MDS_REVIEWED' },
  COMPLETED: { label: 'Completed', cls: 'badge-COMPLETED' },
};

const ATTACH_CATEGORIES = [
  { value: 'INVENTORY_SPREADSHEET', label: 'Inventory Spreadsheet' },
  { value: 'APPROVAL_LETTER', label: 'Approval Letter' },
  { value: 'PROCUREMENT_PLAN', label: 'Procurement Plan' },
  { value: 'AUDIT_REPORT', label: 'Audit Report' },
  { value: 'OTHER', label: 'Other Document' },
];

export default function SurveyDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [survey, setSurvey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadCat, setUploadCat] = useState('OTHER');
  const [tab, setTab] = useState<'hardware' | 'software' | 'systems' | 'network' | 'attachments'>('hardware');

  useEffect(() => {
    if (params.id) {
      fetch(`/api/surveys/${params.id}`).then(r => r.json()).then(d => { setSurvey(d); setLoading(false); });
    }
  }, [params.id]);

  if (!session) return null;
  const role = (session.user as any).role;
  const isCentral = ['CENTRAL_APPROVER', 'CENTRAL_IT', 'CENTRAL_VIEWER'].includes(role);
  const showCosts = ['TENANT_IT', 'TENANT_ADMIN', 'CENTRAL_APPROVER', 'CENTRAL_IT'].includes(role);

  const advanceSurvey = async () => {
    await fetch(`/api/surveys/${params.id}`, { method: 'PATCH' });
    const updated = await fetch(`/api/surveys/${params.id}`).then(r => r.json());
    setSurvey(updated);
  };

  const uploadFile = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', uploadCat);
    await fetch(`/api/surveys/${params.id}/attachments`, { method: 'POST', body: fd });
    // Refresh
    const updated = await fetch(`/api/surveys/${params.id}`).then(r => r.json());
    setSurvey(updated);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const deleteAttachment = async (attachmentId: string) => {
    if (!confirm('Delete this attachment?')) return;
    await fetch(`/api/surveys/${params.id}/attachments/${attachmentId}`, { method: 'DELETE' });
    const updated = await fetch(`/api/surveys/${params.id}`).then(r => r.json());
    setSurvey(updated);
  };

  if (loading || !survey) {
    return (
      <div className="fade-in">
        <div className="page-header"><div><h1 className="page-title">Loading Survey...</h1></div></div>
        <div className="glass-panel"><div className="loading-shimmer" style={{ height: 200 }} /></div>
      </div>
    );
  }

  if (survey.error) {
    return (
      <div className="fade-in">
        <div className="page-header"><div><h1 className="page-title">Survey Not Found</h1></div></div>
        <div className="glass-panel"><p style={{ color: 'var(--danger-color)' }}>{survey.error}</p></div>
      </div>
    );
  }

  const sm = STATUS_META[survey.status] || { label: survey.status, cls: '' };
  const hw = survey.hardwareAssets || [];
  const sw = survey.softwareLicenses || [];
  const sys = survey.infoSystems || [];
  const net = survey.networkAssets || [];
  const att = survey.attachments || [];

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.375rem' }}>
            <Link href="/dashboard/surveys" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>← All Surveys</Link>
          </div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontFamily: 'monospace' }}>{survey.referenceNumber}</span>
            <span className={`badge ${sm.cls}`}>{sm.label}</span>
          </h1>
          <p className="page-subtitle">
            {survey.organization?.name} — {survey.surveyYear}{survey.quarter ? ` Q${survey.quarter}` : ' Annual'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={() => window.print()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print
          </button>
          {role === 'TENANT_IT' && survey.status === 'DRAFT' && (
            <button className="btn btn-primary" onClick={advanceSurvey}>Submit for Approval</button>
          )}
          {role === 'TENANT_IT' && survey.status === 'DRAFT' && (
            <Link href={`/dashboard/surveys/${params.id}/import`} className="btn btn-outline">
              🚀 Bulk Import Hardware
            </Link>
          )}
          {role === 'TENANT_ADMIN' && survey.status === 'SUBMITTED' && (
            <button className="btn btn-success" onClick={advanceSurvey}>Approve</button>
          )}
          {['CENTRAL_APPROVER', 'CENTRAL_IT'].includes(role) && survey.status === 'INSTITUTE_APPROVED' && (
            <button className="btn btn-primary" onClick={advanceSurvey}>MDS Review</button>
          )}
          {role === 'CENTRAL_IT' && survey.status === 'MDS_REVIEWED' && (
            <button className="btn btn-success" onClick={advanceSurvey}>✓ Complete</button>
          )}
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid-5" style={{ marginBottom: '1.5rem' }}>
        <div className="metric-card teal">
          <div className="metric-label">Hardware</div>
          <div className="metric-value">{hw.length}</div>
        </div>
        <div className="metric-card purple">
          <div className="metric-label">Software</div>
          <div className="metric-value">{sw.length}</div>
        </div>
        <div className="metric-card blue">
          <div className="metric-label">Systems</div>
          <div className="metric-value">{sys.length}</div>
        </div>
        <div className="metric-card amber">
          <div className="metric-label">Network</div>
          <div className="metric-value">{net.length}</div>
        </div>
        <div className="metric-card green">
          <div className="metric-label">Attachments</div>
          <div className="metric-value">{att.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="wizard-steps" style={{ marginBottom: '1.5rem' }}>
        {(['hardware', 'software', 'systems', 'network', 'attachments'] as const).map(t => (
          <div key={t} className={`wizard-step ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'hardware' && `🖥️ Hardware (${hw.length})`}
            {t === 'software' && `📦 Software (${sw.length})`}
            {t === 'systems' && `🌐 Systems (${sys.length})`}
            {t === 'network' && `🔌 Network (${net.length})`}
            {t === 'attachments' && `📎 Attachments (${att.length})`}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass-panel">
        {/* ── HARDWARE ── */}
        {tab === 'hardware' && (
          <div className="data-table-container">
            {hw.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">🖥️</div><div className="empty-state-title">No hardware assets yet</div></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset Tag</th><th>Category</th><th>Make / Model</th><th>Processor</th>
                    <th>RAM</th><th>Storage</th><th>OS</th><th>Win11</th><th>Condition</th>
                    <th>Department</th><th>Assigned To</th>
                    {showCosts && <th>Cost (USD)</th>}
                  </tr>
                </thead>
                <tbody>
                  {hw.map((a: any) => (
                    <tr key={a.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{a.assetTag || '—'}</td>
                      <td><span className="badge" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', border: 'none' }}>{a.category}</span></td>
                      <td><strong style={{ color: 'var(--text-primary)' }}>{a.make}</strong> {a.model}</td>
                      <td style={{ fontSize: '0.75rem' }}>{a.processorModel || '—'}</td>
                      <td>{a.ramGb ? `${a.ramGb}GB` : '—'}</td>
                      <td>{a.storageGb ? `${a.storageGb}GB ${a.storageType || ''}` : '—'}</td>
                      <td style={{ fontSize: '0.75rem' }}>{a.currentOs || '—'}</td>
                      <td><span className={`badge badge-${a.win11Compatible || 'UNKNOWN'}`}>{a.win11Compatible || 'Unknown'}</span></td>
                      <td><span className={`badge badge-${a.condition || 'OPERATIONAL'}`}>{a.condition || '—'}</span></td>
                      <td>{a.department || '—'}</td>
                      <td>{a.assignedToName || '—'}</td>
                      {showCosts && <td style={{ textAlign: 'right', fontWeight: 600 }}>{a.purchaseCostUsd ? `$${a.purchaseCostUsd.toLocaleString()}` : '—'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── SOFTWARE ── */}
        {tab === 'software' && (
          <div className="data-table-container">
            {sw.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-title">No software licenses yet</div></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Software</th><th>Vendor</th><th>Type</th><th>Qty</th><th>Assigned</th>
                    <th>Expiry</th>{showCosts && <th>Annual Cost</th>}
                  </tr>
                </thead>
                <tbody>
                  {sw.map((l: any) => (
                    <tr key={l.id}>
                      <td><strong style={{ color: 'var(--text-primary)' }}>{l.softwareName}</strong></td>
                      <td>{l.vendor || '—'}</td>
                      <td><span className="badge" style={{ background: 'var(--accent-purple-bg)', color: 'var(--accent-purple)', border: 'none' }}>{l.licenseType}</span></td>
                      <td style={{ textAlign: 'center' }}>{l.quantity}</td>
                      <td style={{ textAlign: 'center' }}>{l.assignedQty}</td>
                      <td>{l.expiryDate ? new Date(l.expiryDate).toLocaleDateString() : '—'}</td>
                      {showCosts && <td style={{ textAlign: 'right', fontWeight: 600 }}>{l.annualCostUsd ? `$${l.annualCostUsd.toLocaleString()}` : '—'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── SYSTEMS ── */}
        {tab === 'systems' && (
          <div className="data-table-container">
            {sys.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">🌐</div><div className="empty-state-title">No information systems yet</div></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>System</th><th>Type</th><th>Vendor</th><th>Hosting</th><th>Users</th><th>Criticality</th><th>Data Class.</th><th>Backup</th></tr>
                </thead>
                <tbody>
                  {sys.map((s: any) => (
                    <tr key={s.id}>
                      <td><strong style={{ color: 'var(--text-primary)' }}>{s.systemName}</strong></td>
                      <td><span className="badge" style={{ background: 'var(--accent-blue-bg)', color: 'var(--accent-blue)', border: 'none' }}>{s.systemType}</span></td>
                      <td>{s.vendor || '—'}</td>
                      <td>{s.hostingType}</td>
                      <td style={{ textAlign: 'center' }}>{s.userCount || '—'}</td>
                      <td>{s.criticality || '—'}</td>
                      <td>{s.dataClassification || '—'}</td>
                      <td>{s.backupFrequency || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── NETWORK ── */}
        {tab === 'network' && (
          <div className="data-table-container">
            {net.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">🔌</div><div className="empty-state-title">No network assets yet</div></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Type</th><th>Make</th><th>Model</th><th>Serial</th><th>IP</th><th>Ports</th><th>Managed</th><th>Condition</th></tr>
                </thead>
                <tbody>
                  {net.map((n: any) => (
                    <tr key={n.id}>
                      <td><span className="badge" style={{ background: 'var(--accent-amber-bg)', color: 'var(--accent-amber)', border: 'none' }}>{n.assetType}</span></td>
                      <td>{n.make || '—'}</td><td>{n.model || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{n.serialNumber || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{n.ipAddress || '—'}</td>
                      <td>{n.portCount || '—'}</td><td>{n.managedType || '—'}</td>
                      <td><span className={`badge badge-${n.condition || 'OPERATIONAL'}`}>{n.condition || '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── ATTACHMENTS ── */}
        {tab === 'attachments' && (
          <div>
            {/* Upload form */}
            {['TENANT_IT', 'TENANT_ADMIN', 'CENTRAL_IT'].includes(role) && survey.status !== 'COMPLETED' && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--border-radius-sm)', border: '1px dashed var(--panel-border)' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Upload Document (PDF, Excel, CSV, Image — max 25MB)</label>
                  <input type="file" ref={fileRef} className="form-control" accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg" />
                </div>
                <div className="form-group" style={{ width: '200px', marginBottom: 0 }}>
                  <label className="form-label">Category</label>
                  <select className="form-control" value={uploadCat} onChange={e => setUploadCat(e.target.value)}>
                    {ATTACH_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <button className="btn btn-primary" onClick={uploadFile} disabled={uploading} style={{ minWidth: '100px' }}>
                  {uploading ? 'Uploading...' : '📤 Upload'}
                </button>
              </div>
            )}

            {att.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📎</div>
                <div className="empty-state-title">No attachments yet</div>
                <div className="empty-state-text">Upload supporting documents like approval letters, inventory spreadsheets, or audit reports.</div>
              </div>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>File Name</th><th>Category</th><th>Size</th><th>Uploaded</th><th className="actions">Actions</th></tr>
                  </thead>
                  <tbody>
                    {att.map((a: any) => (
                      <tr key={a.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>{a.mimeType === 'application/pdf' ? '📄' : a.mimeType.startsWith('image') ? '🖼️' : '📊'}</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.originalName}</span>
                          </div>
                        </td>
                        <td><span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: '1px solid var(--panel-border)' }}>{a.category.replace(/_/g, ' ')}</span></td>
                        <td style={{ color: 'var(--text-muted)' }}>{(a.sizeBytes / 1024).toFixed(0)} KB</td>
                        <td style={{ color: 'var(--text-muted)' }}>{new Date(a.uploadedAt).toLocaleDateString()}</td>
                        <td className="actions">
                          <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                            <a href={`/api/surveys/${params.id}/attachments/${a.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">View</a>
                            {(a.uploadedById === (session.user as any).id || role === 'CENTRAL_IT') && survey.status !== 'COMPLETED' && (
                              <button className="btn btn-danger btn-sm" onClick={() => deleteAttachment(a.id)}>Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submission Info */}
      <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
        <h2>Submission Details</h2>
        <div className="grid-3">
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Submitted By</div>
            <div style={{ fontWeight: 500 }}>{survey.submittedBy?.fullName || '—'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{survey.submittedBy?.officeEmail}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Submitted At</div>
            <div style={{ fontWeight: 500 }}>{survey.submittedAt ? new Date(survey.submittedAt).toLocaleString() : 'Not yet submitted'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Approved By</div>
            <div style={{ fontWeight: 500 }}>{survey.approvedBy?.fullName || 'Pending'}</div>
            {survey.approvedAt && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(survey.approvedAt).toLocaleString()}</div>}
          </div>
        </div>
        {survey.reviewNotes && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--warning-bg)', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--warning-color)', marginBottom: '0.25rem' }}>Review Notes</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{survey.reviewNotes}</div>
          </div>
        )}
      </div>
    </div>
  );
}
