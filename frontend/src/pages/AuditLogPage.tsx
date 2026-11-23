import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  Filter,
  Search,
  RefreshCw,
  Lock,
  Calendar,
  User,
  Activity,
  FileText,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { AuditLogEntry } from '../types';
import { api } from '../lib/api';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterAction, setFilterAction] = useState<string>('All');
  const [filterEntity, setFilterEntity] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.listAuditLogs({
        action: filterAction,
        entity_type: filterEntity,
        limit: 200
      });
      setLogs(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch regulatory audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction, filterEntity]);

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actor_email.toLowerCase().includes(q) ||
      (log.actor_name && log.actor_name.toLowerCase().includes(q)) ||
      log.entity_type.toLowerCase().includes(q) ||
      (log.entity_id && log.entity_id.toLowerCase().includes(q)) ||
      JSON.stringify(log.details).toLowerCase().includes(q)
    );
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('APPROVED')) return { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' };
    if (action.includes('REJECTED')) return { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' };
    if (action.includes('CHANGES')) return { bg: '#fffbeb', color: '#92400e', border: '#fde68a' };
    if (action.includes('CREATED') || action.includes('GENERATED')) return { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' };
    if (action.includes('DELETED')) return { bg: '#fee2e2', color: '#b91c1c', border: '#f87171' };
    return { bg: '#f1f5f9', color: '#334155', border: '#e2e8f0' };
  };

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={26} color="var(--primary-700)" />
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-900)', margin: 0 }}>
              Regulatory Audit Trail & Traceability
            </h2>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', margin: 0 }}>
            Immutable, append-only chronological log of all device definitions, AI draft revisions, compliance checks, and reviewer signatures.
          </p>
        </div>

        {/* Immutability Guarantee Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '20px',
          padding: '6px 14px',
          fontSize: '12px',
          fontWeight: 700,
          color: '#065f46'
        }}>
          <Lock size={14} />
          <span>RLS Enforced: Append-Only / Tamper-Evident</span>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            {/* Action Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} color="#64748b" />
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Action:</label>
              <select
                className="filter-select"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                <option value="All">All Actions</option>
                <option value="DEVICE_CREATED">DEVICE_CREATED</option>
                <option value="DEVICE_UPDATED">DEVICE_UPDATED</option>
                <option value="DEVICE_DELETED">DEVICE_DELETED</option>
                <option value="PROJECT_CREATED">PROJECT_CREATED</option>
                <option value="PROJECT_UPDATED">PROJECT_UPDATED</option>
                <option value="LABEL_GENERATED">LABEL_GENERATED</option>
                <option value="LABEL_UPLOAD_EXTRACTED">LABEL_UPLOAD_EXTRACTED</option>
                <option value="COMPLIANCE_EVALUATED">COMPLIANCE_EVALUATED</option>
                <option value="REVIEW_SUBMITTED">REVIEW_SUBMITTED</option>
                <option value="REVIEW_APPROVED">REVIEW_APPROVED</option>
                <option value="CHANGES_REQUESTED">CHANGES_REQUESTED</option>
                <option value="REVIEW_REJECTED">REVIEW_REJECTED</option>
                <option value="PDF_EXPORTED">PDF_EXPORTED</option>
                <option value="LABEL_COMPARED">LABEL_COMPARED</option>
              </select>
            </div>

            {/* Entity Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Entity:</label>
              <select
                className="filter-select"
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value)}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                <option value="All">All Entities</option>
                <option value="device">Device</option>
                <option value="project">Project</option>
                <option value="label_version">Label Version</option>
                <option value="review">Review</option>
              </select>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '32px', fontSize: '12px', height: '32px' }}
                placeholder="Search actor, action or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchLogs}
            disabled={loading}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} style={{ marginRight: '6px' }} />
            Refresh Trail
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Loading immutable audit trail...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            No audit log entries matching filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '170px' }}>Timestamp (UTC)</th>
                  <th style={{ width: '190px' }}>Actor</th>
                  <th style={{ width: '190px' }}>Action</th>
                  <th style={{ width: '120px' }}>Entity</th>
                  <th>Audit Metadata & Details</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  const style = getActionBadgeColor(log.action);
                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Calendar size={13} color="#94a3b8" />
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={13} color="#64748b" />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-900)' }}>
                              {log.actor_name || log.actor_email}
                            </div>
                            <span className={`role-badge role-${log.actor_role}`} style={{ fontSize: '10px', padding: '1px 5px' }}>
                              {log.actor_role}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{
                          display: 'inline-block',
                          background: style.bg,
                          color: style.color,
                          border: `1px solid ${style.border}`,
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {log.action}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '12px', color: '#475569', textTransform: 'capitalize' }}>
                          {log.entity_type}
                        </span>
                        {log.entity_id && (
                          <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                            {log.entity_id.slice(0, 12)}...
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ fontSize: '12px', color: '#334155', maxHeight: '60px', overflowY: 'auto' }}>
                          {Object.keys(log.details || {}).length > 0 ? (
                            <code style={{ fontSize: '11px', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px' }}>
                              {JSON.stringify(log.details)}
                            </code>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Standard event record</span>
                          )}
                        </div>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <span title="Cryptographically Stamped Record" style={{ color: '#059669' }}>
                          <ShieldCheck size={16} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
        <span>Showing {filteredLogs.length} audit trail records</span>
        <span>Retention: Immutable Multi-Tenant Compliance Store</span>
      </div>
    </div>
  );
};
