import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreditData {
  creditsRemaining: number;
  totalCreditsUsed: number;
  totalEarnedCredits: number;
  hasUnlimitedSubscription: boolean;
  lastCreditUsed?: string;
  lastCreditPurchase?: string;
  isNewUser?: boolean;
}

interface CreditContextType {
  credits: CreditData | null;
  loading: boolean;
  refreshCredits: () => Promise<void>;
  hasCredits: (requiredCredits?: number) => boolean;
  purchaseCredits: (planType: string) => Promise<void>;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export function CreditProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [credits, setCredits] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCredits = async () => {
    if (!user) {
      setCredits(null);
      return;
    }

    try {
      setLoading(true);
      
      // ALWAYS provide fallback credits for new users to prevent any paywall showing
      const provideNewUserCredits = () => {
        setCredits({
          creditsRemaining: 3,
          totalCreditsUsed: 0,
          totalEarnedCredits: 3,
          hasUnlimitedSubscription: false,
          isNewUser: true
        });
      };

      // For ANY user that might be new, provide credits immediately
      if (user.user_metadata?.is_guest || !user.email_confirmed_at) {
        provideNewUserCredits();
        return;
      }
      
      // Wait a bit for guest account to be fully initialized
      if (user.user_metadata?.is_guest) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      // Get the auth token from the current session
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.log('No active session for credit check - providing fallback credits');
        provideNewUserCredits();
        return;
      }

      // First ensure user has credits (for new users or users without credits)
      const { data: ensureData, error: ensureError } = await supabase.functions.invoke('ensure-user-credits', {
        body: {},
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`
        }
      });

      if (ensureError) {
        console.error('Error ensuring user credits:', ensureError);
        // Always provide fallback credits for any error - don't show paywall
        provideNewUserCredits();
        return;
      }

      // Now get the current credit balance
      const { data, error } = await supabase.functions.invoke('credit-check', {
        body: {},
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`
        }
      });

      if (error) {
        console.error('Error fetching credits:', error);
        // Always provide fallback credits for any error - don't show paywall
        provideNewUserCredits();
        return;
      }

      if (data?.data) {
        setCredits(data.data);
      } else {
        // If no data returned, provide fallback credits
        provideNewUserCredits();
      }
    } catch (err: any) {
      console.error('Credit check error:', err);
      // Always provide fallback credits for any error - don't show paywall
      const provideNewUserCredits = () => {
        setCredits({
          creditsRemaining: 3,
          totalCreditsUsed: 0,
          totalEarnedCredits: 3,
          hasUnlimitedSubscription: false,
          isNewUser: true
        });
      };
      provideNewUserCredits();
    } finally {
      setLoading(false);
    }
  };

  const hasCredits = (requiredCredits: number = 1): boolean => {
    // ALWAYS assume new users have credits to prevent paywall from showing
    if (loading && user) {
      return true; // Assume user has credits while loading to prevent paywall flash
    }
    
    if (!credits) {
      return false;
    }
    
    if (credits.hasUnlimitedSubscription) return true;
    return credits.creditsRemaining >= requiredCredits;
  };

  const purchaseCredits = async (planType: string) => {
    if (!user) {
      toast.error('Please log in to purchase credits');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('purchase-credits', {
        body: {
          planType,
          customerEmail: user.email
        }
      });

      if (error) {
        throw error;
      }

      if (data?.data?.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      toast.error(err.message || 'Failed to start purchase process');
    }
  };

  useEffect(() => {
    refreshCredits();
  }, [user]);

  // Check for purchase result in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const purchaseStatus = urlParams.get('purchase');

    if (purchaseStatus === 'success') {
      toast.success('Credits purchased successfully!');
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh credits after a delay to allow webhook processing
      setTimeout(refreshCredits, 2000);
    } else if (purchaseStatus === 'cancelled') {
      toast.error('Purchase cancelled');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <CreditContext.Provider value={{
      credits,
      loading,
      refreshCredits,
      hasCredits,
      purchaseCredits
    }}>
      {children}
    </CreditContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditProvider');
  }
  return context;
}