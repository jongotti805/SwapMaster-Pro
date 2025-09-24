import React, { useState } from 'react';
import { Zap, Crown, Check, Star, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCredits } from '@/contexts/CreditContext';
import { toast } from 'sonner';

interface CreditPlan {
  type: string;
  name: string;
  price: number;
  credits: number | null;
  description: string;
  isPopular?: boolean;
  features: string[];
}

interface CreditPurchaseProps {
  isOpen?: boolean;
  onClose?: () => void;
  trigger?: React.ReactNode;
}

const CreditPurchase: React.FC<CreditPurchaseProps> = ({ 
  isOpen, 
  onClose, 
  trigger 
}) => {
  const { purchaseCredits } = useCredits();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans: CreditPlan[] = [
    {
      type: '10_credits',
      name: '10 Credits',
      price: 5,
      credits: 10,
      description: 'Perfect for trying out premium features',
      features: [
        '10 AI Mockup Generations',
        '10 Parts Marketplace Searches',
        'Valid for 1 year',
        'No monthly commitment'
      ]
    },
    {
      type: '50_credits',
      name: '50 Credits',
      price: 20,
      credits: 50,
      description: 'Great value for regular users',
      isPopular: true,
      features: [
        '50 AI Mockup Generations',
        '50 Parts Marketplace Searches',
        'Valid for 1 year',
        'Better value per credit'
      ]
    },
    {
      type: 'unlimited',
      name: 'Unlimited Monthly',
      price: 10,
      credits: null,
      description: 'Unlimited access to all premium features',
      features: [
        'Unlimited AI Mockups',
        'Unlimited Parts Searches',
        'Priority support',
        'Early access to new features',
        'Cancel anytime'
      ]
    }
  ];

  const handlePurchase = async (planType: string) => {
    if (isLoading || selectedPlan) return;

    setSelectedPlan(planType);
    setIsLoading(true);

    try {
      await purchaseCredits(planType);
      // purchaseCredits will redirect to Stripe, so we don't need to handle success here
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to start purchase process');
      setSelectedPlan(null);
      setIsLoading(false);
    }
  };

  const PlanCard = ({ plan }: { plan: CreditPlan }) => {
    const isSelected = selectedPlan === plan.type;
    const isPurchasing = isLoading && isSelected;

    return (
      <Card className={`relative transition-all duration-300 ${
        plan.isPopular
          ? 'border-2 border-blue-500 bg-slate-800/70'
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
      }`}>
        {plan.isPopular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-blue-600 text-white px-3 py-1">
              <Star className="h-3 w-3 mr-1" />
              Most Popular
            </Badge>
          </div>
        )}
        
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl text-slate-200">{plan.name}</CardTitle>
          <div className="mt-2">
            <span className="text-3xl font-bold text-white">${plan.price}</span>
            {plan.credits ? (
              <span className="text-slate-400 ml-1">for {plan.credits} credits</span>
            ) : (
              <span className="text-slate-400 ml-1">/month</span>
            )}
          </div>
          <CardDescription className="text-slate-300 mt-2">
            {plan.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span className="text-sm text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
          
          <Button
            onClick={() => handlePurchase(plan.type)}
            disabled={isLoading}
            className={`w-full py-3 ${
              plan.isPopular
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800'
            }`}
          >
            {isPurchasing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {plan.credits ? <Zap className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
                <span>Get Started</span>
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const content = (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Choose Your Plan
        </h2>
        <p className="text-slate-400">
          Unlock premium features to enhance your SwapMaster Pro experience
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.type} plan={plan} />
        ))}
      </div>
      
      <div className="bg-slate-800/30 rounded-lg p-4 space-y-2">
        <div className="flex items-center space-x-2 text-sm text-slate-300">
          <Sparkles className="h-4 w-4 text-blue-400" />
          <span className="font-medium">Always Free Features:</span>
        </div>
        <div className="text-sm text-slate-400 ml-6">
          Community Forum, AI Swap Guides, Vehicle Information, User Profiles
        </div>
      </div>
      
      <div className="text-center text-xs text-slate-500">
        <p>Secure payment powered by Stripe • Cancel anytime • No hidden fees</p>
      </div>
    </div>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="sr-only">Purchase Credits</DialogTitle>
            <DialogDescription className="sr-only">
              Choose a credit plan to unlock premium features
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  // If no trigger provided, only show content when isOpen is true
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="sr-only">Purchase Credits</DialogTitle>
          <DialogDescription className="sr-only">
            Choose a credit plan to unlock premium features
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default CreditPurchase;