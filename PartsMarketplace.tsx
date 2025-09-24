import React from 'react';
import EnhancedMarketplace from '@/components/features/EnhancedMarketplace';
import PremiumGuard from '@/components/features/PremiumGuard';

const PartsMarketplace: React.FC = () => {
  return (
    <PremiumGuard
      requiredCredits={1}
      featureName="AutoZone Parts Browsing"
      featureDescription="Search and compare compatible parts from AutoZone with real-time pricing and availability. Each search uses 1 credit."
    >
      <EnhancedMarketplace />
    </PremiumGuard>
  );
};

export default PartsMarketplace;