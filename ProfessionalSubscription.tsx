import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Briefcase, BarChart3, Users, Settings, Crown } from 'lucide-react';
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

const ProfessionalSubscription: React.FC = () => {
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
        .in('plan_type', ['professional_basic', 'professional_premium']);
      
      if (error) throw error;
      
      const formattedPlans = data.map(plan => ({
        id: plan.id,
        priceId: plan.price_id,
        planType: plan.plan_type,
        price: plan.price,
        monthlyLimit: plan.monthly_limit,
        name: plan.plan_type === 'professional_basic' ? 'Professional Mode Basic' : 'Professional Mode Premium',
        features: plan.plan_type === 'professional_basic' 
          ? [
              'Advanced customer analytics',
              'Project management tools',
              'Bulk credit purchasing (20% discount)',
              'Up to 100 monthly AI generations',
              'Custom shop branding',
              'Priority email support',
              'Basic reporting dashboard',
              'Customer communication tools'
            ]
          : [
              'Enterprise-level analytics',
              'Advanced project management suite',
              'Bulk credit purchasing (35% discount)',
              'Up to 500 monthly AI generations',
              'White-label branding options',
              'Dedicated account manager',
              'Advanced reporting & insights',
              'Multi-user team access',
              'API access for integrations',
              'Custom workshop templates',
              'Priority phone support'
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
        .in('plans.plan_type', ['professional_basic', 'professional_premium'])
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
        <h2 className="text-3xl font-bold mb-2">Professional Mode for Tuner Shops</h2>
        <p className="text-gray-400 mb-8">
          Advanced B2B tools designed specifically for professional automotive shops and tuners.
        </p>
        
        {/* Current Subscription Status */}
        {currentSubscription && (
          <Alert className="mb-8 border-blue-500 bg-blue-900/20">
            <Crown className="h-4 w-4" />
            <AlertDescription>
              You are currently subscribed to <strong>{currentSubscription.planType.replace('_', ' ')}</strong>.
              Monthly AI generation limit: {currentSubscription.monthlyLimit} generations.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Subscription Plans */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.planType === plan.planType;
            const isPremium = plan.planType === 'professional_premium';
            
            return (
              <Card key={plan.id} className={`bg-gray-800 border-gray-700 relative ${
                isPremium ? 'border-purple-500 shadow-purple-500/20 shadow-lg' : ''
              }`}>
                {isPremium && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-500 text-white px-3 py-1">
                      <Crown className="h-3 w-3 mr-1" />
                      Enterprise
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold mt-2">
                    <span className="text-green-400">${(plan.price / 100).toFixed(2)}</span>
                    <span className="text-lg text-gray-400">/month</span>
                  </div>
                  <p className="text-gray-400">{plan.monthlyLimit} monthly AI generations</p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
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
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700' 
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
                          `Subscribe to ${plan.planType === 'professional_basic' ? 'Basic' : 'Premium'}`
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Key Features Section */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="text-center">
              <BarChart3 className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <CardTitle className="text-lg">Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm text-center">
                Track customer preferences, popular swaps, and business performance with detailed insights.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="text-center">
              <Users className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <CardTitle className="text-lg">Customer Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm text-center">
                Manage customer projects, track builds, and maintain detailed service histories.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="text-center">
              <Briefcase className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <CardTitle className="text-lg">Custom Branding</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm text-center">
                White-label the platform with your shop's branding and provide a seamless customer experience.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="text-center">
              <Settings className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <CardTitle className="text-lg">API Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm text-center">
                Integrate with your existing shop management systems and workflow tools.
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* ROI Calculator */}
        <Card className="bg-gradient-to-r from-green-900 to-blue-900 border-green-500 mb-12">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Return on Investment</CardTitle>
            <p className="text-center text-gray-300">
              Professional Mode customers typically see 3-5x ROI within the first quarter
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-green-400">40%</div>
                <div className="text-sm text-gray-300">Increase in customer engagement</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400">60%</div>
                <div className="text-sm text-gray-300">Faster project planning</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">25%</div>
                <div className="text-sm text-gray-300">Higher project conversion rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Testimonials */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-center">What Professional Shops Say</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-gray-300 italic mb-3">
                  "SwapMaster Pro's Professional Mode has transformed how we work with customers. 
                  The AI-powered compatibility checks save us hours of research, and customers love 
                  seeing their builds visualized before committing."
                </p>
                <div className="text-sm">
                  <div className="font-semibold">Mike Rodriguez</div>
                  <div className="text-gray-400">Owner, Rodriguez Performance</div>
                </div>
              </div>
              
              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-gray-300 italic mb-3">
                  "The analytics dashboard gives us insights we never had before. We can see which 
                  swaps are trending, what our customers are interested in, and plan our inventory accordingly."
                </p>
                <div className="text-sm">
                  <div className="font-semibold">Sarah Chen</div>
                  <div className="text-gray-400">Manager, Apex Tuning</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfessionalSubscription;