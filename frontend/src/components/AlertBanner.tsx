import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const AlertBanner: React.FC = () => {
  return (
    <div className="prototype-banner" role="alert">
      <div className="prototype-banner-text">
        <AlertTriangle size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px' }} />
        <strong>Regulatory Notice:</strong> MedLabel AI is a medical-device regulatory labeling assistant platform. It does <strong>not</strong> constitute official regulatory approval or legal compliance certification under India CDSCO, US FDA, or EU MDR.
      </div>
    </div>
  );
};
