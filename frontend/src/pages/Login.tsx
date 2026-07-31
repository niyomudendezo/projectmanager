import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function BrandMark() {
  return (
    <span className="login-brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export default function Login() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      title: 'Create and manage multiple projects',
      text: 'Keep every initiative organized in its own focused workspace.',
      icon: <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 9h18M8 5V3h8v2" /></>,
    },
    {
      title: 'Drag tasks between Kanban columns',
      text: 'Move work from To do to Done with a simple drag and drop.',
      icon: <><rect x="3" y="4" width="7" height="7" rx="1" /><rect x="14" y="13" width="7" height="7" rx="1" /><path d="M10 7h5a3 3 0 013 3v3m-3-2l3 3 3-3" /></>,
    },
    {
      title: 'Keep your work secure and saved',
      text: 'Your account and project data remain protected and persistent.',
      icon: <><path d="M12 3l7 3v5c0 4.7-2.8 8.3-7 10-4.2-1.7-7-5.3-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>,
    },
  ];

  useEffect(() => {
    const timer = window.setInterval(
      () => setActiveFeature((current) => (current + 1) % features.length),
      3500,
    );
    return () => window.clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pp-login-page">
      <header className="pp-login-header">
        <Link className="pp-login-brand" to="/login" aria-label="ProjectManager home">
          <BrandMark />
          <span>Project<span>Manager</span></span>
        </Link>
        <div className="pp-header-help">
          <span>New to the platform?</span>
          <Link to="/register">Create account</Link>
        </div>
      </header>

      <section className="pp-login-main">
        <div className="pp-login-promo">
          <span className="pp-eyebrow">YOUR WORK, ORGANIZED</span>
          <h1>Move projects forward, <em>one task at a time.</em></h1>
          <p className="pp-promo-copy">
            A complete workspace to create projects, organize tasks, and track progress from idea to completion.
          </p>

          <div className="pp-feature-slider" aria-label="Platform features">
            <div className="pp-feature-stage">
              <article key={features[activeFeature].title} className="pp-feature-slide active">
                <span className="pp-feature-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">{features[activeFeature].icon}</svg>
                </span>
                <div>
                  <b>{features[activeFeature].title}</b>
                  <p>{features[activeFeature].text}</p>
                </div>
              </article>
            </div>
            <div className="pp-slider-controls">
              <div className="pp-slider-dots">
                {features.map((feature, index) => (
                  <button
                    key={feature.title}
                    type="button"
                    className={index === activeFeature ? 'active' : ''}
                    onClick={() => setActiveFeature(index)}
                    aria-label={`Show: ${feature.title}`}
                    aria-current={index === activeFeature}
                  />
                ))}
              </div>
              <span>{String(activeFeature + 1).padStart(2, '0')} / 03</span>
            </div>
          </div>

          <div className="pp-product-preview" aria-hidden="true">
            <div className="pp-preview-top">
              <div className="pp-preview-dots"><i /><i /><i /></div>
              <div className="pp-preview-search" />
            </div>
            <div className="pp-preview-body">
              <div className="pp-preview-sidebar">
                <b><BrandMark /> PM</b>
                <i className="active" /><i /><i /><i />
              </div>
              <div className="pp-preview-content">
                <div className="pp-preview-heading"><b>Website Redesign</b><span>+ Add task</span></div>
                <div className="pp-preview-board">
                  <section>
                    <h3><i /> To do <small>2</small></h3>
                    <article><b>Research user needs</b><small>High priority</small></article>
                    <article><b>Create wireframes</b><small>Due tomorrow</small></article>
                  </section>
                  <section>
                    <h3><i /> In progress <small>1</small></h3>
                    <article><b>Build login screen</b><small>In development</small></article>
                  </section>
                  <section>
                    <h3><i /> Done <small>1</small></h3>
                    <article><b>Set up project</b><small>Completed</small></article>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pp-login-panel">
          <div className="pp-login-box">
            <div className="pp-form-heading">
              <span className="pp-mobile-brand"><BrandMark /></span>
              <h2>Welcome back!</h2>
              <p>Sign in to access your project workspace</p>
            </div>

            {error && (
              <div className="pp-login-error" role="alert">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v6m0 4h.01" /></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="pp-login-form">
              <label htmlFor="login-email">Email address</label>
              <div className="pp-input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM4 7l8 6 8-6" /></svg>
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  autoFocus
                />
              </div>

              <div className="pp-password-label">
                <label htmlFor="login-password">Password</label>
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="pp-input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></svg>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="pp-secure-note">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.7-2.8 8.3-7 10-4.2-1.7-7-5.3-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>
                Secure authentication · Your projects stay private
              </div>

              <button type="submit" className="pp-login-button" disabled={loading}>
                {loading && <span className="pp-button-spinner" />}
                {loading ? 'Logging in…' : 'Log in'}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <p className="pp-login-switch">
              Don&apos;t have an account? <Link to="/register">Create one now</Link>
            </p>
            <p className="pp-login-terms">ProjectManager · Complete Kanban project management platform</p>
          </div>
        </div>
      </section>

      <footer className="pp-login-footer">© 2026 ProjectManager · Plan, track, deliver.</footer>
    </main>
  );
}
