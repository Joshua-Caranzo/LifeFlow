"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import lifeflow from "../app/LifeFlow1.png";

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ password }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.ok) {
        router.push("/protected");
      } else {
        setError(data.error || "Invalid password");
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lf-page {
          font-family: 'DM Sans', sans-serif;
          background: linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #dbeafe 100%);
          min-height: 100vh;
          position: relative;
        }

        /* ── Decorative blobs ── */
        .lf-blob {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .lf-blob-1 {
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(191,219,254,0.6) 0%, transparent 70%);
          top: -250px; left: -200px;
        }
        .lf-blob-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(147,197,253,0.4) 0%, transparent 70%);
          bottom: -180px; right: -120px;
        }
        .lf-blob-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
          top: 45%; left: 8%;
        }
        .lf-blob-4 {
          width: 250px; height: 250px;
          background: radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%);
          top: 20%; right: 15%;
        }

        /* ── Nav ── */
        .lf-nav {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.6rem 3rem;
          opacity: 0;
          transform: translateY(-10px);
          transition: opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s;
        }
        .lf-nav.lf-in { opacity: 1; transform: translateY(0); }

        .lf-logomark {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .lf-brand {
          font-family: 'Playfair Display', serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: #1e3a8a;
          letter-spacing: 0.01em;
        }
        .lf-brand span { color: #2563eb; }

        .lf-nav-pill {
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(37,99,235,0.12);
          border-radius: 40px;
          padding: 0.45rem 1.1rem;
          font-size: 0.78rem;
          font-weight: 500;
          color: #2563eb;
          backdrop-filter: blur(8px);
          letter-spacing: 0.03em;
        }

        /* ── Main layout ── */
        .lf-main {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          align-items: center;
          padding: 2rem 3rem 4rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        @media (max-width: 900px) {
          .lf-main { grid-template-columns: 1fr; gap: 3rem; padding: 2rem 1.5rem 4rem; }
          .lf-nav { padding: 1.4rem 1.5rem; }
          .lf-hero { text-align: center; }
          .lf-features { justify-content: center; }
          .lf-feature { text-align: left; }
        }

        /* ── Hero / left col ── */
        .lf-hero {
          padding-right: 3rem;
          opacity: 0;
          transform: translateX(-20px);
          transition: opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s;
        }
        .lf-hero.lf-in { opacity: 1; transform: translateX(0); }

        @media (max-width: 900px) {
          .lf-hero { padding-right: 0; }
        }

        .lf-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(37,99,235,0.08);
          border: 1px solid rgba(37,99,235,0.18);
          border-radius: 30px;
          padding: 0.35rem 0.9rem;
          font-size: 0.72rem;
          font-weight: 500;
          color: #2563eb;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }
        .lf-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #2563eb;
          animation: lf-pulse 2s ease infinite;
        }

        @keyframes lf-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .lf-headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.4rem, 4vw, 3.4rem);
          font-weight: 700;
          color: #1e3a8a;
          line-height: 1.12;
          letter-spacing: -0.03em;
          margin-bottom: 1.2rem;
        }
        .lf-headline em {
          font-style: italic;
          color: #2563eb;
          font-weight: 500;
        }

        .lf-desc {
          font-size: 1rem;
          color: #475569;
          font-weight: 300;
          line-height: 1.7;
          max-width: 440px;
          margin-bottom: 2.5rem;
        }

        /* ── Feature pills ── */
        .lf-features {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 2.8rem;
        }
        .lf-feature {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.75);
          border: 1px solid rgba(37,99,235,0.1);
          border-radius: 10px;
          padding: 0.55rem 1rem;
          backdrop-filter: blur(6px);
          box-shadow: 0 2px 8px rgba(37,99,235,0.06);
        }
        .lf-feature-icon {
          width: 28px; height: 28px;
          border-radius: 7px;
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .lf-feature-icon svg { width: 14px; height: 14px; color: #2563eb; }
        .lf-feature-text {
          font-size: 0.8rem;
          font-weight: 500;
          color: #1e3a8a;
        }

        /* ── Stats row ── */
        .lf-stats {
          display: flex;
          gap: 2rem;
        }
        .lf-stat-val {
          font-family: 'Playfair Display', serif;
          font-size: 1.7rem;
          font-weight: 700;
          color: #1e3a8a;
          line-height: 1;
        }
        .lf-stat-label {
          font-size: 0.72rem;
          color: #94a3b8;
          font-weight: 400;
          margin-top: 3px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* ── Right col / login ── */
        .lf-right {
          display: flex;
          flex-direction: column;
          align-items: center;
          opacity: 0;
          transform: translateX(20px);
          transition: opacity 0.7s ease 0.35s, transform 0.7s ease 0.35s;
        }
        .lf-right.lf-in { opacity: 1; transform: translateX(0); }

        .lf-login-wrap {
          width: 100%;
          max-width: 380px;
        }

        .lf-login-eyebrow {
          text-align: center;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #93c5fd;
          margin-bottom: 1rem;
        }

        .lf-form-card {
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(37,99,235,0.1);
          border-radius: 22px;
          padding: 2.2rem 2rem 2rem;
          box-shadow:
            0 2px 4px rgba(0,0,0,0.03),
            0 10px 40px rgba(37,99,235,0.11),
            0 30px 80px rgba(37,99,235,0.07);
          backdrop-filter: blur(16px);
          position: relative;
          overflow: hidden;
        }
        .lf-form-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #93c5fd 0%, #2563eb 50%, #93c5fd 100%);
        }

        .lf-card-heading {
          font-family: 'Playfair Display', serif;
          font-size: 1.55rem;
          font-weight: 700;
          color: #1e3a8a;
          text-align: center;
          margin-bottom: 0.3rem;
        }
        .lf-card-sub {
          font-size: 0.82rem;
          color: #94a3b8;
          font-weight: 300;
          text-align: center;
          margin-bottom: 1.8rem;
          line-height: 1.5;
        }

        .lf-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #3b82f6;
          margin-bottom: 0.45rem;
        }

        .lf-input-wrap {
          position: relative;
          margin-bottom: 1.4rem;
        }
        .lf-input-wrap input {
          width: 100%;
          background: #f8faff;
          border: 1.5px solid rgba(37,99,235,0.15);
          border-radius: 11px;
          padding: 0.85rem 1rem 0.85rem 2.9rem;
          color: #1e3a8a;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 400;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .lf-input-wrap input:focus {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
        }
        .lf-input-wrap input::placeholder { color: #bfdbfe; }
        .lf-input-icon {
          position: absolute;
          left: 0.95rem;
          top: 50%;
          transform: translateY(-50%);
          color: #93c5fd;
          pointer-events: none;
        }

        .lf-error {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.82rem;
          color: #dc2626;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 9px;
          padding: 0.6rem 0.9rem;
          margin-bottom: 1.2rem;
        }

        .lf-btn {
          width: 100%;
          padding: 0.9rem;
          border-radius: 11px;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          box-shadow: 0 4px 20px rgba(37,99,235,0.35), 0 1px 0 rgba(255,255,255,0.1) inset;
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          position: relative;
          overflow: hidden;
        }
        .lf-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent 60%);
          pointer-events: none;
        }
        .lf-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(37,99,235,0.45);
        }
        .lf-btn:active:not(:disabled) { transform: translateY(0); }
        .lf-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .lf-btn-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        @keyframes lf-spin { to { transform: rotate(360deg); } }
        .lf-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: lf-spin 0.7s linear infinite;
        }

        .lf-secure {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          margin-top: 1.2rem;
          font-size: 0.72rem;
          color: #94a3b8;
        }

        /* ── Divider ── */
        .lf-divider {
          width: 1px;
          height: 60%;
          background: linear-gradient(to bottom, transparent, rgba(37,99,235,0.12), transparent);
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }
        @media (max-width: 900px) { .lf-divider { display: none; } }

        /* ── Footer ── */
        .lf-footer-bar {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.2rem 3rem 2rem;
          font-size: 0.72rem;
          color: #cbd5e1;
          gap: 1.5rem;
        }
        .lf-footer-bar span { color: #e2e8f0; }
      `}</style>

      <div className={cn("lf-page", className)} {...props}>
        {/* Blobs */}
        <div className="lf-blob lf-blob-1" />
        <div className="lf-blob lf-blob-2" />
        <div className="lf-blob lf-blob-3" />
        <div className="lf-blob lf-blob-4" />

        {/* Nav */}
        <nav className={`lf-nav${mounted ? " lf-in" : ""}`}>
          <Link href="/" className="lf-logomark">
            <Image src={lifeflow} alt="LifeFlow logo" width={34} height={34} priority />
            <span className="lf-brand">Life<span>Flow</span></span>
          </Link>
          <span className="lf-nav-pill">Personal Finance</span>
        </nav>

        {/* Vertical divider between columns */}
        <div className="lf-divider" />

        {/* Main grid */}
        <main className="lf-main">

          {/* ── Left: Hero ── */}
          <section className={`lf-hero${mounted ? " lf-in" : ""}`}>
            <div className="lf-badge">
              <span className="lf-badge-dot" />
              Your savings, simplified
            </div>

            <h1 className="lf-headline">
              Money that flows<br />
              <em>with your life</em>
            </h1>

            <p className="lf-desc">
              LifeFlow gives you a calm, clear view of your financial health — 
              tracking savings goals, spending patterns, and cash flow in one 
              beautifully simple dashboard.
            </p>

            <div className="lf-features">
              {[
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  ),
                  label: "Smart savings goals",
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                  ),
                  label: "Live cash flow tracking",
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 20V10M12 20V4M6 20v-6"/>
                    </svg>
                  ),
                  label: "Spending insights",
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                    </svg>
                  ),
                  label: "Monthly forecasts",
                },
              ].map(({ icon, label }) => (
                <div className="lf-feature" key={label}>
                  <span className="lf-feature-icon">{icon}</span>
                  <span className="lf-feature-text">{label}</span>
                </div>
              ))}
            </div>

            <div className="lf-stats">
              {[
                { val: "₱2.4M", label: "Avg. saved" },
                { val: "98%", label: "Uptime" },
                { val: "12k+", label: "Users" },
              ].map(({ val, label }) => (
                <div key={label}>
                  <div className="lf-stat-val">{val}</div>
                  <div className="lf-stat-label">{label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Right: Login ── */}
          <section className={`lf-right${mounted ? " lf-in" : ""}`}>
            <div className="lf-login-wrap">
              <p className="lf-login-eyebrow">Secure access</p>

              <div className="lf-form-card">
                <h2 className="lf-card-heading">Welcome back</h2>
                <p className="lf-card-sub">Enter your password to access<br />your savings dashboard</p>

                <form onSubmit={handleLogin}>
                  <label htmlFor="password" className="lf-label">Password</label>
                  <div className="lf-input-wrap">
                    <span className="lf-input-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                    <input
                      id="password"
                      type="password"
                      required
                      autoFocus
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="lf-error">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {error}
                    </div>
                  )}

                  <button type="submit" className="lf-btn" disabled={isLoading}>
                    <span className="lf-btn-inner">
                      {isLoading ? (
                        <>
                          <span className="lf-spinner" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign in to dashboard
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </>
                      )}
                    </span>
                  </button>
                </form>

                <div className="lf-secure">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  End-to-end encrypted
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="lf-footer-bar">
          <span>© 2025 LifeFlow</span>
          <span>·</span>
          Privacy
          <span>·</span>
          Terms
        </footer>
      </div>
    </>
  );
}