import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Stethoscope,
  Info,
  Ship,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { dbService } from '../lib/supabase';
import { Device, DestinationMarket, PackagingLevel } from '../types';
import { MarketBadge } from '../components/MarketBadge';
import { PackagingBadge } from '../components/PackagingBadge';
import { Modal } from '../components/Modal';

interface DevicesPageProps {
  isOpenAddModal: boolean;
  onCloseAddModal: () => void;
  onOpenAddModal: () => void;
}

export const DevicesPage: React.FC<DevicesPageProps> = ({
  isOpenAddModal,
  onCloseAddModal,
  onOpenAddModal
}) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMarket, setSelectedMarket] = useState<string>('All');

  // Form State for Create / Edit
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    modelNumber: '',
    manufacturer: '',
    countryOfOrigin: 'Germany',
    intendedMarket: 'India' as DestinationMarket | 'Global',
    importerName: '',
    importerAddress: '',
    lotNumber: '',
    serialNumber: '',
    manufacturingDate: '',
    expiryDate: '',
    storageConditions: '',
    warningsCautions: '',
    udiDi: '',
    udiPi: '',
    packagingLevel: 'primary' as PackagingLevel,
    language: 'en'
  });

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dbService.getDevices();
      setDevices(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch medical devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      modelNumber: '',
      manufacturer: '',
      countryOfOrigin: 'Germany',
      intendedMarket: 'India',
      importerName: '',
      importerAddress: '',
      lotNumber: '',
      serialNumber: '',
      manufacturingDate: '',
      expiryDate: '',
      storageConditions: '',
      warningsCautions: '',
      udiDi: '',
      udiPi: '',
      packagingLevel: 'primary',
      language: 'en'
    });
    setEditingDevice(null);
  };

  const openCreateModal = () => {
    resetForm();
    onOpenAddModal();
  };

  const openEditModal = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      modelNumber: device.modelNumber,
      manufacturer: device.manufacturer,
      countryOfOrigin: device.countryOfOrigin,
      intendedMarket: device.intendedMarket,
      importerName: device.importerName || '',
      importerAddress: device.importerAddress || '',
      lotNumber: device.lotNumber || '',
      serialNumber: device.serialNumber || '',
      manufacturingDate: device.manufacturingDate || '',
      expiryDate: device.expiryDate || '',
      storageConditions: device.storageConditions || '',
      warningsCautions: device.warningsCautions || '',
      udiDi: device.udiDi || '',
      udiPi: device.udiPi || '',
      packagingLevel: device.packagingLevel,
      language: device.language || 'en'
    });
  };

  const handleSaveDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name.trim() || !formData.modelNumber.trim() || !formData.manufacturer.trim()) {
        alert('Please fill in required fields: Name, Model Number, and Manufacturer.');
        return;
      }

      if (editingDevice) {
        await dbService.updateDevice(editingDevice.id, formData);
      } else {
        await dbService.createDevice({
          ...formData,
          userId: '00000000-0000-0000-0000-000000000001'
        });
      }

      await loadDevices();
      resetForm();
      onCloseAddModal();
    } catch (err: any) {
      alert(`Error saving device: ${err?.message}`);
    }
  };

  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;
    try {
      await dbService.deleteDevice(deviceToDelete.id);
      await loadDevices();
      setDeviceToDelete(null);
    } catch (err: any) {
      alert(`Failed to delete device: ${err?.message}`);
    }
  };

  // PRD imported product condition: origin != intended destination
  const isImportedProduct = (origin: string, dest: string) => {
    const o = origin.toLowerCase().trim();
    const d = dest.toLowerCase().trim();
    return o && d && o !== d && !(o === 'india' && d === 'india');
  };

  const currentlyImported = isImportedProduct(formData.countryOfOrigin, formData.intendedMarket);

  // Filtered devices list
  const filteredDevices = devices.filter((d) => {
    const matchQuery =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.modelNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchMarket = selectedMarket === 'All' || d.intendedMarket === selectedMarket;
    return matchQuery && matchMarket;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Medical Device Inventory</h2>
          <p>Register and manage medical devices with manufacturing origin, importer rules, and UDI data</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} /> Register Device
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="section-card">
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by device name, model code, or manufacturer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="#64748b" />
            <select
              aria-label="Filter by destination market"
              className="filter-select"
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
            >
              <option value="All">All Destination Markets</option>
              <option value="India">India (CDSCO)</option>
              <option value="USA">USA (FDA 21 CFR 801)</option>
              <option value="EU">EU (MDR 2017/745)</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading medical devices...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button type="button" className="btn btn-secondary" onClick={loadDevices}>Retry</button>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="empty-state">
            <Stethoscope className="empty-state-icon" />
            <h4>No medical devices found</h4>
            <p>
              {searchQuery || selectedMarket !== 'All'
                ? 'No devices matched your search or market criteria.'
                : 'Get started by registering your first medical device.'}
            </p>
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={15} /> Register Device
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Device / Model</th>
                  <th>Manufacturer</th>
                  <th>Origin & Target Market</th>
                  <th>UDI & Dates</th>
                  <th>Packaging</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((d) => {
                  const imported = isImportedProduct(d.countryOfOrigin, d.intendedMarket);
                  return (
                    <tr key={d.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--primary-900)' }}>{d.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                          Model: {d.modelNumber}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{d.manufacturer}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Language: {d.language.toUpperCase()}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{d.countryOfOrigin}</span>
                          <span style={{ color: '#94a3b8' }}>→</span>
                          <MarketBadge market={d.intendedMarket} />
                        </div>
                        {imported && (
                          <div title={`Authorized Importer: ${d.importerName || 'Pending'}`}>
                            <span className="badge badge-imported">
                              <Ship size={11} style={{ display: 'inline', marginRight: '3px' }} />
                              Imported: {d.importerName ? d.importerName.slice(0, 26) + '...' : 'Importer info missing'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#0f172a' }}>
                          DI: {d.udiDi || '—'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Mfg: {d.manufacturingDate || '—'} | Exp: {d.expiryDate || '—'}
                        </div>
                      </td>
                      <td>
                        <PackagingBadge level={d.packagingLevel} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-icon"
                            onClick={() => openEditModal(d)}
                            title="Edit Device Details"
                            aria-label={`Edit ${d.name}`}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-icon"
                            onClick={() => setDeviceToDelete(d)}
                            title="Delete Device"
                            aria-label={`Delete ${d.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Device Modal */}
      <Modal
        isOpen={isOpenAddModal || Boolean(editingDevice)}
        onClose={() => {
          resetForm();
          onCloseAddModal();
        }}
        title={editingDevice ? `Edit Device: ${editingDevice.name}` : 'Register Medical Device'}
      >
        <form onSubmit={handleSaveDevice}>
          <div className="form-grid">
            <div className="form-group col-span-2">
              <label className="form-label">
                Device Commercial / Brand Name *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. CardioPulse Dual-Chamber Pacemaker"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Model Number / Code *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. CP-420-X"
                required
                value={formData.modelNumber}
                onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Legal Manufacturer Name & Address *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Berlin MedTech AG (Berlin, Germany)"
                required
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Country of Origin (Manufacturing) *
              </label>
              <select
                className="form-control"
                required
                value={formData.countryOfOrigin}
                onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value })}
              >
                <option value="Germany">Germany (EU)</option>
                <option value="USA">United States of America</option>
                <option value="India">India</option>
                <option value="France">France (EU)</option>
                <option value="Japan">Japan</option>
                <option value="Switzerland">Switzerland</option>
                <option value="United Kingdom">United Kingdom</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Target Destination Market *
              </label>
              <select
                className="form-control"
                required
                value={formData.intendedMarket}
                onChange={(e) => setFormData({ ...formData, intendedMarket: e.target.value as DestinationMarket })}
              >
                <option value="India">India (CDSCO Medical Devices Rules)</option>
                <option value="USA">USA (FDA 21 CFR Part 801)</option>
                <option value="EU">EU (MDR 2017/745)</option>
                <option value="Global">Global / Multi-market</option>
              </select>
            </div>

            {/* Conditional Importer Notice & Fields */}
            {currentlyImported && (
              <div className="imported-notice-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '4px' }}>
                  <Ship size={16} />
                  Imported Medical Device Rule Check
                </div>
                <p>
                  This device is manufactured in <strong>{formData.countryOfOrigin}</strong> and intended for sale in{' '}
                  <strong>{formData.intendedMarket}</strong>. Per statutory requirements (e.g. CDSCO Rule 34/35 for India),{' '}
                  labels must identify the authorized Indian importer, physical address, and CDSCO Import Licence number.
                </p>
              </div>
            )}

            {currentlyImported && (
              <>
                <div className="form-group col-span-2">
                  <label className="form-label">
                    Authorized Importer Name <small>(Conditional requirement)</small>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Arogya MedTech India Private Limited"
                    value={formData.importerName}
                    onChange={(e) => setFormData({ ...formData, importerName: e.target.value })}
                  />
                </div>

                <div className="form-group col-span-2">
                  <label className="form-label">
                    Importer Address & Statutory Licence Number
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Plot 42, Okhla Ind Area Phase III, New Delhi 110020 (Lic: IMP/MD/2024/00421)"
                    value={formData.importerAddress}
                    onChange={(e) => setFormData({ ...formData, importerAddress: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Lot / Batch Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. LOT-2024-GER01"
                value={formData.lotNumber}
                onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Serial Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. SN-8849201"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Manufacturing Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.manufacturingDate}
                onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expiry Date / Use-by Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Packaging Level</label>
              <select
                className="form-control"
                value={formData.packagingLevel}
                onChange={(e) => setFormData({ ...formData, packagingLevel: e.target.value as PackagingLevel })}
              >
                <option value="primary">Primary (Blister / Vial / Direct Contact)</option>
                <option value="secondary">Secondary (Carton / Box)</option>
                <option value="shipper">Shipper (Corrugated Outer Case)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Primary Label Language</label>
              <select
                className="form-control"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              >
                <option value="en">English (Official international & US/India default)</option>
                <option value="de">German</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
              </select>
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">Unique Device Identifier — DI (UDI-DI)</label>
              <input
                type="text"
                className="form-control"
                style={{ fontFamily: 'var(--font-mono)' }}
                placeholder="e.g. (01)04012345678901"
                value={formData.udiDi}
                onChange={(e) => setFormData({ ...formData, udiDi: e.target.value })}
              />
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">Unique Device Identifier — PI (UDI-PI)</label>
              <input
                type="text"
                className="form-control"
                style={{ fontFamily: 'var(--font-mono)' }}
                placeholder="e.g. (17)290314(10)LOT-2024-GER01(21)SN-8849201"
                value={formData.udiPi}
                onChange={(e) => setFormData({ ...formData, udiPi: e.target.value })}
              />
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">Special Storage Conditions</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Store between 5°C and 25°C in dry conditions"
                value={formData.storageConditions}
                onChange={(e) => setFormData({ ...formData, storageConditions: e.target.value })}
              />
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">Warnings, Precautions & Cautions</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="e.g. Rx Only. MR Unsafe unless programmed. Single use only."
                value={formData.warningsCautions}
                onChange={(e) => setFormData({ ...formData, warningsCautions: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                resetForm();
                onCloseAddModal();
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingDevice ? 'Save Changes' : 'Save Device'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deviceToDelete)}
        onClose={() => setDeviceToDelete(null)}
        title="Confirm Device Removal"
      >
        <div>
          <p style={{ marginBottom: '16px' }}>
            Are you sure you want to delete <strong>{deviceToDelete?.name}</strong> ({deviceToDelete?.modelNumber})?
          </p>
          <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#991b1b', marginBottom: '20px' }}>
            Warning: Deleting this device will cascade delete all linked label projects in the database.
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setDeviceToDelete(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDeleteDevice}>
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
