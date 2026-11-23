export type UserRole = 'editor' | 'reviewer' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organization: string;
}

export type DestinationMarket = 'India' | 'USA' | 'EU';

export type PackagingLevel = 'primary' | 'secondary' | 'shipper';

export type ProjectStatus = 'draft' | 'in_review' | 'approved' | 'rejected' | 'changes_requested';

export interface Device {
  id: string;
  userId: string;
  name: string;
  modelNumber: string;
  manufacturer: string;
  countryOfOrigin: string; // e.g. "Germany", "USA", "India"
  intendedMarket: DestinationMarket | 'Global';
  importerName?: string;
  importerAddress?: string;
  lotNumber?: string;
  serialNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  storageConditions?: string;
  warningsCautions?: string;
  udiDi?: string; // Unique Device Identifier - Device Identifier
  udiPi?: string; // Unique Device Identifier - Production Identifier
  packagingLevel: PackagingLevel;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface LabelProject {
  id: string;
  userId: string;
  deviceId: string;
  deviceName?: string;
  deviceModel?: string;
  title: string;
  destinationMarket: DestinationMarket;
  packagingLevel: PackagingLevel;
  version: string;
  status: ProjectStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatsData {
  totalDevices: number;
  totalProjects: number;
  importedDevicesCount: number;
  marketDistribution: Record<DestinationMarket, number>;
  statusDistribution: Record<ProjectStatus, number>;
  packagingDistribution: Record<PackagingLevel, number>;
}

export type NavigationTab = 
  | 'overview' 
  | 'devices' 
  | 'projects' 
  | 'label_builder' 
  | 'compliance' 
  | 'compare' 
  | 'review' 
  | 'rules' 
  | 'audit';

// ==============================================================================
// Stage 2 Types
// ==============================================================================

export interface StatutoryRule {
  rule_code: string;
  jurisdiction: string;
  title: string;
  description: string;
  source_reference: string;
  source_url: string;
  applicability: string;
  severity: string;
}

export interface ComplianceCheckFinding {
  rule_code: string;
  title: string;
  source_reference: string;
  source_url: string;
  severity: string;
  status: 'PASS' | 'FAIL' | 'NEEDS_REVIEW' | 'NOT_APPLICABLE';
  finding: string;
  evidence: string;
  ai_advisory?: string;
}

export interface ComplianceSummary {
  destination_market: string;
  device_name?: string;
  country_of_origin?: string;
  is_imported_to_target: boolean;
  total_checks: number;
  passed_checks: number;
  failed_checks: number;
  needs_review_checks: number;
  not_applicable_checks: number;
  overall_status: 'PASS' | 'FAIL' | 'NEEDS_REVIEW';
  disclaimer: string;
}

export interface FieldChange {
  field: string;
  label: string;
  base_value?: string;
  revised_value?: string;
  change_type: 'added' | 'removed' | 'modified' | 'unchanged';
  is_critical: boolean;
}

export interface ComparisonResult {
  base_name: string;
  revised_name: string;
  summary: {
    total_fields_compared: number;
    added_fields: number;
    removed_fields: number;
    modified_fields: number;
    critical_changes_detected: number;
    critical_alerts: string[];
  };
  field_changes: FieldChange[];
  text_diff: string;
}

export interface UploadExtractionData {
  filename: string;
  file_type: string;
  raw_text: string;
  page_count: number;
  proposed_fields: Record<string, any>;
  uncertain_fields: string[];
  extraction_engine: string;
  gemini_status: {
    configured: boolean;
    message: string;
  };
  notes: string;
}

// ==============================================================================
// Stage 3 Types — Formal Review Queue, Approvals & Immutable Audit Logging
// ==============================================================================

export type ReviewDecision = 'approved' | 'rejected' | 'changes_requested';

export interface ReviewItem {
  id: string;
  project_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_email: string;
  decision: ReviewDecision;
  comments: string;
  version_tag: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id?: string;
  actor_email: string;
  actor_name?: string;
  actor_role: UserRole;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

