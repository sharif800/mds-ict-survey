"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.push("/dashboard");
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError("Invalid email or password");
    else router.push("/dashboard");
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--panel-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px', margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, var(--primary), var(--accent-blue))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(20,184,166,0.3)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8" /><path d="M12 17v4" />
              <path d="M7 8h2" /><path d="M7 11h4" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            National <span style={{ color: 'var(--primary)' }}>ICT Survey</span>
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
            Infrastructure Survey & Asset Management Portal
          </p>
        </div>

        {error && (
          <div style={{ padding: '0.625rem 1rem', background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--border-radius-sm)', marginBottom: '1.25rem', fontSize: '0.8125rem', color: 'var(--danger-color)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Office Email</label>
            <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@institution.gov.mv" required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Same credentials as M365 License Portal
          </p>
        </div>

        {/* Cross-portal link */}
        <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--panel-border)' }}>
          <a href={process.env.NEXT_PUBLIC_M365_PORTAL_URL || 'http://localhost:3000'} style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Go to M365 License Portal
          </a>
        </div>
      </div>
    </div>
  );
}
