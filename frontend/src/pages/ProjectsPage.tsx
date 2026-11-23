import React, { useState, useEffect } from 'react';
import {
  Plus,
  Tag,
  Filter,
  Edit2,
  Trash2,
  AlertCircle,
  FileText,
  Calendar,
  Lock
} from 'lucide-react';
import { dbService } from '../lib/supabase';
import { Device, LabelProject, DestinationMarket, PackagingLevel, ProjectStatus } from '../types';
import { MarketBadge } from '../components/MarketBadge';
import { PackagingBadge, StatusBadge } from '../components/PackagingBadge';
import { Modal } from '../components/Modal';

interface ProjectsPageProps {
  isOpenAddModal: boolean;
  onCloseAddModal: () => void;
  onOpenAddModal: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  isOpenAddModal,
  onCloseAddModal,
  onOpenAddModal
}) => {
  const [projects, setProjects] = useState<LabelProject[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedMarket, setSelectedMarket] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Form State
  const [editingProject, setEditingProject] = useState<LabelProject[] | any>(null);
  const [projectToDelete, setProjectToDelete] = useState<LabelProject | null>(null);

  const [formData, setFormData] = useState({
    deviceId: '',
    title: '',
    destinationMarket: 'India' as DestinationMarket,
    packagingLevel: 'primary' as PackagingLevel,
    version: 'v1.0-draft',
    status: 'draft' as ProjectStatus,
    notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projData, devData] = await Promise.all([
        dbService.getProjects(),
        dbService.getDevices()
      ]);
      setProjects(projData);
      setDevices(devData);
      if (devData.length > 0 && !formData.deviceId) {
        setFormData(prev => ({ ...prev, deviceId: devData[0].id }));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch label projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({
      deviceId: devices[0]?.id || '',
      title: '',
      destinationMarket: 'India',
      packagingLevel: 'primary',
      version: 'v1.0-draft',
      status: 'draft',
      notes: ''
    });
    setEditingProject(null);
  };

  const openCreateModal = () => {
    resetForm();
    onOpenAddModal();
  };

  const openEditModal = (project: LabelProject) => {
    setEditingProject(project);
    setFormData({
      deviceId: project.deviceId,
      title: project.title,
      destinationMarket: project.destinationMarket,
      packagingLevel: project.packagingLevel,
      version: project.version,
      status: project.status,
      notes: project.notes || ''
    });
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.title.trim() || !formData.deviceId) {
        alert('Please fill in required fields: Title and Linked Medical Device.');
        return;
      }

      if (editingProject) {
        await dbService.updateProject(editingProject.id, formData);
      } else {
        await dbService.createProject({
          ...formData,
          userId: '00000000-0000-0000-0000-000000000001'
        });
      }

      await loadData();
      resetForm();
      onCloseAddModal();
    } catch (err: any) {
      alert(`Error saving project: ${err?.message}`);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      await dbService.deleteProject(projectToDelete.id);
      await loadData();
      setProjectToDelete(null);
    } catch (err: any) {
      alert(`Failed to delete project: ${err?.message}`);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchMarket = selectedMarket === 'All' || p.destinationMarket === selectedMarket;
    const matchStatus = selectedStatus === 'All' || p.status === selectedStatus;
    return matchMarket && matchStatus;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Label Projects Management</h2>
          <p>Organize, version, and track medical device labeling projects per target market</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} /> Create Label Project
        </button>
      </div>

      {/* Filters */}
      <div className="section-card">
        <div className="filter-bar">
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
              <option value="USA">USA (FDA)</option>
              <option value="EU">EU (MDR)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              aria-label="Filter by project status"
              className="filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Changes Requested</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading label projects...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button type="button" className="btn btn-secondary" onClick={loadData}>Retry</button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-state">
            <Tag className="empty-state-icon" />
            <h4>No label projects found</h4>
            <p>Create a label project to link a medical device with target market requirements.</p>
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={15} /> Create Label Project
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Project Title & Version</th>
                  <th>Linked Device</th>
                  <th>Destination Market</th>
                  <th>Packaging Level</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--primary-900)' }}>{p.title}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.version}</span> •{' '}
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.deviceName || 'Linked Device'}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        {p.deviceModel}
                      </div>
                    </td>
                    <td>
                      <MarketBadge market={p.destinationMarket} />
                    </td>
                    <td>
                      <PackagingBadge level={p.packagingLevel} />
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td style={{ maxWidth: '240px', fontSize: '12px', color: '#475569' }}>
                      {p.notes || <span style={{ color: '#94a3b8' }}>None</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon"
                          onClick={() => openEditModal(p)}
                          title="Edit Project"
                          aria-label={`Edit ${p.title}`}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-icon"
                          onClick={() => setProjectToDelete(p)}
                          title="Delete Project"
                          aria-label={`Delete ${p.title}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Project Modal */}
      <Modal
        isOpen={isOpenAddModal || Boolean(editingProject)}
        onClose={() => {
          resetForm();
          onCloseAddModal();
        }}
        title={editingProject ? `Edit Project: ${editingProject.title}` : 'Create Label Project'}
      >
        <form onSubmit={handleSaveProject}>
          <div className="form-group">
            <label className="form-label">Project Title *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. CardioPulse CDSCO Primary Blister Label"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Linked Medical Device *</label>
            <select
              className="form-control"
              required
              value={formData.deviceId}
              onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
              disabled={Boolean(editingProject)}
            >
              {devices.length === 0 && <option value="">No devices registered — register one first</option>}
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.modelNumber}) — Made in {d.countryOfOrigin}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Destination Market *</label>
              <select
                className="form-control"
                required
                value={formData.destinationMarket}
                onChange={(e) => setFormData({ ...formData, destinationMarket: e.target.value as DestinationMarket })}
              >
                <option value="India">India (CDSCO Medical Devices Rules)</option>
                <option value="USA">USA (FDA 21 CFR Part 801)</option>
                <option value="EU">EU (MDR 2017/745)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Packaging Level *</label>
              <select
                className="form-control"
                required
                value={formData.packagingLevel}
                onChange={(e) => setFormData({ ...formData, packagingLevel: e.target.value as PackagingLevel })}
              >
                <option value="primary">Primary Packaging</option>
                <option value="secondary">Secondary Packaging</option>
                <option value="shipper">Shipper Case</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Initial Version</label>
              <input
                type="text"
                className="form-control"
                placeholder="v1.0-draft"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Project Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
              >
                <option value="draft">Draft</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Changes Requested</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Regulatory Scope & Project Notes</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Destination requirements, importer licence details, or sterilization packaging notices."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
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
              {editingProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Project Modal */}
      <Modal
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        title="Confirm Project Removal"
      >
        <div>
          <p style={{ marginBottom: '16px' }}>
            Are you sure you want to delete project <strong>{projectToDelete?.title}</strong>?
          </p>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setProjectToDelete(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDeleteProject}>
              Delete Project
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
