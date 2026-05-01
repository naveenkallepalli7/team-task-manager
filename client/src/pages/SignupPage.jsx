import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Zap, ShieldCheck, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member', adminKey: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.signup(form);
      login(data.token, data.user);
      toast.success('Account created! Welcome aboard 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={22} color="white" />
            </div>
          </div>
          <h1>TaskFlow</h1>
          <p>Create your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-icon-wrapper">
              <User size={16} className="input-icon" />
              <input id="signup-name" className="form-control" type="text" placeholder="John Doe"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-icon-wrapper">
              <Mail size={16} className="input-icon" />
              <input id="signup-email" className="form-control" type="email" placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={16} className="input-icon" />
              <input id="signup-password" className="form-control" type="password" placeholder="Min. 6 characters"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <div className="role-toggle">
              <button type="button" className={form.role === 'member' ? 'active' : ''}
                onClick={() => setForm({ ...form, role: 'member', adminKey: '' })}>
                👤 Member
              </button>
              <button type="button" className={form.role === 'admin' ? 'active' : ''}
                onClick={() => setForm({ ...form, role: 'admin' })}>
                👑 Admin
              </button>
            </div>
          </div>

          {form.role === 'admin' && (
            <>
              {/* Info callout */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(99,102,241,0.08)', borderRadius: 8, marginBottom: 12, border: '1px solid rgba(99,102,241,0.15)' }}>
                <ShieldCheck size={16} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Admin can create projects, assign tasks, and manage members.</span>
              </div>

              {/* Admin Secret Key field */}
              <div className="form-group">
                <label className="form-label">
                  Admin Secret Key <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div className="input-icon-wrapper">
                  <KeyRound size={16} className="input-icon" />
                  <input
                    id="signup-admin-key"
                    className="form-control"
                    type="password"
                    placeholder="Enter admin secret key"
                    value={form.adminKey}
                    onChange={(e) => setForm({ ...form, adminKey: e.target.value })}
                    required
                    autoComplete="off"
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 5 }}>
                  🔒 Obtain this key from your organization administrator.
                </p>
              </div>
            </>
          )}

          <button id="signup-submit" className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating…</> : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.87rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
