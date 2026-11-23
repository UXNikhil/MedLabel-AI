import React, { useState, useEffect } from 'react';
import { BookOpen, Search, ExternalLink, ShieldCheck, Filter, Globe } from 'lucide-react';
import { api } from '../lib/api';
import { StatutoryRule } from '../types';

export const RuleLibraryPage: React.FC = () => {
  const [rules, setRules] = useState<StatutoryRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    api.getRules().then(data => {
      setRules(data);
      setLoading(false);
    });
  }, []);

  const filteredRules = rules.filter(r => {
    const matchJ = selectedJurisdiction === 'All' || r.jurisdiction === selectedJurisdiction;
    const q = searchQuery.toLowerCase();
    const matchQ = r.title.toLowerCase().includes(q) ||
      r.rule_code.toLowerCase().includes(q) ||
      r.source_reference.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q);
    return matchJ && matchQ;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Statutory Rule Library</h2>
          <p>Curated statutory labeling regulations for India CDSCO, US FDA 21 CFR 801, and EU MDR 2017/745 with exact statutory citations</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="section-card" style={{ marginBottom: '20px' }}>
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search statutory rules by code, regulation section, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="#64748b" />
            <select
              aria-label="Filter rules by jurisdiction"
              className="filter-select"
              value={selectedJurisdiction}
              onChange={(e) => setSelectedJurisdiction(e.target.value)}
            >
              <option value="All">All Jurisdictions</option>
              <option value="India">India (CDSCO Medical Devices Rules)</option>
              <option value="USA">USA (FDA 21 CFR Part 801)</option>
              <option value="EU">EU (MDR 2017/745 Annex I)</option>
            </select>
          </div>
        </div>

        {/* Notice on statutory sourcing */}
        <div style={{ fontSize: '12px', color: '#64748b', background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <strong>Statutory Accuracy Policy:</strong> Rules are derived strictly from official regulatory publications (CDSCO MDR 2017 Gazette Notification, US eCFR Title 21, EUR-Lex MDR 2017/745). Antigravity does not fabricate regulations or treat proprietary ISO standards as free complete rulebooks.
        </div>
      </div>

      {/* Rules Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
        {filteredRules.map(r => (
          <div
            key={r.rule_code}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: 'var(--primary-900)',
                  background: '#f1f5f9',
                  padding: '3px 8px',
                  borderRadius: '4px'
                }}>
                  {r.rule_code}
                </span>

                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  background: r.jurisdiction === 'India' ? '#fffbeb' : (r.jurisdiction === 'USA' ? '#eff6ff' : '#ecfdf5'),
                  color: r.jurisdiction === 'India' ? '#d97706' : (r.jurisdiction === 'USA' ? '#2563eb' : '#059669')
                }}>
                  {r.jurisdiction}
                </span>
              </div>

              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                {r.title}
              </h4>

              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '14px' }}>
                {r.description}
              </p>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                <strong>Statutory Citation:</strong> {r.source_reference}
              </div>

              <a
                href={r.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  color: 'var(--primary-600)',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                Inspect Official Government Gazette <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
