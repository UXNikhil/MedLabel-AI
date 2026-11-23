import React from 'react';

interface MedLabelLogoProps {
  size?: number;
  className?: string;
}

export const MedLabelLogo: React.FC<MedLabelLogoProps> = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="MedLabel AI Logo"
    >
      <defs>
        <linearGradient id="medlabel-grad-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a2540" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id="medlabel-grad-cross" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#99f6e4" />
        </linearGradient>
      </defs>

      {/* Rounded Hexagon / Protective Shield */}
      <rect
        x="2"
        y="2"
        width="36"
        height="36"
        rx="10"
        fill="url(#medlabel-grad-bg)"
        stroke="#14b8a6"
        strokeWidth="1.5"
      />

      {/* Label Tag Notch Accent */}
      <path
        d="M28 6L34 12V28L28 34"
        stroke="rgba(255, 255, 255, 0.25)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Central Medical Cross */}
      <path
        d="M20 11V29M11 20H29"
        stroke="url(#medlabel-grad-cross)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Modern Regulatory Validation Dots */}
      <circle cx="20" cy="8" r="1.5" fill="#38bdf8" />
      <circle cx="32" cy="20" r="1.5" fill="#38bdf8" />
      <circle cx="20" cy="32" r="1.5" fill="#38bdf8" />
      <circle cx="8" cy="20" r="1.5" fill="#38bdf8" />
    </svg>
  );
};
