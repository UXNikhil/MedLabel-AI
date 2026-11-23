import React from 'react';
import { DestinationMarket } from '../types';

interface MarketBadgeProps {
  market: DestinationMarket | 'Global' | string;
}

export const MarketBadge: React.FC<MarketBadgeProps> = ({ market }) => {
  switch (market) {
    case 'India':
      return <span className="badge badge-india">🇮🇳 India (CDSCO)</span>;
    case 'USA':
      return <span className="badge badge-usa">🇺🇸 USA (FDA)</span>;
    case 'EU':
      return <span className="badge badge-eu">🇪🇺 EU (MDR)</span>;
    default:
      return <span className="badge badge-global">🌐 {market}</span>;
  }
};
