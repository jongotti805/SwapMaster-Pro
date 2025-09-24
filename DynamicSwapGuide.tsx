import React, { useState, useEffect } from 'react';
import {
  Zap,
  Wrench,
  DollarSign,
  Clock,
  ChevronRight,
  Download,
  Share2,
  Heart,
  Eye,
  AlertTriangle,
  CheckCircle,
  Settings,
  Sparkles,
  Gift
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface SwapGuideData {
  id: string;
  currentEngine: string;
  targetEngine: string;
  modifications: string;
  vehicleInfo: any;
  guide: string;
  requiredParts: any[];
  estimatedCost: number | null;
  estimatedTime: string;
  difficultyLevel: string;
  compatibilityScore: number;
  createdAt: string;
  viewsCount: number;
  helpfulCount: number;
}

interface PartData {
  partCategory: string;
  partName: string;
  partNumber: string;
  brand: string;
  price: number;
  availability: string;
  vendorUrl: string;
  compatibilityNotes: string;
}

const DynamicSwapGuide: React.FC = () => {
  const [formData, setFormData] = useState({
    currentEngine: '',
    targetEngine: '',
    modifications: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: ''
  });
  
  const [generatedGuides, setGeneratedGuides] = useState<SwapGuideData[]>([]);
  const [recentGuides, setRecentGuides] = useState<SwapGuideData[]>([]);
  const [compatibleParts, setCompatibleParts] = useState<PartData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<SwapGuideData | null>(null);

  const popularEngineSwaps = [
    { from: '4.6L V8', to: '5.7L LS1', difficulty: 'Intermediate' },
    { from: '350 Small Block', to: 'LS3 6.2L', difficulty: 'Beginner' },
    { from: '4.3L V6', to: '5.3L LS', difficulty: 'Intermediate' },
    { from: '2.5L I4', to: '1JZ-GTE', difficulty: 'Advanced' },
    { from: '4.0L I6', to: 'Coyote 5.0L', difficulty: 'Advanced' },
    { from: '13B Rotary', to: 'LS1 5.7L', difficulty: 'Expert' }
  ];

  // Load recent guides on component mount
  useEffect(() => {
    loadRecentGuides();
  }, []);

  const loadRecentGuides = async () => {
    try {
      const { data, error } = await supabase
        .from('dynamic_swap_guides')
        .select('*')
        .eq('generation_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      const guides = data.map(item => ({
        id: item.id,
        currentEngine: item.current_engine,
        targetEngine: item.target_engine,
        modifications: item.modifications || '',
        vehicleInfo: item.vehicle_info || {},
        guide: item.generated_guide,
        requiredParts: item.required_parts || [],
        estimatedCost: item.estimated_cost,
        estimatedTime: item.estimated_time || 'Unknown',
        difficultyLevel: item.difficulty_level || 'Intermediate',
        compatibilityScore: item.compatibility_score || 0.5,
        createdAt: item.created_at,
        viewsCount: item.views_count || 0,
        helpfulCount: item.helpful_count || 0
      }));

      setRecentGuides(guides);
    } catch (error) {
      console.error('Error loading recent guides:', error);
    }
  };

  const handleGenerateGuide = async () => {
    if (!formData.currentEngine || !formData.targetEngine) {
      toast.error('Please specify both current and target engines');
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('dynamic-swap-guide', {
        body: {
          currentEngine: formData.currentEngine,
          targetEngine: formData.targetEngine,
          modifications: formData.modifications,
          vehicleInfo: {
            make: formData.vehicleMake,
            model: formData.vehicleModel,
            year: formData.vehicleYear
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate swap guide');
      }

      const guide: SwapGuideData = {
        id: data.data.guideId,
        currentEngine: formData.currentEngine,
        targetEngine: formData.targetEngine,
        modifications: formData.modifications,
        vehicleInfo: {
          make: formData.vehicleMake,
          model: formData.vehicleModel,
          year: formData.vehicleYear
        },
        guide: data.data.guide,
        requiredParts: data.data.requiredParts || [],
        estimatedCost: data.data.estimatedCost,
        estimatedTime: data.data.estimatedTime,
        difficultyLevel: data.data.difficultyLevel,
        compatibilityScore: data.data.compatibilityScore,
        createdAt: new Date().toISOString(),
        viewsCount: 0,
        helpfulCount: 0
      };

      setGeneratedGuides([guide, ...generatedGuides]);
      setSelectedGuide(guide);
      toast.success('Swap guide generated successfully!');
      
      // Load compatible parts
      await loadCompatibleParts(guide.id, guide.requiredParts);
      
      // Reload recent guides
      loadRecentGuides();
    } catch (error) {
      console.error('Error generating guide:', error);
      toast.error(`Failed to generate guide: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const loadCompatibleParts = async (guideId: string, requiredParts: any[]) => {
    if (!requiredParts || requiredParts.length === 0) return;
    
    setIsLoadingParts(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('autozone-parts-lookup', {
        body: {
          guideId,
          requiredParts,
          vehicleInfo: {
            make: formData.vehicleMake,
            model: formData.vehicleModel,
            year: formData.vehicleYear
          }
        }
      });

      if (error) {
        console.error('Error loading parts:', error);
        return;
      }

      setCompatibleParts(data.data.compatibleParts || []);
    } catch (error) {
      console.error('Error loading compatible parts:', error);
    } finally {
      setIsLoadingParts(false);
    }
  };

  const handlePresetSwap = (swap: any) => {
    setFormData(prev => ({
      ...prev,
      currentEngine: swap.from,
      targetEngine: swap.to
    }));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-orange-500';
      case 'expert': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    if (score >= 0.4) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Free Feature Banner */}
      <Alert className="border-green-500 bg-green-500/10">
        <Gift className="h-4 w-4" />
        <AlertDescription className="text-green-400">
          <strong>FREE FEATURE:</strong> Generate unlimited AI-powered engine swap guides at no cost!
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Dynamic Swap Guide Generator
          </h1>
          <p className="text-slate-400 mt-1">
            Generate custom engine swap guides for any combination using AI
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <Badge variant="outline" className="border-blue-500 text-blue-400">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
          <Badge className="bg-green-600">
            <Gift className="h-3 w-3 mr-1" />
            Free
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Swap Configuration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Specify your engine swap details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Vehicle Information */}
              <div className="space-y-3">
                <Label className="text-slate-300">Vehicle Information</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Year"
                    value={formData.vehicleYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleYear: e.target.value }))}
                    className="bg-slate-700/50 border-slate-600 text-slate-200"
                  />
                  <Input
                    placeholder="Make"
                    value={formData.vehicleMake}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleMake: e.target.value }))}
                    className="bg-slate-700/50 border-slate-600 text-slate-200"
                  />
                </div>
                <Input
                  placeholder="Model"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicleModel: e.target.value }))}
                  className="bg-slate-700/50 border-slate-600 text-slate-200"
                />
              </div>

              {/* Current Engine */}
              <div className="space-y-2">
                <Label className="text-slate-300">Current Engine</Label>
                <Input
                  placeholder="e.g., 4.6L V8, 350 Small Block, 4.3L V6"
                  value={formData.currentEngine}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentEngine: e.target.value }))}
                  className="bg-slate-700/50 border-slate-600 text-slate-200"
                />
              </div>

              {/* Target Engine */}
              <div className="space-y-2">
                <Label className="text-slate-300">Target Engine</Label>
                <Input
                  placeholder="e.g., 5.7L LS1, LS3 6.2L, 1JZ-GTE"
                  value={formData.targetEngine}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetEngine: e.target.value }))}
                  className="bg-slate-700/50 border-slate-600 text-slate-200"
                />
              </div>

              {/* Modifications */}
              <div className="space-y-2">
                <Label className="text-slate-300">Additional Modifications</Label>
                <Textarea
                  placeholder="e.g., Holley carburetor setup, turbo kit, custom headers"
                  value={formData.modifications}
                  onChange={(e) => setFormData(prev => ({ ...prev, modifications: e.target.value }))}
                  className="bg-slate-700/50 border-slate-600 text-slate-200 min-h-[80px]"
                />
              </div>

              {/* Popular Swaps */}
              <div className="space-y-2">
                <Label className="text-slate-300">Popular Swaps</Label>
                <div className="grid grid-cols-1 gap-2">
                  {popularEngineSwaps.slice(0, 3).map((swap, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="justify-between border-slate-600 hover:bg-slate-700 h-auto p-3"
                      onClick={() => handlePresetSwap(swap)}
                    >
                      <div className="text-left">
                        <div className="text-xs text-slate-300">
                          {swap.from} → {swap.to}
                        </div>
                        <div className="text-xs text-slate-500">
                          {swap.difficulty}
                        </div>
                      </div>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateGuide}
                disabled={isGenerating || !formData.currentEngine || !formData.targetEngine}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Wrench className="h-4 w-4 mr-2 animate-pulse" />
                    Generating Guide...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Swap Guide
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">
                <Tabs defaultValue="guide" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="guide">Generated Guide</TabsTrigger>
                    <TabsTrigger value="parts">Compatible Parts</TabsTrigger>
                    <TabsTrigger value="recent">Recent Guides</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="guide" className="mt-6">
                    {isGenerating ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
                          <Wrench className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-400" />
                        </div>
                        <p className="text-slate-300 mt-4">Generating custom swap guide...</p>
                        <p className="text-slate-500 text-sm mt-1">This may take up to 30 seconds</p>
                      </div>
                    ) : selectedGuide ? (
                      <div className="space-y-6">
                        {/* Guide Header */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-200">
                              {selectedGuide.currentEngine} → {selectedGuide.targetEngine}
                            </h3>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-slate-200">
                                {Math.round(selectedGuide.compatibilityScore * 100)}%
                              </div>
                              <div className={`text-sm ${getCompatibilityColor(selectedGuide.compatibilityScore)}`}>
                                Compatibility
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-slate-200">
                                {selectedGuide.estimatedTime}
                              </div>
                              <div className="text-sm text-slate-400">Est. Time</div>
                            </div>
                            <div className="text-center">
                              <Badge className={`${getDifficultyColor(selectedGuide.difficultyLevel)} text-white`}>
                                {selectedGuide.difficultyLevel}
                              </Badge>
                              <div className="text-sm text-slate-400 mt-1">Difficulty</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-slate-200">
                                ${selectedGuide.estimatedCost?.toLocaleString() || 'TBD'}
                              </div>
                              <div className="text-sm text-slate-400">Est. Cost</div>
                            </div>
                          </div>
                        </div>

                        {/* Guide Content */}
                        <div className="bg-slate-900/50 rounded-lg p-6">
                          <div className="prose prose-slate prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-slate-300 text-sm leading-relaxed">
                              {selectedGuide.guide}
                            </div>
                          </div>
                        </div>

                        {/* Required Parts Summary */}
                        {selectedGuide.requiredParts && selectedGuide.requiredParts.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-lg font-semibold text-slate-200">Required Parts Summary</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {selectedGuide.requiredParts.map((part, index) => (
                                <div key={index} className="bg-slate-900/50 rounded-lg p-3">
                                  <div className="text-sm font-medium text-slate-200">
                                    {part.name}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    Category: {part.category}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : generatedGuides.length > 0 ? (
                      <div className="space-y-4">
                        {generatedGuides.map((guide) => (
                          <div 
                            key={guide.id} 
                            className="border border-slate-600 rounded-lg p-4 cursor-pointer hover:bg-slate-700/50"
                            onClick={() => setSelectedGuide(guide)}
                          >
                            <h3 className="font-semibold text-slate-200">
                              {guide.currentEngine} → {guide.targetEngine}
                            </h3>
                            <p className="text-sm text-slate-400 mt-1">
                              {guide.modifications || 'Standard swap'}
                            </p>
                            <div className="flex items-center justify-between mt-3">
                              <Badge className={`${getDifficultyColor(guide.difficultyLevel)} text-white text-xs`}>
                                {guide.difficultyLevel}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {Math.round(guide.compatibilityScore * 100)}% compatible
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                          <Wrench className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-300 mb-2">No guides generated yet</h3>
                        <p className="text-slate-400 text-center mb-6">
                          Generate your first AI-powered swap guide by filling out the form and clicking Generate.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="parts" className="mt-6">
                    {isLoadingParts ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-3 text-slate-300">Loading compatible parts...</span>
                      </div>
                    ) : compatibleParts.length > 0 ? (
                      <div className="space-y-4">
                        {compatibleParts.map((part, index) => (
                          <div key={index} className="border border-slate-600 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-200">{part.partName}</h4>
                                <p className="text-sm text-slate-400">{part.brand}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                  Part #: {part.partNumber || 'N/A'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Category: {part.partCategory}
                                </p>
                                {part.compatibilityNotes && (
                                  <p className="text-xs text-yellow-400 mt-2">
                                    {part.compatibilityNotes}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-400">
                                  ${part.price?.toFixed(2) || 'N/A'}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {part.availability}
                                </div>
                                {part.vendorUrl && (
                                  <Button size="sm" className="mt-2" asChild>
                                    <a href={part.vendorUrl} target="_blank" rel="noopener noreferrer">
                                      View Product
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-blue-300">Total Estimated Cost</h4>
                              <p className="text-sm text-blue-400">Based on {compatibleParts.length} compatible parts</p>
                            </div>
                            <div className="text-2xl font-bold text-blue-300">
                              ${compatibleParts.reduce((sum, part) => sum + (part.price || 0), 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : selectedGuide ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Wrench className="h-16 w-16 text-slate-600 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-300 mb-2">No parts data available</h3>
                        <p className="text-slate-400 text-center">
                          Parts compatibility data is being processed or unavailable for this swap.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Wrench className="h-16 w-16 text-slate-600 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-300 mb-2">Generate a guide first</h3>
                        <p className="text-slate-400 text-center">
                          Create a swap guide to see compatible parts and pricing.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="recent" className="mt-6">
                    {recentGuides.length > 0 ? (
                      <div className="space-y-4">
                        {recentGuides.map((guide) => (
                          <div 
                            key={guide.id} 
                            className="border border-slate-600 rounded-lg p-4 cursor-pointer hover:bg-slate-700/50"
                            onClick={() => setSelectedGuide(guide)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-semibold text-slate-200">
                                  {guide.currentEngine} → {guide.targetEngine}
                                </h3>
                                <p className="text-sm text-slate-400 mt-1">
                                  {guide.modifications || 'Standard swap'}
                                </p>
                                <div className="flex items-center space-x-4 mt-3">
                                  <Badge className={`${getDifficultyColor(guide.difficultyLevel)} text-white text-xs`}>
                                    {guide.difficultyLevel}
                                  </Badge>
                                  <span className="text-xs text-slate-500">
                                    {Math.round(guide.compatibilityScore * 100)}% compatible
                                  </span>
                                  <span className="flex items-center text-xs text-slate-500">
                                    <Eye className="h-3 w-3 mr-1" />
                                    {guide.viewsCount}
                                  </span>
                                  <span className="flex items-center text-xs text-slate-500">
                                    <Heart className="h-3 w-3 mr-1" />
                                    {guide.helpfulCount}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-slate-200">
                                  {guide.estimatedTime}
                                </div>
                                <div className="text-sm text-green-400">
                                  ${guide.estimatedCost?.toLocaleString() || 'TBD'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Wrench className="h-16 w-16 text-slate-600 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-300 mb-2">No recent guides</h3>
                        <p className="text-slate-400 text-center">
                          Be the first to generate a swap guide!
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DynamicSwapGuide;