import React from 'react';
import { PackagingLevel, ProjectStatus } from '../types';

export const PackagingBadge: React.FC<{ level: PackagingLevel }> = ({ level }) => {
  const labels: Record<PackagingLevel, string> = {
    primary: 'Primary (Blister/Vial)',
    secondary: 'Secondary (Carton/Box)',
    shipper: 'Shipper (Case/Bulk)'
  };

  return (
    <span style={{
      fontSize: '11px',
      fontWeight: 600,
      background: '#f1f5f9',
      color: '#334155',
      padding: '3px 8px',
      borderRadius: '4px',
      border: '1px solid #e2e8f0'
    }}>
      {labels[level] || level}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const labels: Record<ProjectStatus, string> = {
    draft: 'Draft',
    in_review: 'In Review',
    approved: 'Approved',
    rejected: 'Changes Requested'
  };

  return (
    <span className={`badge badge-${status}`}>
      {labels[status] || status}
    </span>
  );
};
