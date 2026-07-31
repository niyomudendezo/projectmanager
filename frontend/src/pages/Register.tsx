import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function getStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { level: 1, label: 'Weak', color: '#ef4444' };
  if (score <= 3) return { level: 2, label: 'Good', color: '#f59e0b' };
  return { level: 3, label: 'Strong', color: '#22a861' };
}

function BrandMark() {
  return (
    <span className="login-brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export default function Register() {
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(name, email, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pp-login-page pp-register-page">
      <header className="pp-login-header">
        <Link className="pp-login-brand" to="/login" aria-label="ProjectManager home">
          <BrandMark />
          <span>Project<span>Manager</span></span>
        </Link>
        <div className="pp-header-help">
          <span>Already have an account?</span>
          <Link to="/login">Log in</Link>
        </div>
      </header>

      <section className="pp-login-main">
        <div className="pp-login-promo pp-register-promo">
          <span className="pp-eyebrow">START BUILDING TODAY</span>
          <h1>Your projects deserve a <em>clear path forward.</em></h1>
          <p className="pp-promo-copy">
            Create your workspace and turn complex projects into simple, actionable tasks.
          </p>

          <div className="pp-register-steps">
            <div><span>1</span><p><b>Create your account</b><small>Set up your secure workspace in seconds</small></p></div>
            <div><span>2</span><p><b>Add your first project</b><small>Organize work into clear Kanban columns</small></p></div>
            <div><span>3</span><p><b>Start moving tasks</b><small>Drag work from “To do” all the way to “Done”</small></p></div>
          </div>

          <div className="pp-register-quote">
            <div className="pp-quote-mark">“</div>
            <p>A focused workspace for planning, tracking, and delivering work without the clutter.</p>
            <div className="pp-quote-meta">
              <span>PM</span>
              <div><b>ProjectManager</b><small>Complete Kanban platform</small></div>
            </div>
          </div>
        </div>

        <div className="pp-login-panel pp-register-panel">
          <div className="pp-login-box">
            <div className="pp-form-heading">
              <h2>Create your account</h2>
              <p>Start organizing your projects in one workspace</p>
            </div>

            {success && (
              <div className="pp-register-success" role="status">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></svg>
                Account created! Taking you to login…
              </div>
            )}
            {error && (
              <div className="pp-login-error" role="alert">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v6m0 4h.01" /></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="pp-login-form">
              <label htmlFor="register-name">Full name</label>
              <div className="pp-input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c.8-5 3.5-7 8-7s7.2 2 8 7" /></svg>
                <input
                  id="register-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  autoFocus
                />
              </div>

              <label className="pp-register-label" htmlFor="register-email">Email address</label>
              <div className="pp-input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM4 7l8 6 8-6" /></svg>
                <input
                  id="register-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="pp-password-label pp-register-label">
                <label htmlFor="register-password">Password</label>
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="pp-input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></svg>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <div className="pp-password-strength" aria-live="polite">
                <div>
                  {[1, 2, 3].map((bar) => (
                    <span key={bar} style={{ background: bar <= strength.level ? strength.color : '#e4e9f0' }} />
                  ))}
                </div>
                <small style={{ color: strength.color }}>{strength.label || 'Use 6+ characters'}</small>
              </div>

              <button type="submit" className="pp-login-button pp-register-button" disabled={loading || success}>
                {(loading || success) && <span className="pp-button-spinner" />}
                {success ? 'Account created' : loading ? 'Creating account…' : 'Create account'}
                {!loading && !success && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <p className="pp-login-switch">
              Already registered? <Link to="/login">Log in to your workspace</Link>
            </p>
            <div className="pp-register-security">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.7-2.8 8.3-7 10-4.2-1.7-7-5.3-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>
              Secure registration · Your data stays private
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
