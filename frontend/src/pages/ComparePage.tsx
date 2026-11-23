import React, { useState, useEffect } from 'react';
import {
  SplitSquareVertical,
  AlertTriangle,
  ArrowRight,
  Plus,
  Minus,
  Edit3,
  CheckCircle2,
  FileCode,
  Layers
} from 'lucide-react';
import { api } from '../lib/api';
import { dbService } from '../lib/supabase';
import { Device, ComparisonResult, FieldChange } from '../types';

export const ComparePage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'fields' | 'text'>('fields');

  // Baseline and Revised test states
  const [baseLabel, setBaseLabel] = useState<Record<string, any>>({
    name: 'CardioPulse Dual-Chamber Pacemaker',
    model_number: 'CP-420-X',
    manufacturer: 'Berlin MedTech AG (Berlin, Germany)',
    country_of_origin: 'Germany',
    intended_market: 'India',
    importer_name: 'Arogya MedTech India Private Limited',
    importer_address: 'Plot 42, Okhla Ind Area Phase III, New Delhi 110020 (CDSCO Lic: IMP/MD/2024/00421)',
    lot_number: 'LOT-2024-GER01',
    serial_number: 'SN-8849201',
    manufacturing_date: '2024-03-15',
    expiry_date: '2029-03-14',
    storage_conditions: 'Store between 5°C and 25°C in dry conditions',
    warnings_cautions: 'Rx Only. MR Unsafe unless programmed. Contains lithium-iodine power source. Single use only.',
    udi_di: '(01)04012345678901'
  });

  const [revisedLabel, setRevisedLabel] = useState<Record<string, any>>({
    name: 'CardioPulse Dual-Chamber Pacemaker',
    model_number: 'CP-420-X',
    manufacturer: 'Berlin MedTech AG (Berlin, Germany)',
    country_of_origin: 'Germany',
    intended_market: 'India',
    importer_name: 'Arogya MedTech India Private Limited',
    importer_address: 'Plot 42, Okhla Ind Area Phase III, New Delhi 110020 (CDSCO Lic: IMP/MD/2024/00421)',
    lot_number: 'LOT-2024-GER02', // MODIFIED LOT
    serial_number: 'SN-8849201',
    manufacturing_date: '2024-06-01', // MODIFIED MFG DATE
    expiry_date: '2029-05-31', // MODIFIED EXP DATE
    storage_conditions: 'Store between 5°C and 25°C in dry conditions',
    warnings_cautions: 'Single use only.', // REMOVED MR UNSAFE & RX ONLY WARNING!
    udi_di: '(01)04012345678901'
  });

  const runComparison = async (base: Record<string, any>, rev: Record<string, any>) => {
    setLoading(true);
    try {
      const res = await api.compareLabels({
        base_label: base,
        revised_label: rev,
        base_name: 'CardioPulse Version 1.0 (Baseline)',
        revised_name: 'CardioPulse Version 1.1 (Revised Draft)'
      });
      setComparison(res);
    } catch (e: any) {
      alert(`Comparison failed: ${e?.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dbService.getDevices().then(devs => setDevices(devs));
    runComparison(baseLabel, revisedLabel);
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Label Comparison & Diff Engine</h2>
          <p>Side-by-side field diff and unified text comparison detecting critical regulatory alterations between label revisions</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`btn ${viewMode === 'fields' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('fields')}
          >
            <Layers size={14} /> Field-by-Field Diff
          </button>
          <button
            type="button"
            className={`btn ${viewMode === 'text' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('text')}
          >
            <FileCode size={14} /> Unified Text Diff
          </button>
        </div>
      </div>

      {/* Critical Regulatory Alerts Banner */}
      {comparison && comparison.summary.critical_changes_detected > 0 && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b', fontWeight: 800, fontSize: '14px' }}>
            <AlertTriangle size={18} />
            <span>CRITICAL REGULATORY ALERT: {comparison.summary.critical_changes_detected} statutory parameter modification(s) detected</span>
          </div>
          <ul style={{ marginTop: '8px', paddingLeft: '24px', fontSize: '13px', color: '#7f1d1d', lineHeight: 1.5 }}>
            {comparison.summary.critical_alerts.map((alert, idx) => (
              <li key={idx}><strong>{alert}</strong></li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary Stats */}
      {comparison && (
        <div className="stats-grid" style={{ marginBottom: '20px' }}>
          <div className="stat-card">
            <div className="stat-card-info">
              <h3>Fields Evaluated</h3>
              <div className="stat-card-value">{comparison.summary.total_fields_compared}</div>
            </div>
            <div className="stat-card-icon"><Layers size={22} /></div>
          </div>
          <div className="stat-card">
            <div className="stat-card-info">
              <h3>Modified Fields</h3>
              <div className="stat-card-value" style={{ color: '#d97706' }}>{comparison.summary.modified_fields}</div>
            </div>
            <div className="stat-card-icon" style={{ background: '#fef3c7', color: '#d97706' }}><Edit3 size={22} /></div>
          </div>
          <div className="stat-card">
            <div className="stat-card-info">
              <h3>Critical Alerts</h3>
              <div className="stat-card-value" style={{ color: '#dc2626' }}>{comparison.summary.critical_changes_detected}</div>
            </div>
            <div className="stat-card-icon" style={{ background: '#fee2e2', color: '#dc2626' }}><AlertTriangle size={22} /></div>
          </div>
        </div>
      )}

      {/* View Mode 1: Field-by-Field Diff */}
      {viewMode === 'fields' && comparison && (
        <div className="section-card">
          <div className="section-card-header">
            <h3>Side-by-Side Field Comparison</h3>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              <strong>Left:</strong> {comparison.base_name} &nbsp; vs &nbsp; <strong>Right:</strong> {comparison.revised_name}
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Regulatory Field</th>
                  <th style={{ width: '12%' }}>Change Type</th>
                  <th style={{ width: '33%' }}>Baseline ({comparison.base_name.split(' ')[0]})</th>
                  <th style={{ width: '33%' }}>Revised ({comparison.revised_name.split(' ')[0]})</th>
                </tr>
              </thead>
              <tbody>
                {comparison.field_changes.map((c) => {
                  const isMod = c.change_type === 'modified';
                  const isAdd = c.change_type === 'added';
                  const isRem = c.change_type === 'removed';

                  return (
                    <tr
                      key={c.field}
                      style={{
                        background: isMod ? '#fffbeb' : (isRem ? '#fef2f2' : (isAdd ? '#ecfdf5' : '#ffffff'))
                      }}
                    >
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.label}</div>
                        {c.is_critical && (
                          <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 800, textTransform: 'uppercase' }}>
                            Critical Regulatory Field
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: isMod ? '#fde68a' : (isRem ? '#fecaca' : (isAdd ? '#a7f3d0' : '#e2e8f0')),
                          color: isMod ? '#92400e' : (isRem ? '#991b1b' : (isAdd ? '#065f46' : '#475569')),
                          textTransform: 'uppercase'
                        }}>
                          {c.change_type}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: isRem || isMod ? '#b91c1c' : '#475569' }}>
                        {c.base_value || <span style={{ color: '#94a3b8' }}>None</span>}
                      </td>
                      <td style={{ fontSize: '12px', color: isAdd || isMod ? '#047857' : '#475569', fontWeight: isMod ? 700 : 400 }}>
                        {c.revised_value || <span style={{ color: '#94a3b8' }}>None</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Mode 2: Unified Text Diff */}
      {viewMode === 'text' && comparison && (
        <div className="section-card">
          <div className="section-card-header">
            <h3>Unified Text Diff Viewer</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Standard line-by-line unified diff output</span>
          </div>

          <pre style={{
            background: '#0f172a',
            color: '#f8fafc',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            overflowX: 'auto',
            lineHeight: 1.6
          }}>
            {comparison.text_diff.split('\n').map((line, i) => {
              let color = '#f8fafc';
              if (line.startsWith('+')) color = '#34d399';
              else if (line.startsWith('-')) color = '#f87171';
              else if (line.startsWith('@@') || line.startsWith('===')) color = '#60a5fa';

              return (
                <div key={i} style={{ color }}>
                  {line}
                </div>
              );
            })}
          </pre>
        </div>
      )}
    </div>
  );
};
