import React from 'react';
import {
  LayoutDashboard,
  Stethoscope,
  Tag,
  FileCode2,
  CheckCheck,
  SplitSquareVertical,
  ClipboardCheck,
  BookOpenCheck,
  History,
  Lock
} from 'lucide-react';
import { NavigationTab } from '../types';

interface NavigationProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  return (
    <nav className="nav-bar" aria-label="Main Navigation">
      <button
        type="button"
        className={`nav-tab ${currentTab === 'overview' ? 'active' : ''}`}
        onClick={() => onSelectTab('overview')}
      >
        <LayoutDashboard size={16} />
        Overview
      </button>

      <button
        type="button"
        className={`nav-tab ${currentTab === 'devices' ? 'active' : ''}`}
        onClick={() => onSelectTab('devices')}
      >
        <Stethoscope size={16} />
        Medical Devices
      </button>

      <button
        type="button"
        className={`nav-tab ${currentTab === 'projects' ? 'active' : ''}`}
        onClick={() => onSelectTab('projects')}
      >
        <Tag size={16} />
        Label Projects
      </button>

      {/* Stage 2 Active Modules */}
      <button
        type="button"
        className={`nav-tab ${currentTab === 'label_builder' ? 'active' : ''}`}
        onClick={() => onSelectTab('label_builder')}
        title="PDF/Image Ingestion & AI Label Draft Generator"
      >
        <FileCode2 size={16} />
        Label Builder
      </button>

      <button
        type="button"
        className={`nav-tab ${currentTab === 'compliance' ? 'active' : ''}`}
        onClick={() => onSelectTab('compliance')}
        title="Multinational Deterministic Compliance Engine for CDSCO, FDA, EU MDR"
      >
        <CheckCheck size={16} />
        Compliance Checks
      </button>

      <button
        type="button"
        className={`nav-tab ${currentTab === 'compare' ? 'active' : ''}`}
        onClick={() => onSelectTab('compare')}
        title="Side-by-side field diff and unified text comparison"
      >
        <SplitSquareVertical size={16} />
        Compare
      </button>

      <button
        type="button"
        className={`nav-tab ${currentTab === 'rules' ? 'active' : ''}`}
        onClick={() => onSelectTab('rules')}
        title="Curated statutory rulebook library"
      >
        <BookOpenCheck size={16} />
        Rule Library
      </button>

      {/* Stage 3 Modules: Locked per PRD constraints */}
      <button
        type="button"
        className={`nav-tab ${currentTab === 'review' ? 'active' : ''}`}
        onClick={() => onSelectTab('review')}
        title="Reviewer approval workflow and comments unlock in Stage 3"
      >
        <ClipboardCheck size={16} />
        Review Queue
        <span className="stage-tag">Stage 3</span>
      </button>

      <button
        type="button"
        className={`nav-tab ${currentTab === 'audit' ? 'active' : ''}`}
        onClick={() => onSelectTab('audit')}
        title="Immutable version snapshots and traceability log unlock in Stage 3"
      >
        <History size={16} />
        Audit Log
        <span className="stage-tag">Stage 3</span>
      </button>
    </nav>
  );
};
