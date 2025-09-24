import React from 'react';
import { Zap, Crown, Gift } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCredits } from '@/contexts/CreditContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import CreditPurchase from '@/components/features/CreditPurchase';

interface CreditBalanceDisplayProps {
  variant?: 'compact' | 'full';
  showPurchaseButton?: boolean;
  className?: string;
}

const CreditBalanceDisplay: React.FC<CreditBalanceDisplayProps> = ({
  variant = 'compact',
  showPurchaseButton = true,
  className = ''
}) => {
  const { user } = useAuth();
  const { credits, loading } = useCredits();
  const [showPurchase, setShowPurchase] = useState(false);

  if (!user || loading) {
    return null;
  }

  if (!credits) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse bg-slate-700 rounded px-2 py-1 w-20 h-6"></div>
      </div>
    );
  }

  const isLowCredits = credits.creditsRemaining === 1 && !credits.hasUnlimitedSubscription;
  const hasNoCredits = credits.creditsRemaining === 0 && !credits.hasUnlimitedSubscription;

  if (variant === 'compact') {
    return (
      <>
        <div className={`flex items-center space-x-2 ${className}`}>
          {credits.hasUnlimitedSubscription ? (
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1">
              <Crown className="h-3 w-3 mr-1" />
              Unlimited
            </Badge>
          ) : (
            <Badge 
              className={`px-3 py-1 transition-colors ${
                hasNoCredits 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : isLowCredits 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-blue-600 text-white'
              }`}
            >
              <Zap className="h-3 w-3 mr-1" />
              {credits.creditsRemaining} {credits.creditsRemaining === 1 ? 'Credit' : 'Credits'}
            </Badge>
          )}
          
          {showPurchaseButton && (hasNoCredits || isLowCredits) && (
            <Button
              size="sm"
              onClick={() => setShowPurchase(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-3 py-1 h-auto"
            >
              <Zap className="h-3 w-3 mr-1" />
              Get More
            </Button>
          )}
        </div>
        
        <CreditPurchase 
          isOpen={showPurchase}
          onClose={() => setShowPurchase(false)}
        />
      </>
    );
  }

  return (
    <>
      <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-300">Credit Balance</h3>
              {credits.totalEarnedCredits > 3 && (
                <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
                  <Gift className="h-3 w-3 mr-1" />
                  Customer
                </Badge>
              )}
            </div>
            
            {credits.hasUnlimitedSubscription ? (
              <div className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                <span className="text-lg font-semibold text-white">Unlimited</span>
                <Badge className="bg-yellow-500 text-white text-xs">Pro</Badge>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Zap className={`h-5 w-5 ${
                    hasNoCredits ? 'text-red-500' : isLowCredits ? 'text-orange-500' : 'text-blue-500'
                  }`} />
                  <span className={`text-lg font-semibold ${
                    hasNoCredits ? 'text-red-400' : isLowCredits ? 'text-orange-400' : 'text-white'
                  }`}>
                    {credits.creditsRemaining}
                  </span>
                  <span className="text-slate-400 text-sm">remaining</span>
                </div>
                
                <div className="text-xs text-slate-500">
                  Total used: {credits.totalCreditsUsed} • Total earned: {credits.totalEarnedCredits}
                </div>
              </div>
            )}
            
            {hasNoCredits && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-xs text-red-400 font-medium mb-2">Credits Exhausted</p>
                <p className="text-xs text-slate-400 mb-3">
                  You've used all your free credits. Purchase more to continue using premium features.
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowPurchase(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Buy Credits
                </Button>
              </div>
            )}
            
            {isLowCredits && !hasNoCredits && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                <p className="text-xs text-orange-400 font-medium mb-2">Running Low</p>
                <p className="text-xs text-slate-400 mb-3">
                  Only {credits.creditsRemaining} credit{credits.creditsRemaining === 1 ? '' : 's'} left. 
                  Get more to continue exploring premium features.
                </p>
                {showPurchaseButton && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPurchase(true)}
                    className="w-full border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Get More Credits
                  </Button>
                )}
              </div>
            )}
            
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
              <p className="font-medium mb-1">Always Free:</p>
              <p>Community Forum • AI Swap Guides • Basic Vehicle Info</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <CreditPurchase 
        isOpen={showPurchase}
        onClose={() => setShowPurchase(false)}
      />
    </>
  );
};

export default CreditBalanceDisplay;