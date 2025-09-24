import React, { useState, useEffect } from 'react';
import {
  Heart,
  BarChart3 as Compare,
  Star,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ShoppingCart,
  Eye,
  DollarSign,
  Package,
  Truck,
  Clock,
  Filter,
  SortDesc
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditContext';
import { supabase, getVendorPricing } from '@/lib/supabase';
import { toast } from 'sonner';

interface VendorPricing {
  vendor: string;
  price: number;
  shippingCost: number;
  totalCost: number;
  availability: string;
  stockQuantity: number;
  deliveryDays: number;
  partNumber: string;
  confidence: number;
  dataSource: string;
}

interface PricingStatistics {
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  potentialSavings: number;
  priceRange: {
    min: number;
    max: number;
  };
}

interface VendorPricingData {
  partId: string;
  searchTerm: string;
  lastUpdated: string;
  vendorCount: number;
  statistics: PricingStatistics;
  pricing: VendorPricing[];
  apiStatus: {
    autoZoneApiAvailable: boolean;
    realDataSources: number;
    mockDataSources: number;
  };
}

interface PriceHistory {
  date: string;
  price: number;
  vendor: string;
}

interface VendorPricingDisplayProps {
  partId: string;
  partName: string;
  vehicleInfo?: {
    year?: string;
    make?: string;
    model?: string;
  };
}

const VendorPricingDisplay: React.FC<VendorPricingDisplayProps> = ({ 
  partId, 
  partName,
  vehicleInfo 
}) => {
  const { user } = useAuth();
  const { hasCredits, refreshCredits } = useCredits();
  const [pricingData, setPricingData] = useState<VendorPricingData | null>(null);
  const [pricing, setPricing] = useState<VendorPricing[]>([]);
  const [statistics, setStatistics] = useState<PricingStatistics | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [priceAlert, setPriceAlert] = useState<number | null>(null);
  const [showPriceHistory, setShowPriceHistory] = useState(false);

  useEffect(() => {
    loadVendorPricing();
    loadPriceHistory();
  }, [partId]);

  const loadVendorPricing = async () => {
    try {
      setLoading(true);
      
      // Check if user has credits for vendor pricing lookup
      if (!hasCredits(1)) {
        toast.error('Insufficient credits for vendor pricing lookup');
        return;
      }

      // First, deduct the credit using our credit system
      const { data: creditData, error: creditError } = await supabase.functions.invoke('use-credit', {
        body: {
          featureName: 'vendor_pricing_lookup',
          creditsRequired: 1
        }
      });

      if (creditError) {
        throw new Error(creditError.message || 'Failed to process credit');
      }

      if (!creditData?.data?.success) {
        if (creditData?.data?.error === 'INSUFFICIENT_CREDITS') {
          toast.error('Insufficient credits! You need 1 credit for vendor pricing lookup.');
          return;
        }
        throw new Error(creditData?.data?.error || 'Credit processing failed');
      }

      // Now get vendor pricing
      const data = await getVendorPricing(partId, partName, {
        vehicleMake: vehicleInfo?.make,
        vehicleModel: vehicleInfo?.model,
        vehicleYear: vehicleInfo?.year
      });
      
      setPricingData(data);
      setPricing(data.pricing || []);
      setStatistics(data.statistics || null);
      
      // Refresh credit balance after successful lookup
      await refreshCredits();
      
      toast.success(`Found pricing from ${data.pricing?.length || 0} vendors! 1 credit used.`);
    } catch (error: any) {
      console.error('Error loading vendor pricing:', error);
      toast.error(`Failed to load vendor pricing: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadPriceHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('price_history')
        .select(`
          date_recorded,
          price,
          vendors!inner(display_name)
        `)
        .eq('part_id', partId)
        .order('date_recorded', { ascending: false })
        .limit(30);

      if (error) throw error;

      const formattedHistory = data?.map((item: any) => ({
        date: item.date_recorded,
        price: item.price,
        vendor: item.vendors?.display_name || 'Unknown Vendor'
      })) || [];

      setPriceHistory(formattedHistory);
    } catch (error) {
      console.error('Error loading price history:', error);
    }
  };

  const createPriceAlert = async () => {
    if (!priceAlert || !user) return;

    try {
      const { error } = await supabase
        .from('price_alerts')
        .insert({
          user_id: user.id,
          part_id: partId,
          target_price: priceAlert,
          current_price: Math.min(...pricing.map(p => p.totalCost)),
          is_active: true
        });

      if (error) throw error;
      
      setPriceAlert(null);
      alert('Price alert created successfully!');
    } catch (error) {
      console.error('Error creating price alert:', error);
    }
  };

  const getBestPrice = () => {
    if (pricing.length === 0) return null;
    return pricing.reduce((best, current) => 
      current.totalCost < best.totalCost ? current : best
    );
  };

  const getPriceRange = () => {
    if (pricing.length === 0) return { min: 0, max: 0 };
    const prices = pricing.map(p => p.totalCost);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  };

  const getPriceTrend = () => {
    if (priceHistory.length < 2) return 'stable';
    const recent = priceHistory[0]?.price || 0;
    const previous = priceHistory[1]?.price || 0;
    
    if (recent > previous * 1.05) return 'rising';
    if (recent < previous * 0.95) return 'falling';
    return 'stable';
  };

  const trend = getPriceTrend();
  const bestPrice = getBestPrice();
  const priceRange = getPriceRange();

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white">Live Vendor Pricing</CardTitle>
          <div className="flex items-center space-x-2">
            {pricingData?.apiStatus && (
              <Badge 
                variant={pricingData.apiStatus.realDataSources > 0 ? 'default' : 'secondary'}
                className="text-xs"
              >
                {pricingData.apiStatus.realDataSources} Real APIs
              </Badge>
            )}
            <Badge 
              variant={trend === 'rising' ? 'destructive' : trend === 'falling' ? 'default' : 'secondary'}
              className="flex items-center space-x-1"
            >
              {trend === 'rising' ? (
                <TrendingUp className="h-3 w-3" />
              ) : trend === 'falling' ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <div className="h-3 w-3 rounded-full bg-current" />
              )}
              <span>{trend}</span>
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPriceHistory(!showPriceHistory)}
            >
              <Clock className="h-4 w-4 mr-1" />
              History
            </Button>
          </div>
        </div>
        <p className="text-sm text-slate-400">
          Real-time pricing from {pricing.length} vendors
          {pricingData?.lastUpdated && (
            <span className="ml-2">• Updated {new Date(pricingData.lastUpdated).toLocaleTimeString()}</span>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">
              ${statistics?.lowestPrice?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-slate-400">Best Price</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">
              ${statistics?.averagePrice?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-slate-400">Average</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-400">
              ${statistics?.highestPrice?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-slate-400">Highest</p>
          </div>
        </div>
        
        {statistics?.potentialSavings && statistics.potentialSavings > 0 && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <span className="text-green-400 font-medium">
                Save up to ${statistics.potentialSavings.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              By choosing the best vendor over the most expensive
            </p>
          </div>
        )}

        <Separator className="bg-slate-600" />

        {/* Vendor Listings */}
        <div className="space-y-3">
          {pricing.map((vendor, index) => (
            <motion.div
              key={vendor.vendor}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border ${
                vendor === bestPrice 
                  ? 'border-green-500 bg-green-500/10' 
                  : 'border-slate-600 bg-slate-700/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-white">{vendor.vendor}</h4>
                    {vendor === bestPrice && (
                      <Badge className="bg-green-500 text-white">Best Price</Badge>
                    )}
                    {vendor.confidence && (
                      <Badge 
                        variant={vendor.confidence === 1.0 ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {vendor.dataSource}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">Part #: {vendor.partNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">
                    ${vendor.totalCost.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400">
                    +${vendor.shippingCost.toFixed(2)} shipping
                  </p>
                </div>
              </div>
              
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div className="flex items-center space-x-1">
                  <Package className="h-4 w-4 text-slate-400" />
                  <span className={`${
                    vendor.availability === 'In Stock' 
                      ? 'text-green-400' 
                      : 'text-yellow-400'
                  }`}>
                    {vendor.availability}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-300">{vendor.stockQuantity} available</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Truck className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-300">{vendor.deliveryDays} days</span>
                </div>
              </div>
              
              <div className="mt-3 flex items-center justify-between">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Add to Cart
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Price Alert Setup */}
        {user && (
          <div className="border border-slate-600 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <h4 className="font-medium text-white">Price Alert</h4>
            </div>
            <p className="text-sm text-slate-400 mb-3">
              Get notified when the price drops below your target
            </p>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  placeholder="Target price"
                  value={priceAlert || ''}
                  onChange={(e) => setPriceAlert(Number(e.target.value))}
                  className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white w-24"
                />
              </div>
              <Button 
                size="sm" 
                onClick={createPriceAlert}
                disabled={!priceAlert}
              >
                Set Alert
              </Button>
            </div>
          </div>
        )}

        {/* Price History Chart */}
        {showPriceHistory && priceHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border border-slate-600 rounded-lg p-3"
          >
            <h4 className="font-medium text-white mb-3">Price History (30 days)</h4>
            <div className="space-y-2">
              {priceHistory.slice(0, 10).map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{entry.date}</span>
                  <span className="text-slate-300">{entry.vendor}</span>
                  <span className="text-white font-medium">${entry.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorPricingDisplay;