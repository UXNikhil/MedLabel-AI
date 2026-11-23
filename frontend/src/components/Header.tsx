import React, { useState } from 'react';
import { ShieldAlert, User, LogOut, CheckCircle2, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const Header: React.FC = () => {
  const { user, signOut, setRole, isLiveSupabase } = useAuth();
  const [fontScale, setFontScale] = useState<'sm' | 'md' | 'lg'>('md');
  const [highContrast, setHighContrast] = useState<boolean>(false);

  const applyFontScale = (scale: 'sm' | 'md' | 'lg') => {
    setFontScale(scale);
    const root = document.documentElement;
    if (scale === 'sm') root.style.setProperty('--font-scale', '0.9');
    else if (scale === 'md') root.style.setProperty('--font-scale', '1');
    else if (scale === 'lg') root.style.setProperty('--font-scale', '1.15');
  };

  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    if (next) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  };

  return (
    <header className="top-header" role="banner">
      <a href="#main-content" className="skip-to-content">Skip to Main Content</a>

      <div className="brand-section">
        <div className="brand-logo-icon" aria-hidden="true">
          <ShieldAlert size={22} />
        </div>
        <div className="brand-text">
          <h1>MedLabel AI</h1>
          <p>Medical Device Regulatory Label Management</p>
        </div>
      </div>

      <div className="header-controls">
        {/* Accessibility Font Controls */}
        <div className="font-scaler" title="Adjust text size" role="group" aria-label="Font size controls">
          <button
            type="button"
            className={fontScale === 'sm' ? 'active' : ''}
            onClick={() => applyFontScale('sm')}
            aria-label="Decrease font size (-A)"
          >
            -A
          </button>
          <button
            type="button"
            className={fontScale === 'md' ? 'active' : ''}
            onClick={() => applyFontScale('md')}
            aria-label="Standard font size (A)"
          >
            A
          </button>
          <button
            type="button"
            className={fontScale === 'lg' ? 'active' : ''}
            onClick={() => applyFontScale('lg')}
            aria-label="Increase font size (A+)"
          >
            A+
          </button>
        </div>

        {/* High Contrast Toggle */}
        <button
          type="button"
          className={`btn btn-secondary ${highContrast ? 'active' : ''}`}
          style={{ padding: '4px 10px', fontSize: '12px' }}
          onClick={toggleHighContrast}
          title="Toggle High Contrast Mode"
        >
          {highContrast ? 'Standard Contrast' : 'High Contrast'}
        </button>

        {/* Database Status Indicator */}
        <div
          title={isLiveSupabase ? "Connected to Supabase PostgreSQL with RLS" : "Local In-Memory Secure Store"}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b' }}
        >
          <Database size={14} color={isLiveSupabase ? '#059669' : '#0d9488'} />
          <span>{isLiveSupabase ? 'Supabase RLS' : 'Local DB Store'}</span>
        </div>

        {/* User Profile & Role Switcher */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{user.fullName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={`role-badge role-${user.role}`}>
                  <User size={12} />
                  {user.role}
                </span>
                <select
                  aria-label="Change role for testing"
                  className="filter-select"
                  style={{ padding: '2px 6px', fontSize: '11px', height: '24px' }}
                  value={user.role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  title="Switch user role for permission testing"
                >
                  <option value="editor">Editor</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-icon"
              onClick={signOut}
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
