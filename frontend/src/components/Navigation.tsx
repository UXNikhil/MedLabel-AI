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

      {/* Upcoming Modules per Stage Constraints */}
      <button
        type="button"
        className={`nav-tab ${currentTab === 'label_builder' ? 'active' : ''}`}
        onClick={() => onSelectTab('label_builder')}
        title="Automated label drafting with PDF extraction unlocks in Stage 2"
      >
        <FileCode2 size={16} />
        Label Builder
        <span className="stage-tag">Stage 2</span>
      </button>

      <button
        type="button"
        className={`nav-tab ${currentTab === 'compliance' ? 'active' : ''}`}
        onClick={() => onSelectTab('compliance')}
        title="Deterministic statutory checks for CDSCO, FDA, EU MDR unlock in Stage 2"
      >
        <CheckCheck size={16} />
        Compliance Checks
        <span className="stage-tag">Stage 2</span>
      </button>

      <button
        type="button"
        className={`nav-tab ${currentTab === 'compare' ? 'active' : ''}`}
        onClick={() => onSelectTab('compare')}
        title="Side-by-side field diff and version compare unlock in Stage 2"
      >
        <SplitSquareVertical size={16} />
        Compare
        <span className="stage-tag">Stage 2</span>
      </button>

      <button
        type="button"
        className={`nav-tab ${currentTab === 'rules' ? 'active' : ''}`}
        onClick={() => onSelectTab('rules')}
        title="Curated statutory rulebook library unlocks in Stage 2"
      >
        <BookOpenCheck size={16} />
        Rule Library
        <span className="stage-tag">Stage 2</span>
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
