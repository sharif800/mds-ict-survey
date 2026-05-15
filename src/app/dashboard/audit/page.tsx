"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit-logs').then(r => r.json()).then(d => {
      setLogs(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  if (!session) return null;
  const role = (session.user as any).role;
  const isCentral = role.startsWith('CENTRAL');

  if (!isCentral) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-danger">Access Denied</h2>
        <p>Only MDS central administrators can view audit logs.</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🛡️ System Audit Logs</h1>
          <p className="page-subtitle">Security trail of all administrative and submission actions across the portal.</p>
        </div>
      </div>

      <div className="glass-panel">
        <div className="data-table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading audit trails...</div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛡️</div>
              <div className="empty-state-title">No audit logs found</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th><th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{log.userName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.userRole}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${log.action.includes('SUCCESS') || log.action.includes('COMPLETE') ? 'COMPLETED' : 'SUBMITTED'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>{log.entityType}</div>
                      <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{log.entityId || 'N/A'}</div>
                    </td>
                    <td style={{ maxWidth: '300px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {log.details || '—'}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.ipAddress}</td>
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
