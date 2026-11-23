import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const AuthPage: React.FC = () => {
  const { login, signUp, isLiveSupabase, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('editor@medlabel.ai');
  const [fullName, setFullName] = useState<string>('Priya Sharma');
  const [role, setRole] = useState<UserRole>('editor');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      await signUp(email, fullName, role);
    } else {
      await login(email, role);
    }
  };

  const handleQuickDemoLogin = (demoEmail: string, demoName: string, demoRole: UserRole) => {
    if (isSignUp) {
      signUp(demoEmail, demoName, demoRole);
    } else {
      login(demoEmail, demoRole);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--surface-border)',
        boxShadow: 'var(--shadow-lg)',
        padding: '32px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="brand-logo-icon" style={{ margin: '0 auto 12px', width: '48px', height: '48px' }}>
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-900)' }}>
            MedLabel AI Authentication
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Medical Device Label Management Hackathon Web App
          </p>
        </div>

        {/* Demo Fast Login for Evaluators */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '8px' }}>
            ⚡ One-Click Hackathon Role Login
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '6px 4px', justifyContent: 'center' }}
              onClick={() => handleQuickDemoLogin('editor@medlabel.ai', 'Dr. Priya Sharma', 'editor')}
            >
              Editor
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '6px 4px', justifyContent: 'center' }}
              onClick={() => handleQuickDemoLogin('reviewer@medlabel.ai', 'Dr. Marcus Vance', 'reviewer')}
            >
              Reviewer
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '6px 4px', justifyContent: 'center' }}
              onClick={() => handleQuickDemoLogin('admin@medlabel.ai', 'Elena Rostova', 'admin')}
            >
              Admin
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', textAlign: 'center' }}>
            Switches Supabase RLS context and permissions
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Work Email Address</label>
            <input
              type="email"
              className="form-control"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Regulatory Role</label>
            <select
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="editor">Editor — Create and manage devices & labels</option>
              <option value="reviewer">Reviewer — Review and approve submissions</option>
              <option value="admin">Admin — Full regulatory management</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : isSignUp ? 'Create MedLabel Account' : 'Sign In to Workspace'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--primary-600)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setIsSignUp(false)}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Need a new account?{' '}
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--primary-600)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setIsSignUp(true)}
              >
                Create Account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
