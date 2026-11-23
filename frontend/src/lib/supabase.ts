import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Device, LabelProject, StatsData } from '../types';

// Read environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isLiveSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  supabaseUrl.startsWith('https://')
);

export const supabase: SupabaseClient | null = isLiveSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==============================================================================
// In-Memory Local Demo Store
// Provides instant out-of-the-box functionality with PRD-specified initial data
// (Germany -> India imported pacemaker, US orthopedic plate, EU diagnostic cartridge)
// ==============================================================================

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

const INITIAL_DEVICES: Device[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    userId: DEMO_USER_ID,
    name: 'CardioPulse Dual-Chamber Pacemaker',
    modelNumber: 'CP-420-X',
    manufacturer: 'Berlin MedTech AG (Berlin, Germany)',
    countryOfOrigin: 'Germany',
    intendedMarket: 'India',
    importerName: 'Arogya MedTech India Private Limited',
    importerAddress: 'Plot 42, Okhla Industrial Area Phase III, New Delhi 110020, India (CDSCO Lic: IMP/MD/2024/00421)',
    lotNumber: 'LOT-2024-GER01',
    serialNumber: 'SN-8849201',
    manufacturingDate: '2024-03-15',
    expiryDate: '2029-03-14',
    storageConditions: 'Store between 5°C and 25°C in dry conditions',
    warningsCautions: 'MR Unsafe unless programmed. Contains lithium-iodine power source. Single use only.',
    udiDi: '(01)04012345678901',
    udiPi: '(17)290314(10)LOT-2024-GER01(21)SN-8849201',
    packagingLevel: 'primary',
    language: 'en',
    createdAt: '2024-03-15T09:00:00Z',
    updatedAt: '2024-03-15T09:00:00Z'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    userId: DEMO_USER_ID,
    name: 'TitanFix Femoral Compression Plate System',
    modelNumber: 'TF-PLATE-8H',
    manufacturer: 'OrthoBiome Inc. (Memphis, TN, USA)',
    countryOfOrigin: 'USA',
    intendedMarket: 'USA',
    importerName: '',
    importerAddress: '',
    lotNumber: 'LOT-US-9912',
    serialNumber: 'SN-55219',
    manufacturingDate: '2024-06-01',
    expiryDate: '2029-05-31',
    storageConditions: 'Store at ambient room temperature 15°C to 30°C',
    warningsCautions: 'Rx Only. Caution: Federal law restricts this device to sale by or on the order of a physician.',
    udiDi: '(01)00840123456784',
    udiPi: '(17)290531(10)LOT-US-9912',
    packagingLevel: 'secondary',
    language: 'en',
    createdAt: '2024-06-01T10:30:00Z',
    updatedAt: '2024-06-01T10:30:00Z'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    userId: DEMO_USER_ID,
    name: 'HemoSense Point-of-Care Coagulation Cartridge',
    modelNumber: 'HS-POC-100',
    manufacturer: 'BioDiagnostics SAS (Lyon, France)',
    countryOfOrigin: 'France',
    intendedMarket: 'EU',
    importerName: '',
    importerAddress: '',
    lotNumber: 'LOT-EU-3301',
    serialNumber: 'SN-POC-771',
    manufacturingDate: '2024-09-10',
    expiryDate: '2025-09-09',
    storageConditions: 'Refrigerated storage required: 2°C to 8°C. Do not freeze.',
    warningsCautions: 'In Vitro Diagnostic Medical Device. For professional healthcare use only. Single use.',
    udiDi: '(01)03701234567895',
    udiPi: '(17)250909(10)LOT-EU-3301',
    packagingLevel: 'primary',
    language: 'en',
    createdAt: '2024-09-10T14:15:00Z',
    updatedAt: '2024-09-10T14:15:00Z'
  }
];

const INITIAL_PROJECTS: LabelProject[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    userId: DEMO_USER_ID,
    deviceId: '11111111-1111-1111-1111-111111111111',
    deviceName: 'CardioPulse Dual-Chamber Pacemaker',
    deviceModel: 'CP-420-X',
    title: 'CardioPulse CDSCO Primary Blister Label',
    destinationMarket: 'India',
    packagingLevel: 'primary',
    version: 'v1.0-draft',
    status: 'draft',
    notes: 'Initial draft for India destination market. Importer Arogya MedTech information and CDSCO licence format required.',
    createdAt: '2024-03-15T11:00:00Z',
    updatedAt: '2024-03-15T11:00:00Z'
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    userId: DEMO_USER_ID,
    deviceId: '22222222-2222-2222-2222-222222222222',
    deviceName: 'TitanFix Femoral Compression Plate System',
    deviceModel: 'TF-PLATE-8H',
    title: 'TitanFix FDA Outer Carton Secondary Label',
    destinationMarket: 'USA',
    packagingLevel: 'secondary',
    version: 'v1.0-draft',
    status: 'in_review',
    notes: 'FDA 21 CFR 801 Rx Only warning and English language compliance verified.',
    createdAt: '2024-06-01T12:00:00Z',
    updatedAt: '2024-06-01T12:00:00Z'
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    userId: DEMO_USER_ID,
    deviceId: '33333333-3333-3333-3333-333333333333',
    deviceName: 'HemoSense Point-of-Care Coagulation Cartridge',
    deviceModel: 'HS-POC-100',
    title: 'HemoSense EU MDR Sterile Barrier Label',
    destinationMarket: 'EU',
    packagingLevel: 'primary',
    version: 'v1.0-draft',
    status: 'draft',
    notes: 'Sterile barrier packaging requirements and EU IVDR temperature indicator labels.',
    createdAt: '2024-09-10T16:00:00Z',
    updatedAt: '2024-09-10T16:00:00Z'
  }
];

// Persistent local storage sync
const STORAGE_KEY_DEVICES = 'medlabel_demo_devices_v1';
const STORAGE_KEY_PROJECTS = 'medlabel_demo_projects_v1';

function getStoredDevices(): Device[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEVICES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return INITIAL_DEVICES;
}

function saveStoredDevices(items: Device[]) {
  try {
    localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(items));
  } catch (e) {}
}

function getStoredProjects(): LabelProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return INITIAL_PROJECTS;
}

function saveStoredProjects(items: LabelProject[]) {
  try {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(items));
  } catch (e) {}
}

// ==============================================================================
// Database Access Layer (Unified across Supabase & Local Store)
// ==============================================================================

export const dbService = {
  // --- Devices CRUD ---
  async getDevices(): Promise<Device[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('devices').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            name: d.name,
            modelNumber: d.model_number,
            manufacturer: d.manufacturer,
            countryOfOrigin: d.country_of_origin,
            intendedMarket: d.intended_market,
            importerName: d.importer_name,
            importerAddress: d.importer_address,
            lotNumber: d.lot_number,
            serialNumber: d.serial_number,
            manufacturingDate: d.manufacturing_date,
            expiryDate: d.expiry_date,
            storageConditions: d.storage_conditions,
            warningsCautions: d.warnings_cautions,
            udiDi: d.udi_di,
            udiPi: d.udi_pi,
            packagingLevel: d.packaging_level,
            language: d.language,
            createdAt: d.created_at,
            updatedAt: d.updated_at
          }));
        }
      } catch (err) {
        console.warn('Supabase fetch failed, using local store', err);
      }
    }
    return getStoredDevices();
  },

  async createDevice(device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<Device> {
    const now = new Date().toISOString();
    const newId = crypto.randomUUID();
    const newDevice: Device = {
      ...device,
      id: newId,
      createdAt: now,
      updatedAt: now
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('devices').insert({
          id: newId,
          user_id: device.userId,
          name: device.name,
          model_number: device.modelNumber,
          manufacturer: device.manufacturer,
          country_of_origin: device.countryOfOrigin,
          intended_market: device.intendedMarket,
          importer_name: device.importerName || null,
          importer_address: device.importerAddress || null,
          lot_number: device.lotNumber || null,
          serial_number: device.serialNumber || null,
          manufacturing_date: device.manufacturingDate || null,
          expiry_date: device.expiryDate || null,
          storage_conditions: device.storageConditions || null,
          warnings_cautions: device.warningsCautions || null,
          udi_di: device.udiDi || null,
          udi_pi: device.udiPi || null,
          packaging_level: device.packagingLevel,
          language: device.language || 'en'
        }).select().single();

        if (!error && data) {
          return {
            ...newDevice,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      } catch (e) {
        console.warn('Supabase insert failed, persisting locally', e);
      }
    }

    const current = getStoredDevices();
    const updated = [newDevice, ...current];
    saveStoredDevices(updated);
    return newDevice;
  },

  async updateDevice(id: string, updates: Partial<Device>): Promise<Device> {
    const now = new Date().toISOString();

    if (supabase) {
      try {
        await supabase.from('devices').update({
          name: updates.name,
          model_number: updates.modelNumber,
          manufacturer: updates.manufacturer,
          country_of_origin: updates.countryOfOrigin,
          intended_market: updates.intendedMarket,
          importer_name: updates.importerName,
          importer_address: updates.importerAddress,
          lot_number: updates.lotNumber,
          serial_number: updates.serialNumber,
          manufacturing_date: updates.manufacturingDate,
          expiry_date: updates.expiryDate,
          storage_conditions: updates.storageConditions,
          warnings_cautions: updates.warningsCautions,
          udi_di: updates.udiDi,
          udi_pi: updates.udiPi,
          packaging_level: updates.packagingLevel,
          language: updates.language,
          updated_at: now
        }).eq('id', id);
      } catch (e) {
        console.warn('Supabase update failed, updating local store', e);
      }
    }

    const current = getStoredDevices();
    const index = current.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Device not found');
    const updatedDevice = { ...current[index], ...updates, updatedAt: now };
    current[index] = updatedDevice;
    saveStoredDevices(current);
    return updatedDevice;
  },

  async deleteDevice(id: string): Promise<void> {
    if (supabase) {
      try {
        await supabase.from('devices').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete failed', e);
      }
    }

    const currentDevices = getStoredDevices().filter(d => d.id !== id);
    saveStoredDevices(currentDevices);

    // Cascade delete linked projects
    const currentProjects = getStoredProjects().filter(p => p.deviceId !== id);
    saveStoredProjects(currentProjects);
  },

  // --- Label Projects CRUD ---
  async getProjects(): Promise<LabelProject[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('label_projects')
          .select('*, devices(name, model_number)')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((p: any) => ({
            id: p.id,
            userId: p.user_id,
            deviceId: p.device_id,
            deviceName: p.devices?.name,
            deviceModel: p.devices?.model_number,
            title: p.title,
            destinationMarket: p.destination_market,
            packagingLevel: p.packaging_level,
            version: p.version,
            status: p.status,
            notes: p.notes,
            createdAt: p.created_at,
            updatedAt: p.updated_at
          }));
        }
      } catch (err) {
        console.warn('Supabase projects fetch failed, using local store', err);
      }
    }

    const projects = getStoredProjects();
    const devices = getStoredDevices();
    return projects.map(p => {
      const dev = devices.find(d => d.id === p.deviceId);
      return {
        ...p,
        deviceName: dev?.name || p.deviceName || 'Unknown Device',
        deviceModel: dev?.modelNumber || p.deviceModel || ''
      };
    });
  },

  async createProject(project: Omit<LabelProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<LabelProject> {
    const now = new Date().toISOString();
    const newId = crypto.randomUUID();
    const devices = getStoredDevices();
    const linkedDevice = devices.find(d => d.id === project.deviceId);

    const newProject: LabelProject = {
      ...project,
      id: newId,
      deviceName: linkedDevice?.name,
      deviceModel: linkedDevice?.modelNumber,
      createdAt: now,
      updatedAt: now
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('label_projects').insert({
          id: newId,
          user_id: project.userId,
          device_id: project.deviceId,
          title: project.title,
          destination_market: project.destinationMarket,
          packaging_level: project.packagingLevel,
          version: project.version,
          status: project.status,
          notes: project.notes || null
        }).select().single();

        if (!error && data) {
          return {
            ...newProject,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      } catch (e) {
        console.warn('Supabase insert project failed', e);
      }
    }

    const current = getStoredProjects();
    const updated = [newProject, ...current];
    saveStoredProjects(updated);
    return newProject;
  },

  async updateProject(id: string, updates: Partial<LabelProject>): Promise<LabelProject> {
    const now = new Date().toISOString();

    if (supabase) {
      try {
        await supabase.from('label_projects').update({
          title: updates.title,
          destination_market: updates.destinationMarket,
          packaging_level: updates.packagingLevel,
          version: updates.version,
          status: updates.status,
          notes: updates.notes,
          updated_at: now
        }).eq('id', id);
      } catch (e) {
        console.warn('Supabase project update failed', e);
      }
    }

    const current = getStoredProjects();
    const index = current.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Project not found');
    const updated = { ...current[index], ...updates, updatedAt: now };
    current[index] = updated;
    saveStoredProjects(current);
    return updated;
  },

  async deleteProject(id: string): Promise<void> {
    if (supabase) {
      try {
        await supabase.from('label_projects').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete project failed', e);
      }
    }

    const current = getStoredProjects().filter(p => p.id !== id);
    saveStoredProjects(current);
  },

  // --- Statistics Calculation ---
  async getStats(): Promise<StatsData> {
    const devices = await this.getDevices();
    const projects = await this.getProjects();

    const marketDistribution: Record<any, number> = { India: 0, USA: 0, EU: 0 };
    const packagingDistribution: Record<any, number> = { primary: 0, secondary: 0, shipper: 0 };
    const statusDistribution: Record<any, number> = { draft: 0, in_review: 0, approved: 0, rejected: 0 };
    let importedCount = 0;

    devices.forEach(d => {
      if (d.intendedMarket in marketDistribution) {
        marketDistribution[d.intendedMarket]++;
      }
      const origin = (d.countryOfOrigin || '').toLowerCase().trim();
      const market = (d.intendedMarket || '').toLowerCase().trim();
      if (origin && market && origin !== market && (market !== 'india' || origin !== 'india')) {
        importedCount++;
      }
    });

    projects.forEach(p => {
      if (p.packagingLevel in packagingDistribution) {
        packagingDistribution[p.packagingLevel]++;
      }
      if (p.status in statusDistribution) {
        statusDistribution[p.status]++;
      }
    });

    return {
      totalDevices: devices.length,
      totalProjects: projects.length,
      importedDevicesCount: importedCount,
      marketDistribution,
      statusDistribution,
      packagingDistribution
    };
  }
};
