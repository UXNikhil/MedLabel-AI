import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  MinusCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Ship,
  BookOpen
} from 'lucide-react';
import { api } from '../lib/api';
import { dbService } from '../lib/supabase';
import { Device, DestinationMarket, ComplianceCheckFinding, ComplianceSummary } from '../types';
import { MarketBadge } from '../components/MarketBadge';

export const CompliancePage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [targetMarket, setTargetMarket] = useState<DestinationMarket>('India');
  const [loading, setLoading] = useState<boolean>(false);

  // Compliance results
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [findings, setFindings] = useState<ComplianceCheckFinding[]>([]);

  useEffect(() => {
    dbService.getDevices().then(devs => {
      setDevices(devs);
      if (devs.length > 0) {
        setSelectedDeviceId(devs[0].id);
        const market = devs[0].intendedMarket === 'Global' ? 'India' : (devs[0].intendedMarket as DestinationMarket);
        setTargetMarket(market);
        runCheckForDevice(devs[0], market);
      }
    });
  }, []);

  const runCheckForDevice = async (device: Device, market: DestinationMarket) => {
    setLoading(true);
    try {
      const res = await api.runComplianceCheck({
        device_id: device.id,
        destination_market: market,
        label_data: {
          name: device.name,
          model_number: device.modelNumber,
          manufacturer: device.manufacturer,
          country_of_origin: device.countryOfOrigin,
          importer_name: device.importerName,
          importer_address: device.importerAddress,
          lot_number: device.lotNumber,
          serial_number: device.serialNumber,
          manufacturing_date: device.manufacturingDate,
          expiry_date: device.expiryDate,
          storage_conditions: device.storageConditions,
          warnings_cautions: device.warningsCautions,
          udi_di: device.udiDi,
          language: device.language
        }
      });
      setSummary(res.summary);
      setFindings(res.results);
    } catch (e: any) {
      alert(`Compliance run failed: ${e?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceChange = (devId: string) => {
    setSelectedDeviceId(devId);
    const dev = devices.find(d => d.id === devId);
    if (dev) {
      const m = dev.intendedMarket === 'Global' ? 'India' : (dev.intendedMarket as DestinationMarket);
      setTargetMarket(m);
      runCheckForDevice(dev, m);
    }
  };

  const handleMarketChange = (newMarket: DestinationMarket) => {
    setTargetMarket(newMarket);
    const dev = devices.find(d => d.id === selectedDeviceId);
    if (dev) {
      runCheckForDevice(dev, newMarket);
    }
  };

  const currentDevice = devices.find(d => d.id === selectedDeviceId);
  const isImported = currentDevice && 
    currentDevice.countryOfOrigin.toLowerCase().trim() !== targetMarket.toLowerCase().trim() &&
    !(targetMarket === 'India' && currentDevice.countryOfOrigin.toLowerCase().trim() === 'india');

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Multinational Compliance Checker</h2>
          <p>Deterministic regulatory verification across India (CDSCO), USA (FDA), and EU (MDR) with AI advisory explanations</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => currentDevice && runCheckForDevice(currentDevice, targetMarket)}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spinner' : ''} />
          {loading ? 'Evaluating Rules...' : 'Re-run Checks'}
        </button>
      </div>

      {/* Selector Card */}
      <div className="section-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'center' }}>
          <div>
            <label className="form-label">Selected Medical Device</label>
            <select
              aria-label="Select device for compliance review"
              className="form-control"
              value={selectedDeviceId}
              onChange={(e) => handleDeviceChange(e.target.value)}
            >
              {devices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.modelNumber}) — Origin: {d.countryOfOrigin}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Destination Jurisdiction</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['India', 'USA', 'EU'] as DestinationMarket[]).map(m => (
                <button
                  key={m}
                  type="button"
                  className={`btn ${targetMarket === m ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => handleMarketChange(m)}
                >
                  {m === 'India' && '🇮🇳 India (CDSCO)'}
                  {m === 'USA' && '🇺🇸 USA (FDA)'}
                  {m === 'EU' && '🇪🇺 EU (MDR)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Imported Product Context Note */}
        {isImported && currentDevice && (
          <div style={{
            marginTop: '16px',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '6px',
            padding: '12px 14px',
            fontSize: '12px',
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Ship size={18} color="#d97706" style={{ flexShrink: 0 }} />
            <div>
              <strong>Imported Good Notice:</strong> This device is manufactured in <strong>{currentDevice.countryOfOrigin}</strong> and intended for sale in <strong>{targetMarket}</strong>.  
              Target market regulations (specifically CDSCO Rule 44(c) & Rule 34 for India) strictly require Authorized Indian Importer identification and valid CDSCO licence number on the label.
            </div>
          </div>
        )}
      </div>

      {/* Compliance Scorecard */}
      {summary && (
        <div style={{
          background: summary.overall_status === 'PASS' ? '#ecfdf5' : (summary.overall_status === 'FAIL' ? '#fef2f2' : '#fffbeb'),
          border: `1px solid ${summary.overall_status === 'PASS' ? '#a7f3d0' : (summary.overall_status === 'FAIL' ? '#fecaca' : '#fde68a')}`,
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  background: summary.overall_status === 'PASS' ? '#059669' : (summary.overall_status === 'FAIL' ? '#dc2626' : '#d97706'),
                  color: '#ffffff'
                }}>
                  {summary.overall_status}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Compliance Verification: {summary.destination_market}
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                {summary.device_name} (Origin: {summary.country_of_origin})
              </p>
            </div>

            {/* Metric counters */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ textAlign: 'center', background: '#ffffff', padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>{summary.passed_checks}</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>PASSED</div>
              </div>
              <div style={{ textAlign: 'center', background: '#ffffff', padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#dc2626' }}>{summary.failed_checks}</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>FAILED</div>
              </div>
              <div style={{ textAlign: 'center', background: '#ffffff', padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#d97706' }}>{summary.needs_review_checks}</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>REVIEW</div>
              </div>
              <div style={{ textAlign: 'center', background: '#ffffff', padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#64748b' }}>{summary.not_applicable_checks}</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>N/A</div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '14px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '8px' }}>
            <strong>Statutory Disclaimer:</strong> {summary.disclaimer}
          </div>
        </div>
      )}

      {/* Rule-by-Rule Findings List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {findings.map((f) => {
          const isPass = f.status === 'PASS';
          const isFail = f.status === 'FAIL';
          const isReview = f.status === 'NEEDS_REVIEW';
          const isNA = f.status === 'NOT_APPLICABLE';

          return (
            <div
              key={f.rule_code}
              style={{
                background: '#ffffff',
                border: `1px solid ${isFail ? '#fecaca' : (isReview ? '#fde68a' : '#e2e8f0')}`,
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  {isPass && <CheckCircle2 size={20} color="#059669" style={{ marginTop: '2px', flexShrink: 0 }} />}
                  {isFail && <XCircle size={20} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />}
                  {isReview && <AlertCircle size={20} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />}
                  {isNA && <MinusCircle size={20} color="#94a3b8" style={{ marginTop: '2px', flexShrink: 0 }} />}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--primary-900)' }}>
                        {f.rule_code}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                        {f.title}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                      <strong>Finding:</strong> {f.finding}
                    </div>

                    {f.evidence && (
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        Evidence: {f.evidence}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: isPass ? '#d1fae5' : (isFail ? '#fee2e2' : (isReview ? '#fef3c7' : '#f1f5f9')),
                    color: isPass ? '#065f46' : (isFail ? '#991b1b' : (isReview ? '#92400e' : '#475569')),
                    textTransform: 'uppercase'
                  }}>
                    {f.status}
                  </span>
                </div>
              </div>

              {/* Statutory Citation Link */}
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px', fontSize: '11px' }}>
                <span style={{ color: '#64748b' }}>
                  <strong>Source Section:</strong> {f.source_reference}
                </span>
                <a
                  href={f.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary-600)', textDecoration: 'none', fontWeight: 600 }}
                >
                  Official Regulator Source <ExternalLink size={11} />
                </a>
              </div>

              {/* Gemini AI Advisory Note */}
              {f.ai_advisory && (
                <div style={{
                  marginTop: '10px',
                  background: '#f8fafc',
                  borderLeft: '3px solid #0d9488',
                  padding: '8px 12px',
                  borderRadius: '0 4px 4px 0',
                  fontSize: '12px',
                  color: '#334155'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0f766e', marginBottom: '2px' }}>
                    <Sparkles size={13} />
                    Gemini AI Regulatory Advisory
                  </div>
                  {f.ai_advisory}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
