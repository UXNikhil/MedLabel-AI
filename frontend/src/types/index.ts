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

export type ProjectStatus = 'draft' | 'in_review' | 'approved' | 'rejected';

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
