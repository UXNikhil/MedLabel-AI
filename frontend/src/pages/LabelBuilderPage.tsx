import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  Download,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Building,
  Calendar,
  Layers,
  Thermometer,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../lib/api';
import { dbService } from '../lib/supabase';
import { Device, DestinationMarket, PackagingLevel, UploadExtractionData } from '../types';
import { MarketBadge } from '../components/MarketBadge';

export const LabelBuilderPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [geminiStatus, setGeminiStatus] = useState<{ configured: boolean; message: string }>({
    configured: false,
    message: 'Checking Gemini status...'
  });

  // Upload state
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<UploadExtractionData | null>(null);

  // Draft Label Form / State
  const [targetMarket, setTargetMarket] = useState<DestinationMarket>('India');
  const [packagingLevel, setPackagingLevel] = useState<PackagingLevel>('primary');
  const [labelFields, setLabelFields] = useState<Record<string, any>>({
    name: 'CardioPulse Dual-Chamber Pacemaker',
    model_number: 'CP-420-X',
    manufacturer: 'Berlin MedTech AG (Berlin, Germany)',
    country_of_origin: 'Germany',
    importer_name: 'Arogya MedTech India Private Limited',
    importer_address: 'Plot 42, Okhla Ind Area Phase III, New Delhi 110020 (Lic: IMP/MD/2024/00421)',
    lot_number: 'LOT-2024-GER01',
    serial_number: 'SN-8849201',
    manufacturing_date: '2024-03-15',
    expiry_date: '2029-03-14',
    storage_conditions: 'Store between 5°C and 25°C in dry conditions',
    warnings_cautions: 'Rx Only. MR Unsafe unless programmed. Single use only.',
    udi_di: '(01)04012345678901',
    language: 'en'
  });

  const [downloadLoading, setDownloadLoading] = useState<boolean>(false);

  useEffect(() => {
    // Load devices and check Gemini status
    dbService.getDevices().then(devs => {
      setDevices(devs);
      if (devs.length > 0) setSelectedDeviceId(devs[0].id);
    });
    api.getGeminiStatus().then(st => setGeminiStatus(st));
  }, []);

  const handleDeviceSelect = (devId: string) => {
    setSelectedDeviceId(devId);
    const dev = devices.find(d => d.id === devId);
    if (dev) {
      setTargetMarket(dev.intendedMarket === 'Global' ? 'India' : (dev.intendedMarket as DestinationMarket));
      setPackagingLevel(dev.packagingLevel);
      setLabelFields({
        name: dev.name,
        model_number: dev.modelNumber,
        manufacturer: dev.manufacturer,
        country_of_origin: dev.countryOfOrigin,
        importer_name: dev.importerName || '',
        importer_address: dev.importerAddress || '',
        lot_number: dev.lotNumber || '',
        serial_number: dev.serialNumber || '',
        manufacturing_date: dev.manufacturingDate || '',
        expiry_date: dev.expiryDate || '',
        storage_conditions: dev.storageConditions || '',
        warnings_cautions: dev.warningsCautions || '',
        udi_di: dev.udiDi || '',
        language: dev.language || 'en'
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const data = await api.uploadLabel(file);
      setExtractedData(data);
      if (data.proposed_fields) {
        setLabelFields(prev => ({
          ...prev,
          ...data.proposed_fields
        }));
      }
    } catch (err: any) {
      alert(`Upload extraction failed: ${err?.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadLoading(true);
    try {
      const blob = await api.exportLabelPdf(labelFields, targetMarket);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MedLabel_${targetMarket}_${labelFields.model_number || 'draft'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Failed to download PDF: ${err?.message}`);
    } finally {
      setDownloadLoading(false);
    }
  };

  const isImported = (labelFields.country_of_origin || '').toLowerCase().trim() !== targetMarket.toLowerCase().trim() &&
    !(targetMarket === 'India' && (labelFields.country_of_origin || '').toLowerCase().trim() === 'india');

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Label Builder & Draft Generator</h2>
          <p>Extract regulatory fields from PDF/images, review structured data, and generate compliant draft labels with watermarked PDF exports</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleDownloadPdf}
          disabled={downloadLoading}
        >
          <Download size={15} />
          {downloadLoading ? 'Generating Watermarked PDF...' : 'Export Watermarked PDF'}
        </button>
      </div>

      {/* Gemini AI Status Banner */}
      {!geminiStatus.configured ? (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <AlertTriangle size={18} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400e' }}>
              Gemini AI Configuration Notice
            </div>
            <p style={{ fontSize: '12px', color: '#b45309', marginTop: '2px' }}>
              {geminiStatus.message}
            </p>
            <div style={{ fontSize: '11px', color: '#92400e', marginTop: '4px' }}>
              💡 To enable: Add <code>GEMINI_API_KEY=your_key</code> in <code>backend/.env</code> and restart the backend.
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12px',
          color: '#065f46'
        }}>
          <Sparkles size={16} color="#059669" />
          <span><strong>Gemini AI Active:</strong> Automated field structuring and regulatory explanations enabled via <code>gemini-2.5-flash</code>.</span>
        </div>
      )}

      {/* Two Column Grid: Upload & Editor on Left, Label Preview on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>
        
        {/* Left Column: Upload & Fields Confirmation */}
        <div>
          {/* File Upload Box */}
          <div className="section-card" style={{ marginBottom: '20px' }}>
            <div className="section-card-header">
              <h3>Ingest Existing Medical Label (PDF / Image)</h3>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
              Upload an existing product label or packaging IFU. PyMuPDF extracts raw text and proposes structured fields.
            </p>

            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              border: '2px dashed #cbd5e1',
              borderRadius: 'var(--radius-md)',
              background: '#f8fafc',
              cursor: 'pointer',
              textAlign: 'center'
            }}>
              <Upload size={32} color="#0d9488" style={{ marginBottom: '8px' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                {uploadLoading ? 'Extracting text with PyMuPDF...' : 'Choose or Drag & Drop Label PDF / Image'}
              </span>
              <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                Supports .pdf, .png, .jpg — Max 25MB
              </span>
              <input
                type="file"
                accept=".pdf,image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                disabled={uploadLoading}
              />
            </label>

            {extractedData && (
              <div style={{ marginTop: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                    Extracted from: {extractedData.filename} ({extractedData.page_count} pages)
                  </span>
                  <span style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                    Engine: {extractedData.extraction_engine}
                  </span>
                </div>
                <div style={{ maxHeight: '90px', overflowY: 'auto', background: '#f8fafc', padding: '8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#475569' }}>
                  {extractedData.raw_text.slice(0, 300)}...
                </div>
              </div>
            )}
          </div>

          {/* Master Record Loader & Editor Form */}
          <div className="section-card">
            <div className="section-card-header">
              <h3>Structured Label Data Confirmation</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Or load device:</span>
                <select
                  aria-label="Load registered device master record"
                  className="filter-select"
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                  value={selectedDeviceId}
                  onChange={(e) => handleDeviceSelect(e.target.value)}
                >
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.modelNumber})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group col-span-2">
                <label className="form-label">Brand / Device Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={labelFields.name || ''}
                  onChange={(e) => setLabelFields({ ...labelFields, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Model Number / REF *</label>
                <input
                  type="text"
                  className="form-control"
                  value={labelFields.model_number || ''}
                  onChange={(e) => setLabelFields({ ...labelFields, model_number: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Country of Origin *</label>
                <input
                  type="text"
                  className="form-control"
                  value={labelFields.country_of_origin || ''}
                  onChange={(e) => setLabelFields({ ...labelFields, country_of_origin: e.target.value })}
                />
              </div>

              <div className="form-group col-span-2">
                <label className="form-label">Legal Manufacturer Details *</label>
                <input
                  type="text"
                  className="form-control"
                  value={labelFields.manufacturer || ''}
                  onChange={(e) => setLabelFields({ ...labelFields, manufacturer: e.target.value })}
                />
              </div>

              {/* Conditional Importer for Imported goods */}
              {isImported && (
                <>
                  <div className="form-group col-span-2" style={{ background: '#fffbeb', padding: '10px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', marginBottom: '6px' }}>
                      Imported Device (CDSCO Rule 44(c) / Regional Importer Mandate)
                    </div>
                    <label className="form-label">Authorized Importer Name</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ marginBottom: '8px' }}
                      value={labelFields.importer_name || ''}
                      onChange={(e) => setLabelFields({ ...labelFields, importer_name: e.target.value })}
                      placeholder="e.g. Arogya MedTech India Private Limited"
                    />
                    <label className="form-label">Importer Physical Address & CDSCO Licence No.</label>
                    <input
                      type="text"
                      className="form-control"
                      value={labelFields.importer_address || ''}
                      onChange={(e) => setLabelFields({ ...labelFields, importer_address: e.target.value })}
                      placeholder="e.g. Plot 42, New Delhi 110020 (CDSCO Lic: IMP/MD/2024/00421)"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Lot / Batch Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={labelFields.lot_number || ''}
                  onChange={(e) => setLabelFields({ ...labelFields, lot_number: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Serial Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={labelFields.serial_number || ''}
                  onChange={(e) => setLabelFields({ ...labelFields, serial_number: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Manufacturing Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={labelFields.manufacturing_date || ''}
                  onChange={(e) => setLabelFields({ ...labelFields, manufacturing_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Expiry / Use-by Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={labelFields.expiry_date || ''}
                  onChange={(e) => setLabelFields({ ...labelFields, expiry_date: e.target.value })}
                />
              </div>

              <div className="form-group col-span-2">
                <label className="form-label">Unique Device Identifier (UDI-DI)</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  value={labelFields.udi_di || ''}
                  onChange={(e) => setLabelFields({ ...labelFields, udi_di: e.target.value })}
                />
              </div>

              <div className="form-group col-span-2">
                <label className="form-label">Special Storage Conditions</label>
                <input
                  type="text"
                  className="form-control"
                  value={labelFields.storage_conditions || ''}
                  onChange={(e) => setLabelFields({ ...labelFields, storage_conditions: e.target.value })}
                />
              </div>

              <div className="form-group col-span-2">
                <label className="form-label">Warnings & Caution Statements</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={labelFields.warnings_cautions || ''}
                  onChange={(e) => setLabelFields({ ...labelFields, warnings_cautions: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Draft Label Preview with ISO Symbols */}
        <div>
          <div className="section-card" style={{ position: 'sticky', top: '90px' }}>
            <div className="section-card-header">
              <div>
                <h3>Interactive Draft Label Preview</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Rendered with ISO 15223-1 symbols representation</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  aria-label="Target destination market preview"
                  className="filter-select"
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value as DestinationMarket)}
                >
                  <option value="India">India (CDSCO)</option>
                  <option value="USA">USA (FDA)</option>
                  <option value="EU">EU (MDR)</option>
                </select>
              </div>
            </div>

            {/* Prototype Watermark Warning */}
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '11px',
              color: '#991b1b',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              ⚠️ MEDLABEL AI REGULATORY DRAFT SPECIFICATION — NOT OFFICIAL FDA / CDSCO / CE APPROVAL
            </div>

            {/* Visual Medical Label Canvas */}
            <div style={{
              background: '#ffffff',
              border: '2px solid #0f172a',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              position: 'relative'
            }}>
              {/* Header */}
              <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                      {labelFields.name || 'Device Brand Name'}
                    </h2>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#2563eb', marginTop: '2px' }}>
                      REF / Model: {labelFields.model_number || 'N/A'}
                    </div>
                  </div>
                  <MarketBadge market={targetMarket} />
                </div>
              </div>

              {/* Grid Content with ISO-style Symbols */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                {/* Manufacturer */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: '#334155' }}>
                    <span>🏭 Legal Manufacturer:</span>
                  </div>
                  <div style={{ color: '#0f172a', marginTop: '2px' }}>
                    {labelFields.manufacturer || 'Manufacturer details missing'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Country of Origin: <strong>{labelFields.country_of_origin || 'Unknown'}</strong>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <div style={{ fontWeight: 700, color: '#334155' }}>
                    <span>📅 Mfg Date:</span> <span style={{ fontWeight: 500 }}>{labelFields.manufacturing_date || 'N/A'}</span>
                  </div>
                  <div style={{ fontWeight: 700, color: '#334155', marginTop: '4px' }}>
                    <span>⌛ Use-by / Exp:</span> <span style={{ fontWeight: 500 }}>{labelFields.expiry_date || 'N/A'}</span>
                  </div>
                </div>

                {/* Traceability */}
                <div>
                  <div style={{ fontWeight: 700, color: '#334155' }}>
                    <span>🔲 LOT:</span> <span style={{ fontFamily: 'var(--font-mono)' }}>{labelFields.lot_number || 'N/A'}</span>
                  </div>
                  <div style={{ fontWeight: 700, color: '#334155', marginTop: '2px' }}>
                    <span>🔢 SN:</span> <span style={{ fontFamily: 'var(--font-mono)' }}>{labelFields.serial_number || 'N/A'}</span>
                  </div>
                </div>

                {/* Packaging & Language */}
                <div>
                  <div style={{ fontWeight: 700, color: '#334155' }}>
                    <span>📦 Level:</span> <span>{packagingLevel.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Language: {labelFields.language?.toUpperCase() || 'EN'}
                  </div>
                </div>
              </div>

              {/* Conditional Importer details */}
              {isImported && labelFields.importer_name && (
                <div style={{
                  marginTop: '12px',
                  padding: '8px 10px',
                  background: '#f8fafc',
                  border: '1px dashed #0d9488',
                  borderRadius: '6px',
                  fontSize: '11px'
                }}>
                  <div style={{ fontWeight: 700, color: '#0f766e' }}>
                    🏢 Authorized Indian Importer (CDSCO Rule 44(c)):
                  </div>
                  <div style={{ color: '#0f172a', fontWeight: 600 }}>{labelFields.importer_name}</div>
                  <div style={{ color: '#475569' }}>{labelFields.importer_address || 'Licence info required'}</div>
                </div>
              )}

              {/* Storage & Warnings */}
              <div style={{ marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '8px', fontSize: '11px' }}>
                <div style={{ color: '#475569', marginBottom: '4px' }}>
                  <strong>🌡️ Storage:</strong> {labelFields.storage_conditions || 'Standard storage conditions'}
                </div>
                <div style={{ color: '#991b1b', fontWeight: 600 }}>
                  <strong>⚠️ Warnings:</strong> {labelFields.warnings_cautions || 'See instructions for use'}
                </div>
              </div>

              {/* GS1 UDI Carrier Simulation */}
              <div style={{
                marginTop: '14px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                padding: '8px',
                borderRadius: '4px',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.04em'
              }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748b', marginBottom: '2px' }}>
                  GS1 Unique Device Identifier (HRI / AIDC Carrier)
                </div>
                <strong>{labelFields.udi_di || '(01)00000000000000'} (17){labelFields.expiry_date?.replace(/-/g, '').slice(2) || '000000'} (10){labelFields.lot_number || 'LOT'}</strong>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDownloadPdf}
                disabled={downloadLoading}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Download size={15} />
                {downloadLoading ? 'Generating Watermarked PDF...' : 'Download Official Draft Label PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
