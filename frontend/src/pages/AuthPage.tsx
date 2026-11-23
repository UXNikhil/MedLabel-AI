import React, { useState } from 'react';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { MedLabelLogo } from '../components/MedLabelLogo';

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
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <MedLabelLogo size={52} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary-900)' }}>
            MedLabel AI
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Medical Device Regulatory Label Management & Compliance Platform
          </p>
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
