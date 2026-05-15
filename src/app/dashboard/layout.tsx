"use client";
import { signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import React from 'react';

const ROLE_LABELS: Record<string, string> = {
  TENANT_IT: 'Institute IT Officer',
  TENANT_ADMIN: 'Institute Administrator',
  TENANT_VIEWER: 'Institute Viewer',
  CENTRAL_APPROVER: 'MDS Approver',
  CENTRAL_IT: 'MDS System Admin',
  CENTRAL_VIEWER: 'MDS Auditor',
};

function NavIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactElement> = {
    dashboard: <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
    survey:    <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>,
    hardware:  <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 8h2"/><path d="M7 11h4"/></svg>,
    reports:   <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    mapping:   <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    win11:     <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    integrate: <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  };
  return icons[type] || null;
}

function getInitials(name: string) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  if (status !== "authenticated" || !session?.user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--panel-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const role = (session.user as any).role;
  const name = session.user.name || 'User';
  const isCentral = role === 'CENTRAL_APPROVER' || role === 'CENTRAL_IT' || role === 'CENTRAL_VIEWER';

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8" /><path d="M12 17v4" />
              </svg>
            </div>
            <div className="sidebar-logo-text">ICT <span>Survey</span></div>
          </div>
          <div className="sidebar-user">
            <div className="sidebar-avatar">{getInitials(name)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{name}</div>
              <div className="sidebar-user-role">{ROLE_LABELS[role] || role}</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-section">
            <div className="sidebar-nav-label">Main</div>
            <Link href="/dashboard" className={pathname === '/dashboard' ? 'active' : ''}>
              <NavIcon type="dashboard" /> Dashboard
            </Link>
            <Link href="/dashboard/surveys" className={pathname.startsWith('/dashboard/surveys') ? 'active' : ''}>
              <NavIcon type="survey" /> My Surveys
            </Link>
          </div>

          <div className="sidebar-nav-section">
            <div className="sidebar-nav-label">Inventory</div>
            <Link href="/dashboard/hardware" className={pathname.startsWith('/dashboard/hardware') ? 'active' : ''}>
              <NavIcon type="hardware" /> Hardware Assets
            </Link>
            <Link href="/dashboard/m365-mapping" className={pathname.startsWith('/dashboard/m365-mapping') ? 'active' : ''}>
              <NavIcon type="mapping" /> M365 User Mapping
            </Link>
            <Link href="/dashboard/win11" className={pathname.startsWith('/dashboard/win11') ? 'active' : ''}>
              <NavIcon type="win11" /> Win11 Readiness
            </Link>
            <Link href="/dashboard/reports" className={pathname.startsWith('/dashboard/reports') ? 'active' : ''}>
              <NavIcon type="reports" /> Reports
            </Link>
          </div>

          {isCentral && (
            <div className="sidebar-nav-section">
              <div className="sidebar-nav-label">National</div>
              <Link href="/dashboard/national" className={pathname === '/dashboard/national' ? 'active' : ''}>
                <NavIcon type="reports" /> National Analytics
              </Link>
              <Link href="/dashboard/national/briefing" className={pathname.startsWith('/dashboard/national/briefing') ? 'active' : ''}>
                <NavIcon type="dashboard" /> Executive Briefing
              </Link>
              <Link href="/dashboard/integrated" className={pathname.startsWith('/dashboard/integrated') ? 'active' : ''}>
                <NavIcon type="integrate" /> Integrated View
              </Link>
              <Link href="/dashboard/audit" className={pathname.startsWith('/dashboard/audit') ? 'active' : ''}>
                <NavIcon type="dashboard" /> Audit Logs
              </Link>
            </div>
          )}
        </nav>

        {/* Cross-portal link */}
        <a href={process.env.NEXT_PUBLIC_M365_PORTAL_URL || 'http://localhost:3000'} className="sidebar-portal-link" target="_blank" rel="noopener noreferrer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          M365 License Portal →
        </a>

        <div className="sidebar-footer">
          <button className="btn btn-outline" style={{ width: '100%', fontSize: '0.8rem', gap: '0.5rem' }} onClick={() => signOut({ callbackUrl: '/' })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
          <div style={{ textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.625rem' }}>
            Maldives Digital Service © 2026
          </div>
        </div>
      </aside>

      <main className="content-area">
        {children}
      </main>
    </div>
  );
}
