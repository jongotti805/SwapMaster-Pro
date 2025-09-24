import React from 'react';
import { Coins, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCredits } from '@/contexts/CreditContext';
import { cn } from '@/lib/utils';

interface CreditBalanceProps {
  className?: string;
  showUpgrade?: boolean;
  onUpgradeClick?: () => void;
}

const CreditBalance: React.FC<CreditBalanceProps> = ({ 
  className, 
  showUpgrade = true, 
  onUpgradeClick 
}) => {
  const { credits, loading, hasCredits } = useCredits();

  if (loading || !credits) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <div className="h-8 w-16 bg-slate-700 animate-pulse rounded"></div>
      </div>
    );
  }

  if (credits.hasUnlimitedSubscription) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center space-x-2', className)}>
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600">
                <Crown className="h-3 w-3 mr-1" />
                Unlimited
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>You have unlimited access to all premium features!</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const creditColor = credits.creditsRemaining > 5 ? 'from-green-500 to-emerald-500' :
                     credits.creditsRemaining > 1 ? 'from-yellow-500 to-orange-500' :
                     'from-red-500 to-pink-500';

  return (
    <TooltipProvider>
      <div className={cn('flex items-center space-x-2', className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`bg-gradient-to-r ${creditColor} text-white hover:opacity-90 cursor-help`}>
              <Coins className="h-3 w-3 mr-1" />
              {credits.creditsRemaining} credits
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p>Credits remaining: {credits.creditsRemaining}</p>
              <p>Total used: {credits.totalCreditsUsed}</p>
              <p>Total earned: {credits.totalEarnedCredits}</p>
            </div>
          </TooltipContent>
        </Tooltip>
        
        {showUpgrade && credits.creditsRemaining <= 1 && (
          <Button
            size="sm"
            variant="outline"
            onClick={onUpgradeClick}
            className="text-xs h-7 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-none hover:from-blue-600 hover:to-purple-600"
          >
            Upgrade
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
};

export default CreditBalance;