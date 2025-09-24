import React, { useState } from 'react';
import { Search, Package, ShoppingCart, ExternalLink, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useCredits } from '@/contexts/CreditContext';

interface VehicleInfo {
  make: string;
  model: string;
  year: string;
}

interface PartResult {
  part_name: string;
  part_number?: string;
  brand: string;
  price: number;
  availability: string;
  vendor_url?: string;
  compatibility_notes?: string;
  is_recommended: boolean;
}

interface PremiumPartsSearchProps {
  className?: string;
}

const PremiumPartsSearch: React.FC<PremiumPartsSearchProps> = ({ className }) => {
  const { hasCredits, refreshCredits } = useCredits();
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    make: '',
    model: '',
    year: ''
  });
  const [requiredParts, setRequiredParts] = useState([
    { name: 'Engine Mount', category: 'Engine Mounts' },
    { name: 'Wiring Harness', category: 'Electrical' }
  ]);
  const [searchResults, setSearchResults] = useState<PartResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handlePartsSearch = async () => {
    if (!vehicleInfo.make || !vehicleInfo.model || !vehicleInfo.year) {
      toast.error('Please fill in all vehicle information');
      return;
    }

    if (!hasCredits(1)) {
      toast.error('Insufficient credits for parts search');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    
    try {
      // First, deduct the credit using our credit system
      const { data: creditData, error: creditError } = await supabase.functions.invoke('use-credit', {
        body: {
          featureName: 'autozone_parts_search',
          creditsRequired: 1
        }
      });

      if (creditError) {
        throw new Error(creditError.message || 'Failed to process credit');
      }

      if (!creditData?.data?.success) {
        if (creditData?.data?.error === 'INSUFFICIENT_CREDITS') {
          toast.error('Insufficient credits! You need 1 credit to search for parts.');
          return;
        }
        throw new Error(creditData?.data?.error || 'Credit processing failed');
      }

      // Now perform the AutoZone parts search
      const { data, error } = await supabase.functions.invoke('autozone-parts-lookup', {
        body: {
          guideId: `search-${Date.now()}`,
          requiredParts,
          vehicleInfo
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to search for parts');
      }

      if (data?.data?.compatibleParts) {
        setSearchResults(data.data.compatibleParts);
        toast.success(`Found ${data.data.compatibleParts.length} compatible parts! 1 credit used.`);
        setHasSearched(true);
        
        // Refresh credit balance after successful search
        await refreshCredits();
      } else {
        throw new Error('No parts data received');
      }
    } catch (error: any) {
      console.error('Parts search error:', error);
      toast.error(`Failed to search for parts: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const addRequiredPart = () => {
    setRequiredParts([...requiredParts, { name: '', category: 'General' }]);
  };

  const updateRequiredPart = (index: number, field: string, value: string) => {
    const updated = [...requiredParts];
    updated[index] = { ...updated[index], [field]: value };
    setRequiredParts(updated);
  };

  const removeRequiredPart = (index: number) => {
    if (requiredParts.length > 1) {
      setRequiredParts(requiredParts.filter((_, i) => i !== index));
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Vehicle Information */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200">Vehicle Information</CardTitle>
          <CardDescription className="text-slate-400">
            Enter your vehicle details for accurate part compatibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Year</Label>
              <Input
                placeholder="e.g., 2005"
                value={vehicleInfo.year}
                onChange={(e) => setVehicleInfo(prev => ({ ...prev, year: e.target.value }))}
                className="bg-slate-700/50 border-slate-600 text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Make</Label>
              <Input
                placeholder="e.g., Chevrolet"
                value={vehicleInfo.make}
                onChange={(e) => setVehicleInfo(prev => ({ ...prev, make: e.target.value }))}
                className="bg-slate-700/50 border-slate-600 text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Model</Label>
              <Input
                placeholder="e.g., Silverado"
                value={vehicleInfo.model}
                onChange={(e) => setVehicleInfo(prev => ({ ...prev, model: e.target.value }))}
                className="bg-slate-700/50 border-slate-600 text-slate-200"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Required Parts */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200">Required Parts</CardTitle>
          <CardDescription className="text-slate-400">
            Specify the parts you need for your build
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requiredParts.map((part, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Part name (e.g., Engine Mount)"
                value={part.name}
                onChange={(e) => updateRequiredPart(index, 'name', e.target.value)}
                className="flex-1 bg-slate-700/50 border-slate-600 text-slate-200"
              />
              <Input
                placeholder="Category"
                value={part.category}
                onChange={(e) => updateRequiredPart(index, 'category', e.target.value)}
                className="w-32 bg-slate-700/50 border-slate-600 text-slate-200"
              />
              {requiredParts.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeRequiredPart(index)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            onClick={addRequiredPart}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Add Another Part
          </Button>
        </CardContent>
      </Card>

      {/* Search Button */}
      <Button
        onClick={handlePartsSearch}
        disabled={isSearching || !hasCredits(1)}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50"
        size="lg"
      >
        {isSearching ? (
          <>Searching AutoZone...</>
        ) : !hasCredits(1) ? (
          <>1 Credit Required</>  
        ) : (
          <>
            <Search className="h-4 w-4 mr-2" />
            Search Compatible Parts (1 Credit)
          </>
        )}
      </Button>

      {/* Search Results */}
      {hasSearched && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-200">Search Results</CardTitle>
            <CardDescription className="text-slate-400">
              Compatible parts found for your {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Package className="h-12 w-12 mx-auto mb-4" />
                <p>No parts found. Try adjusting your search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((part, index) => (
                  <Card key={index} className="bg-slate-700/50 border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-slate-200 text-sm line-clamp-2">{part.part_name}</h4>
                        {part.is_recommended && (
                          <Badge className="bg-green-600 text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Recommended
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Brand:</span>
                          <span className="text-slate-200">{part.brand}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Price:</span>
                          <span className="text-green-400 font-medium">${part.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Status:</span>
                          <span className={`font-medium ${
                            part.availability.toLowerCase().includes('stock') ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {part.availability}
                          </span>
                        </div>
                        {part.part_number && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Part #:</span>
                            <span className="text-slate-200 font-mono">{part.part_number}</span>
                          </div>
                        )}
                      </div>
                      
                      {part.compatibility_notes && (
                        <p className="text-xs text-slate-400 mt-2 italic">{part.compatibility_notes}</p>
                      )}
                      
                      <div className="flex gap-2 mt-3">
                        {part.vendor_url && (
                          <Button size="sm" className="flex-1 text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="flex-1 text-xs border-slate-600">
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PremiumPartsSearch;