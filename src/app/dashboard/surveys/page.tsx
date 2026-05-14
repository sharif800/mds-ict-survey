"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  DRAFT:              { label: 'Draft',              cls: 'badge-DRAFT' },
  SUBMITTED:          { label: 'Submitted',          cls: 'badge-SUBMITTED' },
  INSTITUTE_APPROVED: { label: 'Inst. Approved',     cls: 'badge-INSTITUTE_APPROVED' },
  MDS_REVIEWED:       { label: 'MDS Reviewed',       cls: 'badge-MDS_REVIEWED' },
  COMPLETED:          { label: 'Completed',          cls: 'badge-COMPLETED' },
};

export default function SurveyListPage() {
  const { data: session } = useSession();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/surveys').then(r => r.json()).then(d => { setSurveys(d); setLoading(false); });
  }, []);

  if (!session) return null;
  const role = (session.user as any).role;
  const isCentral = ['CENTRAL_APPROVER', 'CENTRAL_IT', 'CENTRAL_VIEWER'].includes(role);

  const advanceSurvey = async (id: string) => {
    await fetch(`/api/surveys/${id}`, { method: 'PATCH' });
    const updated = await fetch('/api/surveys').then(r => r.json());
    setSurveys(updated);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isCentral ? 'All Institution Surveys' : 'My Surveys'}</h1>
          <p className="page-subtitle">
            {isCentral
              ? 'Review and approve ICT infrastructure survey submissions'
              : 'Track your institution\'s ICT survey submissions'}
          </p>
        </div>
        {(role === 'TENANT_IT' || role === 'CENTRAL_IT') && (
          <Link href="/dashboard/surveys/new" className="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Survey
          </Link>
        )}
      </div>

      <div className="glass-panel">
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                {isCentral && <th>Institution</th>}
                <th>Year / Quarter</th>
                <th>Hardware</th>
                <th>Software</th>
                <th>Systems</th>
                <th>Status</th>
                <th className="actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : surveys.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No surveys found. Create your first survey to get started.</td></tr>
              ) : surveys.map((s: any) => {
                const sm = STATUS_META[s.status] || { label: s.status, cls: '' };
                return (
                  <tr key={s.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {s.referenceNumber}
                      </span>
                    </td>
                    {isCentral && (
                      <td>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.organization?.name}</span>
                      </td>
                    )}
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {s.surveyYear}{s.quarter ? ` Q${s.quarter}` : ' (Annual)'}
                    </td>
                    <td>
                      <span style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', padding: '0.1rem 0.45rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600 }}>
                        {s._count?.hardwareAssets || 0}
                      </span>
                    </td>
                    <td>
                      <span style={{ background: 'var(--accent-purple-bg)', color: 'var(--accent-purple)', padding: '0.1rem 0.45rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600 }}>
                        {s._count?.softwareLicenses || 0}
                      </span>
                    </td>
                    <td>
                      <span style={{ background: 'var(--accent-blue-bg)', color: 'var(--accent-blue)', padding: '0.1rem 0.45rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600 }}>
                        {s._count?.infoSystems || 0}
                      </span>
                    </td>
                    <td><span className={`badge ${sm.cls}`}>{sm.label}</span></td>
                    <td className="actions">
                      <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                        <Link href={`/dashboard/surveys/${s.id}`} className="btn btn-outline btn-sm">View</Link>
                        {role === 'TENANT_IT' && s.status === 'DRAFT' && (
                          <button className="btn btn-primary btn-sm" onClick={() => advanceSurvey(s.id)}>Submit</button>
                        )}
                        {role === 'TENANT_ADMIN' && s.status === 'SUBMITTED' && (
                          <button className="btn btn-success btn-sm" onClick={() => advanceSurvey(s.id)}>Approve</button>
                        )}
                        {['CENTRAL_APPROVER', 'CENTRAL_IT'].includes(role) && s.status === 'INSTITUTE_APPROVED' && (
                          <button className="btn btn-primary btn-sm" onClick={() => advanceSurvey(s.id)}>Review</button>
                        )}
                        {role === 'CENTRAL_IT' && s.status === 'MDS_REVIEWED' && (
                          <button className="btn btn-success btn-sm" onClick={() => advanceSurvey(s.id)}>✓ Complete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
