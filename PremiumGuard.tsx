import React, { ReactNode, useEffect } from 'react';
import { Lock, Zap, Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCredits } from '@/contexts/CreditContext';
import { useAuth } from '@/contexts/AuthContext';
import CreditPurchase from '@/components/features/CreditPurchase';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface PremiumGuardProps {
  children: ReactNode;
  requiredCredits?: number;
  featureName: string;
  featureDescription: string;
  className?: string;
}

const PremiumGuard: React.FC<PremiumGuardProps> = ({
  children,
  requiredCredits = 1,
  featureName,
  featureDescription,
  className = ''
}) => {
  const { user } = useAuth();
  const { credits, hasCredits, loading } = useCredits();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const navigate = useNavigate();

  // Give credit system MORE time to initialize for new users
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 3000); // Wait 3 seconds for new users to get initialized

    return () => clearTimeout(timer);
  }, []);

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className={`min-h-[400px] flex items-center justify-center p-8 ${className}`}>
        <Card className="bg-slate-800/50 border-slate-700 text-center max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Lock className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-slate-200">{featureName}</CardTitle>
            <CardDescription className="text-slate-400">
              {featureDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-300">
              Please sign in to access this premium feature.
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state during initial load - ALWAYS show loading for new users to avoid paywall flash
  if (loading || initialLoad) {
    return (
      <div className={`min-h-[400px] flex items-center justify-center p-8 ${className}`}>
        <Card className="bg-slate-800/50 border-slate-700 text-center max-w-md">
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Loading...</h3>
                <p className="text-sm text-slate-400">
                  Preparing your SwapMaster Pro experience
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For NEW USERS (3 credits, never used any), ALWAYS allow access - no paywall
  if (credits && credits.creditsRemaining === 3 && credits.totalCreditsUsed === 0) {
    return <>{children}</>;
  }

  // If user has sufficient credits or unlimited subscription, show the feature
  if (hasCredits(requiredCredits)) {
    return <>{children}</>;
  }

  // ONLY show paywall when user has actually USED credits and now has insufficient balance
  // This means credits were used at least once, and now they're out
  if (credits && credits.totalCreditsUsed > 0 && !hasCredits(requiredCredits)) {
    return (
      <div className={`min-h-[400px] flex items-center justify-center p-8 ${className}`}>
        <Card className="bg-slate-800/50 border-slate-700 text-center max-w-lg">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                <Zap className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-slate-200">{featureName}</CardTitle>
            <CardDescription className="text-slate-400">
              {featureDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Required Credits:</span>
                <Badge className="bg-blue-600">{requiredCredits}</Badge>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Your Balance:</span>
                <Badge className="bg-slate-600">{credits?.creditsRemaining || 0}</Badge>
              </div>
            </div>
            
            <p className="text-sm text-slate-300">
              You need {requiredCredits} credit{requiredCredits > 1 ? 's' : ''} to use this feature.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => setShowUpgrade(true)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Zap className="h-4 w-4 mr-2" />
                Buy Credits
              </Button>
              <Button
                onClick={() => setShowUpgrade(true)}
                variant="outline"
                className="flex-1 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
              >
                <Crown className="h-4 w-4 mr-2" />
                Go Unlimited
              </Button>
            </div>
            
            <div className="text-xs text-slate-400 border-t border-slate-600 pt-3 mt-4">
              <p className="font-medium mb-1">Always Free:</p>
              <p>Community Forum • AI Swap Guides • Basic Vehicle Info</p>
            </div>
          </CardContent>
        </Card>
        
        <CreditPurchase 
          isOpen={showUpgrade}
          onClose={() => setShowUpgrade(false)}
        />
      </div>
    );
  }

  // Fallback: if no credits data available, allow access (don't block new users)
  return <>{children}</>;
};

export default PremiumGuard;