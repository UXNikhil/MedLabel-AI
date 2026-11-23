import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  MessageSquare,
  ShieldAlert,
  Clock,
  Filter,
  Search,
  ExternalLink,
  Lock,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LabelProject, ReviewItem, ProjectStatus } from '../types';
import { MarketBadge } from '../components/MarketBadge';
import { PackagingBadge } from '../components/PackagingBadge';
import { api } from '../lib/api';

export const ReviewQueuePage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<LabelProject[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'changes_requested'>('approved');
  const [comments, setComments] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [projs, revs] = await Promise.all([
        api.listProjects(),
        api.listReviews().catch(() => [])
      ]);
      setProjects(projs);
      setReviews(revs);
      if (projs.length > 0 && !selectedProjectId) {
        // Default select first in_review project if exists, else first project
        const pending = projs.find((p: LabelProject) => p.status === 'in_review');
        setSelectedProjectId(pending ? pending.id : projs[0].id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load review queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const projectReviews = reviews.filter(r => r.project_id === selectedProjectId);

  const isCreator: boolean = Boolean(selectedProject && user && selectedProject.userId === user.id);
  const isReviewerOrAdmin: boolean = Boolean(user && (user.role === 'reviewer' || user.role === 'admin'));

  // Submit Review Decision
  const handleReviewDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !user) return;
    if (!comments.trim()) {
      setErrorMessage('Reviewer comments are required to document the regulatory decision.');
      return;
    }

    if (decision === 'approved' && isCreator) {
      setErrorMessage('Self-approval prohibited: You created this label. Independent reviewer approval is required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await api.submitReviewDecision({
        project_id: selectedProject.id,
        decision,
        comments,
        reviewer_id: user.id,
        reviewer_name: user.fullName,
        reviewer_email: user.email,
        reviewer_role: user.role
      });

      setSuccessMessage(`Decision '${decision.toUpperCase()}' recorded successfully for ${selectedProject.title}.`);
      setComments('');
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record review decision');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Draft to Review
  const handleSubmitForReview = async () => {
    if (!selectedProject || !user) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await api.submitProjectForReview(selectedProject.id, user.id, 'Editor submitted draft for formal review audit.');
      setSuccessMessage(`Project '${selectedProject.title}' submitted to Review Queue.`);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit project for review');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered project list
  const filteredProjects = projects.filter(p => {
    const matchesFilter = filterStatus === 'All' ? true : p.status === filterStatus;
    const matchesSearch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.deviceName && p.deviceName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardCheck size={26} color="var(--primary-700)" />
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-900)', margin: 0 }}>
              Review Queue & Approvals
            </h2>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', margin: 0 }}>
            Regulatory audit and sign-off gate. Reviewers evaluate drafted labels against India CDSCO, USA FDA, and EU MDR standards.
          </p>
        </div>

        {/* User Role Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: isReviewerOrAdmin ? '#ecfdf5' : '#eff6ff',
          border: `1px solid ${isReviewerOrAdmin ? '#a7f3d0' : '#bfdbfe'}`,
          borderRadius: '20px',
          padding: '6px 14px',
          fontSize: '12px',
          fontWeight: 600,
          color: isReviewerOrAdmin ? '#065f46' : '#1e40af'
        }}>
          <UserCheck size={14} />
          <span>Active Role: <strong>{user?.role.toUpperCase()}</strong> ({user?.fullName})</span>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#991b1b',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#065f46',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Layout Split: Left Project List, Right Review Workbench */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
        
        {/* Left Column: Project Selector */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {['All', 'in_review', 'changes_requested', 'approved', 'draft'].map(st => (
              <button
                key={st}
                type="button"
                className={`btn btn-secondary ${filterStatus === st ? 'active' : ''}`}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  background: filterStatus === st ? 'var(--primary-900)' : '#f8fafc',
                  color: filterStatus === st ? '#ffffff' : '#475569',
                  borderColor: filterStatus === st ? 'var(--primary-900)' : '#e2e8f0'
                }}
                onClick={() => setFilterStatus(st)}
              >
                {st === 'All' ? 'All' : st.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '32px', fontSize: '12px' }}
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Project Cards List */}
          <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading review queue...</div>
            ) : filteredProjects.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                No projects found matching criteria.
              </div>
            ) : (
              filteredProjects.map(p => {
                const isSelected = p.id === selectedProjectId;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: `1px solid ${isSelected ? 'var(--primary-600)' : '#e2e8f0'}`,
                      background: isSelected ? 'var(--primary-50)' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-900)' }}>
                        {p.title}
                      </span>
                      <span className={`status-badge status-${p.status}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                      Device: {p.deviceName || 'Linked Medical Device'} ({p.version})
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <MarketBadge market={p.destinationMarket} />
                      <PackagingBadge level={p.packagingLevel} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Review Workbench */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedProject ? (
            <>
              {/* Project Overview Card */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-900)', margin: 0 }}>
                      {selectedProject.title}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Project ID: <code style={{ fontSize: '11px' }}>{selectedProject.id}</code>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`status-badge status-${selectedProject.status}`} style={{ fontSize: '12px', padding: '4px 10px' }}>
                      {selectedProject.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {selectedProject.status === 'approved' && (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#ecfdf5',
                        color: '#065f46',
                        border: '1px solid #a7f3d0',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        <Lock size={12} />
                        IMMUTABLE
                      </span>
                    )}
                  </div>
                </div>

                {/* Metadata Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Destination Market</div>
                    <MarketBadge market={selectedProject.destinationMarket} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Packaging Level</div>
                    <PackagingBadge level={selectedProject.packagingLevel} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Version Tag</div>
                    <strong style={{ fontSize: '13px' }}>{selectedProject.version}</strong>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Created By</div>
                    <span style={{ fontSize: '12px', color: '#334155' }}>
                      {selectedProject.userId === user?.id ? 'You (Current User)' : 'Author User'}
                    </span>
                  </div>
                </div>

                {/* Transition to In Review if currently Draft / Changes Requested */}
                {(selectedProject.status === 'draft' || selectedProject.status === 'changes_requested') && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af' }}>
                        Ready for Regulatory Review?
                      </div>
                      <div style={{ fontSize: '12px', color: '#3b82f6' }}>
                        Submit this draft to the independent reviewer queue for formal verification.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSubmitForReview}
                      disabled={submitting}
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                    >
                      <Send size={14} style={{ marginRight: '6px' }} />
                      Submit for Review
                    </button>
                  </div>
                )}
              </div>

              {/* Review Decision Form (Active for Reviewers & Admins) */}
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-900)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={16} color="var(--primary-700)" />
                  Regulatory Reviewer Evaluation
                </h4>

                {/* Independent Review / Self-Approval Banner */}
                {isCreator && (
                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    fontSize: '12px',
                    color: '#92400e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <ShieldAlert size={16} />
                    <span>
                      <strong>Independent Review Notice:</strong> You created this project. Under regulatory quality standards, label approvals must be performed by an independent reviewer. The 'Approve' action is restricted.
                    </span>
                  </div>
                )}

                {selectedProject.status === 'approved' ? (
                  <div style={{
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    color: '#065f46'
                  }}>
                    <CheckCircle2 size={32} style={{ margin: '0 auto 8px', color: '#059669' }} />
                    <div style={{ fontSize: '15px', fontWeight: 800 }}>This Label Specification is APPROVED</div>
                    <p style={{ fontSize: '12px', marginTop: '4px', color: '#047857' }}>
                      Approved regulatory records are cryptographically stamped and locked as immutable. No further edits or status transitions are allowed for this version.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleReviewDecision}>
                    {/* Decision Selector */}
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label className="form-label">Review Decision</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          border: `2px solid ${decision === 'approved' ? '#059669' : '#e2e8f0'}`,
                          background: decision === 'approved' ? '#ecfdf5' : '#ffffff',
                          borderRadius: '8px',
                          cursor: isCreator ? 'not-allowed' : 'pointer',
                          opacity: isCreator ? 0.6 : 1
                        }}>
                          <input
                            type="radio"
                            name="decision"
                            value="approved"
                            checked={decision === 'approved'}
                            disabled={Boolean(isCreator)}
                            onChange={() => setDecision('approved')}
                          />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#065f46' }}>Approve</div>
                            <div style={{ fontSize: '11px', color: '#059669' }}>Lock as immutable</div>
                          </div>
                        </label>

                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          border: `2px solid ${decision === 'changes_requested' ? '#d97706' : '#e2e8f0'}`,
                          background: decision === 'changes_requested' ? '#fffbeb' : '#ffffff',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="radio"
                            name="decision"
                            value="changes_requested"
                            checked={decision === 'changes_requested'}
                            onChange={() => setDecision('changes_requested')}
                          />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400e' }}>Request Changes</div>
                            <div style={{ fontSize: '11px', color: '#d97706' }}>Return to editor</div>
                          </div>
                        </label>

                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          border: `2px solid ${decision === 'rejected' ? '#dc2626' : '#e2e8f0'}`,
                          background: decision === 'rejected' ? '#fef2f2' : '#ffffff',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="radio"
                            name="decision"
                            value="rejected"
                            checked={decision === 'rejected'}
                            onChange={() => setDecision('rejected')}
                          />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b' }}>Reject</div>
                            <div style={{ fontSize: '11px', color: '#dc2626' }}>Regulatory non-compliance</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Detailed Review Comments */}
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label className="form-label">Reviewer Comments & Justification *</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        required
                        placeholder="Document verified regulatory clauses (e.g. CDSCO Rule 109, FDA 21 CFR 801, EU MDR Annex I), warning labels checked, and specific corrective actions..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting || (decision === 'approved' && isCreator)}
                        style={{
                          background: decision === 'approved' ? '#059669' : (decision === 'rejected' ? '#dc2626' : '#d97706'),
                          borderColor: decision === 'approved' ? '#059669' : (decision === 'rejected' ? '#dc2626' : '#d97706')
                        }}
                      >
                        {submitting ? 'Recording Decision...' : `Submit Review: ${decision.replace('_', ' ').toUpperCase()}`}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Review History Thread */}
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary-900)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} />
                  Regulatory Review History ({projectReviews.length})
                </h4>

                {projectReviews.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', padding: '12px 0' }}>
                    No formal review decisions recorded yet for this project.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {projectReviews.map(r => (
                      <div
                        key={r.id}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          background: '#f8fafc'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-900)' }}>
                              {r.reviewer_name}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>({r.reviewer_email})</span>
                          </div>
                          <span className={`status-badge status-${r.decision}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                            {r.decision.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#334155', margin: '4px 0 6px' }}>
                          "{r.comments}"
                        </p>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {new Date(r.created_at).toLocaleString()} • Version Tag: {r.version_tag}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="card" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <ClipboardCheck size={40} style={{ margin: '0 auto 12px', color: '#94a3b8' }} />
              <div style={{ fontSize: '16px', fontWeight: 700 }}>Select a Label Project</div>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>
                Choose a project from the left queue to inspect regulatory specifications and record review decisions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
