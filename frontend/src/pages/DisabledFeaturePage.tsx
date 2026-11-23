import React from 'react';
import {
  FileCode2,
  CheckCheck,
  SplitSquareVertical,
  ClipboardCheck,
  BookOpenCheck,
  History,
  Lock,
  ArrowRight
} from 'lucide-react';
import { NavigationTab } from '../types';

interface DisabledFeaturePageProps {
  tab: NavigationTab;
  onNavigateToDevices: () => void;
}

export const DisabledFeaturePage: React.FC<DisabledFeaturePageProps> = ({ tab, onNavigateToDevices }) => {
  const featureConfigs: Record<string, { title: string; stage: string; desc: string; icon: any; roadmap: string[] }> = {
    label_builder: {
      title: 'Label Builder & PDF Extraction',
      stage: 'Stage 2 — Core AI & Validation',
      desc: 'Automated label drafting with PyMuPDF text ingestion and Gemini API structured field extraction. User confirms extracted fields before draft label generation.',
      icon: FileCode2,
      roadmap: [
        'PyMuPDF extraction of manufacturer labels & IFUs',
        'Gemini proposal of structured statutory fields (no hallucinated claims)',
        'Interactive draft label layout builder and prototype-watermarked PDF export'
      ]
    },
    compliance: {
      title: 'Rule-Based Compliance Assistant',
      stage: 'Stage 2 — Core AI & Validation',
      desc: 'Deterministic regulatory checks tailored to destination market (India CDSCO Medical Devices Rules, US FDA 21 CFR Part 801, EU MDR 2017/745).',
      icon: CheckCheck,
      roadmap: [
        'Sourced rules with exact statutory citations and section links',
        'Verification reporting: PASS, FAIL, NEEDS_REVIEW, NOT_APPLICABLE',
        'Strict isolation: AI may explain results but cannot override deterministic checks'
      ]
    },
    compare: {
      title: 'Label Version Comparison & Diff',
      stage: 'Stage 2 — Core AI & Validation',
      desc: 'Side-by-side comparison of old vs revised labels highlighting missing warnings, modified lot codes, and changed importer information.',
      icon: SplitSquareVertical,
      roadmap: [
        'Side-by-side label visual comparison',
        'Field-level text diff with highlighted modifications',
        'Detection of altered regulatory identifiers and warning statements'
      ]
    },
    review: {
      title: 'Review Queue & Approvals',
      stage: 'Stage 3 — Complete Workflow',
      desc: 'Formal reviewer role workflows with comments, approval gates, change requests, and immutable version snapshots.',
      icon: ClipboardCheck,
      roadmap: [
        'Role-enforced review workflows (Editor submits, Reviewer approves)',
        'Threaded line-item regulatory comments',
        'Cryptographic audit approval stamps'
      ]
    },
    rules: {
      title: 'Statutory Rule Library',
      stage: 'Stage 2 — Core AI & Validation',
      desc: 'Official curated rulebook for India CDSCO, US FDA 21 CFR Part 801, and EU MDR 2017/745 with statutory references.',
      icon: BookOpenCheck,
      roadmap: [
        'Curated India CDSCO Medical Devices Rules 2017 catalog',
        'US FDA 21 CFR Part 801 General Device Labeling section map',
        'EU MDR 2017/745 Annex I Chapter III General Safety and Performance Requirements'
      ]
    },
    audit: {
      title: 'Regulatory Audit Log & Traceability',
      stage: 'Stage 3 — Complete Workflow',
      desc: 'Comprehensive immutable audit trail of all device edits, label revisions, compliance check runs, and reviewer signatures.',
      icon: History,
      roadmap: [
        'Tamper-evident chronological activity log',
        'User attribution with role verification',
        'Change-impact assessment when master device parameters change'
      ]
    }
  };

  const current = featureConfigs[tab] || {
    title: 'Future Feature',
    stage: 'Upcoming Stage',
    desc: 'This module is scheduled for future implementation according to the compact PRD.',
    icon: Lock,
    roadmap: []
  };

  const IconComponent = current.icon;

  return (
    <div className="disabled-feature-container">
      <div className="roadmap-badge">
        <Lock size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }} />
        {current.stage}
      </div>

      <div className="disabled-feature-icon">
        <IconComponent size={32} />
      </div>

      <h3>{current.title}</h3>
      <p>{current.desc}</p>

      <div style={{ textAlign: 'left', background: '#f8fafc', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-900)', marginBottom: '8px' }}>
          Planned Implementation Deliverables:
        </div>
        <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
          {current.roadmap.map((item, idx) => (
            <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
          ))}
        </ul>
      </div>

      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
        Currently in <strong>Stage 1: Functional Foundation</strong>. Manage your device inventory and label projects now.
      </div>

      <button type="button" className="btn btn-secondary" onClick={onNavigateToDevices}>
        Manage Device Inventory <ArrowRight size={14} />
      </button>
    </div>
  );
};
