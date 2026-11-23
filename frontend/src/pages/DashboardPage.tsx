import React, { useEffect, useState } from 'react';
import {
  Stethoscope,
  Tag,
  Globe2,
  Ship,
  Plus,
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { dbService } from '../lib/supabase';
import { Device, LabelProject, StatsData, NavigationTab } from '../types';
import { MarketBadge } from '../components/MarketBadge';
import { PackagingBadge, StatusBadge } from '../components/PackagingBadge';

interface DashboardPageProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenAddDevice: () => void;
  onOpenAddProject: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenAddDevice,
  onOpenAddProject
}) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentDevices, setRecentDevices] = useState<Device[]>([]);
  const [recentProjects, setRecentProjects] = useState<LabelProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, devicesData, projectsData] = await Promise.all([
        dbService.getStats(),
        dbService.getDevices(),
        dbService.getProjects()
      ]);
      setStats(statsData);
      setRecentDevices(devicesData.slice(0, 5));
      setRecentProjects(projectsData.slice(0, 5));
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Loading database metrics and recent records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
        <button type="button" className="btn btn-secondary" onClick={loadDashboardData}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Regulatory Operations Dashboard</h2>
          <p>Real database statistics, device inventory, and destination market label projects</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" onClick={loadDashboardData} title="Refresh Statistics">
            <RefreshCw size={14} /> Refresh
          </button>
          <button type="button" className="btn btn-secondary" onClick={onOpenAddDevice}>
            <Plus size={15} /> Add Device
          </button>
          <button type="button" className="btn btn-primary" onClick={onOpenAddProject}>
            <Plus size={15} /> Create Label Project
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Registered Devices</h3>
            <div className="stat-card-value">{stats?.totalDevices || 0}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Master inventory records
            </div>
          </div>
          <div className="stat-card-icon">
            <Stethoscope size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Active Label Projects</h3>
            <div className="stat-card-value">{stats?.totalProjects || 0}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Drafts & submissions
            </div>
          </div>
          <div className="stat-card-icon">
            <Tag size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Imported Products</h3>
            <div className="stat-card-value">{stats?.importedDevicesCount || 0}</div>
            <div style={{ fontSize: '12px', color: '#b45309', marginTop: '4px' }}>
              Requires conditional importer info
            </div>
          </div>
          <div className="stat-card-icon" style={{ color: '#d97706', background: '#fef3c7' }}>
            <Ship size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Target Jurisdictions</h3>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <span className="badge badge-india">IN: {stats?.marketDistribution.India || 0}</span>
              <span className="badge badge-usa">US: {stats?.marketDistribution.USA || 0}</span>
              <span className="badge badge-eu">EU: {stats?.marketDistribution.EU || 0}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
              CDSCO / FDA / EU MDR
            </div>
          </div>
          <div className="stat-card-icon">
            <Globe2 size={24} />
          </div>
        </div>
      </div>

      {/* Recent Devices & Recent Projects */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px' }}>
        {/* Recent Devices */}
        <div className="section-card">
          <div className="section-card-header">
            <h3>Medical Devices</h3>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '4px 10px' }}
              onClick={() => onNavigate('devices')}
            >
              View All <ArrowRight size={13} />
            </button>
          </div>

          {recentDevices.length === 0 ? (
            <div className="empty-state">
              <Stethoscope className="empty-state-icon" />
              <h4>No devices registered yet</h4>
              <p>Add medical devices with manufacturing origin and intended market details.</p>
              <button type="button" className="btn btn-primary" onClick={onOpenAddDevice}>
                <Plus size={14} /> Add First Device
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Origin → Market</th>
                    <th>UDI-DI</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDevices.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{d.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{d.modelNumber} • {d.manufacturer}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{d.countryOfOrigin}</span>
                          <span style={{ color: '#94a3b8' }}>→</span>
                          <MarketBadge market={d.intendedMarket} />
                        </div>
                        {d.importerName && (
                          <div style={{ marginTop: '3px' }}>
                            <span className="badge badge-imported">Importer: {d.importerName.slice(0, 24)}...</span>
                          </div>
                        )}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        {d.udiDi || <span style={{ color: '#94a3b8' }}>Not assigned</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Label Projects */}
        <div className="section-card">
          <div className="section-card-header">
            <h3>Label Projects</h3>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '4px 10px' }}
              onClick={() => onNavigate('projects')}
            >
              View All <ArrowRight size={13} />
            </button>
          </div>

          {recentProjects.length === 0 ? (
            <div className="empty-state">
              <Tag className="empty-state-icon" />
              <h4>No label projects yet</h4>
              <p>Create your first label project to start drafting regulatory labels.</p>
              <button type="button" className="btn btn-primary" onClick={onOpenAddProject}>
                <Plus size={14} /> Create First Project
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Destination</th>
                    <th>Packaging</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProjects.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.title}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {p.deviceName || 'Linked Device'} ({p.version})
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
