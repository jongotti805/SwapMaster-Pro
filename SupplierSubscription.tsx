import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Star, Crown, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SubscriptionPlan {
  id: string;
  priceId: string;
  planType: string;
  price: number;
  monthlyLimit: number;
  name: string;
  features: string[];
}

interface UserSubscription {
  id: string;
  stripeSubscriptionId: string;
  priceId: string;
  status: string;
  planType: string;
  monthlyLimit: number;
}

const SupplierSubscription: React.FC = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPlans();
      fetchCurrentSubscription();
    }
  }, [user]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .in('plan_type', ['supplier_basic', 'supplier_premium']);
      
      if (error) throw error;
      
      const formattedPlans = data.map(plan => ({
        id: plan.id,
        priceId: plan.price_id,
        planType: plan.plan_type,
        price: plan.price,
        monthlyLimit: plan.monthly_limit,
        name: plan.plan_type === 'supplier_basic' ? 'Verified Supplier Basic' : 'Verified Supplier Premium',
        features: plan.plan_type === 'supplier_basic' 
          ? [
              'Verified supplier badge',
              'Priority in search results',
              'Basic supplier analytics',
              'Up to 50 monthly listings',
              'Community forum access',
              'Email support'
            ]
          : [
              'Premium verified badge',
              'Top priority in search results',
              'Advanced supplier analytics',
              'Up to 200 monthly listings',
              'Featured supplier spotlight',
              'Priority support',
              'Custom branding options',
              'Bulk listing tools'
            ]
      }));
      
      setPlans(formattedPlans);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plans!price_id(
            plan_type,
            price,
            monthly_limit
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .in('plans.plan_type', ['supplier_basic', 'supplier_premium'])
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setCurrentSubscription({
          id: data.id,
          stripeSubscriptionId: data.stripe_subscription_id,
          priceId: data.price_id,
          status: data.status,
          planType: data.plans.plan_type,
          monthlyLimit: data.plans.monthly_limit
        });
      }
    } catch (error) {
      console.error('Failed to fetch current subscription:', error);
    }
  };

  const handleSubscribe = async (planType: string) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return;
    }

    setLoading(planType);

    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          planType,
          customerEmail: user.email
        }
      });

      if (error) throw error;

      if (data && data.data && data.data.checkoutUrl) {
        toast.success('Redirecting to payment...');
        window.location.href = data.data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to create subscription');
    } finally {
      setLoading(null);
    }
  };

  if (isLoadingPlans) {
    return (
      <div className="p-6 bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">Verified Supplier Program</h2>
        <p className="text-gray-400 mb-8">
          Join our trusted supplier network and get verified badges, priority listings, and detailed analytics.
        </p>
        
        {/* Current Subscription Status */}
        {currentSubscription && (
          <Alert className="mb-8 border-green-500 bg-green-900/20">
            <Crown className="h-4 w-4" />
            <AlertDescription>
              You are currently subscribed to <strong>{currentSubscription.planType.replace('_', ' ')}</strong>.
              Monthly limit: {currentSubscription.monthlyLimit} listings.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Subscription Plans */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.planType === plan.planType;
            const isPremium = plan.planType === 'supplier_premium';
            
            return (
              <Card key={plan.id} className={`bg-gray-800 border-gray-700 relative ${
                isPremium ? 'border-yellow-500 shadow-yellow-500/20 shadow-lg' : ''
              }`}>
                {isPremium && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-yellow-500 text-black px-3 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold mt-2">
                    <span className="text-green-400">${(plan.price / 100).toFixed(2)}</span>
                    <span className="text-lg text-gray-400">/month</span>
                  </div>
                  <p className="text-gray-400">Up to {plan.monthlyLimit} monthly listings</p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4">
                    {isCurrentPlan ? (
                      <Button className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        className={`w-full ${
                          isPremium 
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        onClick={() => handleSubscribe(plan.planType)}
                        disabled={loading === plan.planType}
                      >
                        {loading === plan.planType ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Processing...</span>
                          </div>
                        ) : (
                          `Subscribe to ${plan.planType === 'supplier_basic' ? 'Basic' : 'Premium'}`
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Badge className="bg-green-600">
                  <Check className="h-4 w-4" />
                </Badge>
                <span>Trust & Credibility</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">
                Verified supplier badges build customer confidence and increase sales conversions.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                <span>Priority Visibility</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">
                Get featured at the top of search results and marketplace listings.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-blue-400" />
                <span>Advanced Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">
                Track performance, customer engagement, and optimize your listings.
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* FAQ Section */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">How does the verification process work?</h4>
              <p className="text-gray-400 text-sm">
                Once you subscribe, our team will review your business license and track record. 
                Verification typically takes 1-3 business days.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Can I upgrade or downgrade my plan?</h4>
              <p className="text-gray-400 text-sm">
                Yes, you can change your subscription plan at any time. Changes take effect at the next billing cycle.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">What happens if I exceed my monthly limit?</h4>
              <p className="text-gray-400 text-sm">
                You'll receive a notification when approaching your limit. Additional listings can be purchased 
                or you can upgrade to a higher tier.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupplierSubscription;