import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  Zap,
  Download,
  Share2,
  RefreshCw,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Car,
  Camera,
  Settings,
  Play,
  Save,
  Heart,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import PremiumGuard from '@/components/features/PremiumGuard';
import { useCredits } from '@/contexts/CreditContext';

interface GenerationSettings {
  vehicle: string;
  modifications: string;
  style: string;
  angle: string;
  lighting: string;
  background: string;
  quality: number[];
  prompt: string;
}

interface GeneratedMockup {
  id: string;
  imageUrl: string;
  vehicleDescription: string;
  modifications: string;
  prompt: string;
  createdAt: string;
  likesCount: number;
  viewsCount: number;
}

const AIDesignStudio: React.FC = () => {
  return (
    <PremiumGuard
      requiredCredits={1}
      featureName="AI Vehicle Mockup Generator"
      featureDescription="Generate realistic vehicle mockups using DALL-E powered AI. Create stunning visualizations of your custom builds and modifications. Each mockup generation uses 1 credit."
    >
      <AIDesignStudioContent />
    </PremiumGuard>
  );
};

// Move the main component logic to a separate component
const AIDesignStudioContent: React.FC = () => {
  const { hasCredits, refreshCredits } = useCredits();
  const [settings, setSettings] = useState<GenerationSettings>({
    vehicle: '',
    modifications: '',
    style: 'realistic',
    angle: 'three-quarter',
    lighting: 'studio',
    background: 'garage',
    quality: [80],
    prompt: ''
  });
  
  const [generatedMockups, setGeneratedMockups] = useState<GeneratedMockup[]>([]);
  const [recentMockups, setRecentMockups] = useState<GeneratedMockup[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const vehicleOptions = [
    '1994 Chevrolet Silverado',
    '1965 Ford Mustang',
    '1967 Chevrolet Camaro',
    '1969 Dodge Charger',
    '1970 Plymouth Cuda',
    '1982 Chevrolet S-10',
    '1987 BMW E30',
    '1993 Mazda RX-7',
    '1995 Honda Civic',
    '2000 Honda S2000'
  ];

  const modificationOptions = [
    'Custom paint and graphics',
    'Lowered suspension',
    'Performance wheels and tires',
    'Body kit and spoilers',
    'Custom interior',
    'Roll cage and safety equipment',
    'Racing livery and decals',
    'Chrome and polished accessories',
    'LED lighting upgrades',
    'Custom exhaust system'
  ];

  const styleOptions = [
    { value: 'realistic', label: 'Photorealistic' },
    { value: 'artistic', label: 'Artistic Render' },
    { value: 'technical', label: 'Technical Drawing' },
    { value: 'sketch', label: 'Hand Sketch' },
    { value: 'blueprint', label: 'Blueprint Style' },
    { value: 'cyberpunk', label: 'Cyberpunk' },
    { value: 'retro', label: 'Retro/Vintage' },
    { value: 'neon', label: 'Neon Glow' }
  ];

  const angleOptions = [
    { value: 'front', label: 'Front View' },
    { value: 'rear', label: 'Rear View' },
    { value: 'side', label: 'Side Profile' },
    { value: 'three-quarter', label: 'Three Quarter' },
    { value: 'engine-bay', label: 'Engine Bay' },
    { value: 'interior', label: 'Interior' },
    { value: 'overhead', label: 'Top Down' },
    { value: 'low-angle', label: 'Low Angle' }
  ];

  const lightingOptions = [
    { value: 'studio', label: 'Studio Lighting' },
    { value: 'natural', label: 'Natural Light' },
    { value: 'dramatic', label: 'Dramatic' },
    { value: 'sunset', label: 'Golden Hour' },
    { value: 'night', label: 'Night Scene' },
    { value: 'neon', label: 'Neon Lighting' },
    { value: 'spotlight', label: 'Spotlight' },
    { value: 'ambient', label: 'Ambient' }
  ];

  const backgroundOptions = [
    { value: 'garage', label: 'Garage Workshop' },
    { value: 'showroom', label: 'Showroom' },
    { value: 'racetrack', label: 'Race Track' },
    { value: 'street', label: 'City Street' },
    { value: 'mountain', label: 'Mountain Road' },
    { value: 'desert', label: 'Desert Highway' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'minimal', label: 'Minimal/Clean' },
    { value: 'transparent', label: 'Transparent' }
  ];

  const presetPrompts = [
    'Show detailed engine bay with chrome headers and custom intake',
    'Create a low-rider style vehicle with custom paint and wheels',
    'Design a race-ready build with roll cage and racing livery',
    'Showcase a classic restoration with period-correct details',
    'Generate a modern street build with aggressive stance',
    'Create a drag racing setup with parachute and slicks',
    'Design a off-road build with lift kit and mud tires',
    'Show a luxury build with chrome and leather details'
  ];

  // Load recent mockups on component mount
  useEffect(() => {
    loadRecentMockups();
  }, []);

  const loadRecentMockups = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_mockups')
        .select('*')
        .eq('generation_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      const mockups = data.map(item => ({
        id: item.id,
        imageUrl: item.image_url,
        vehicleDescription: item.vehicle_description,
        modifications: item.modifications,
        prompt: item.generated_prompt,
        createdAt: item.created_at,
        likesCount: item.likes_count || 0,
        viewsCount: item.views_count || 0
      }));

      setRecentMockups(mockups);
    } catch (error) {
      console.error('Error loading recent mockups:', error);
    }
  };

  const handleGenerate = async () => {
    if (!settings.vehicle || !settings.modifications) {
      toast.error('Please provide vehicle description and modifications');
      return;
    }

    // Check if user has credits before generation
    if (!hasCredits(1)) {
      toast.error('Insufficient credits! This feature requires 1 credit.');
      return;
    }

    setIsGenerating(true);
    
    try {
      // First, deduct the credit using our credit system
      const { data: creditData, error: creditError } = await supabase.functions.invoke('use-credit', {
        body: {
          featureName: 'ai_mockup_generator',
          creditsRequired: 1
        }
      });

      if (creditError) {
        throw new Error(creditError.message || 'Failed to process credit');
      }

      if (!creditData?.data?.success) {
        if (creditData?.data?.error === 'INSUFFICIENT_CREDITS') {
          toast.error('Insufficient credits! You need 1 credit to generate a mockup.');
          return;
        }
        throw new Error(creditData?.data?.error || 'Credit processing failed');
      }

      // Now generate the mockup
      const { data, error } = await supabase.functions.invoke('ai-mockup-generator', {
        body: {
          vehicleDescription: settings.vehicle,
          modifications: settings.modifications + (settings.prompt ? ` ${settings.prompt}` : ''),
          generationSettings: {
            style: settings.style,
            angle: settings.angle,
            lighting: settings.lighting,
            background: settings.background,
            quality: settings.quality[0]
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate mockup');
      }

      if (data?.data) {
        const mockup: GeneratedMockup = {
          id: data.data.mockupId,
          imageUrl: data.data.imageUrl,
          vehicleDescription: settings.vehicle,
          modifications: settings.modifications,
          prompt: data.data.prompt,
          createdAt: new Date().toISOString(),
          likesCount: 0,
          viewsCount: 0
        };

        setGeneratedMockups([mockup, ...generatedMockups]);
        const creditsUsed = creditData.data.creditsUsed || 1;
        toast.success(`Vehicle mockup generated successfully! ${creditsUsed} credit used.`);
        
        // Refresh credit balance
        refreshCredits();
        
        // Reload recent mockups to show the new one
        loadRecentMockups();
      } else {
        throw new Error('No data received from generation service');
      }
    } catch (error) {
      console.error('Error generating mockup:', error);
      toast.error(`Failed to generate mockup: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadReference = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        toast.success('Reference image uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `swapmaster-mockup-${Date.now()}.jpg`;
    link.click();
    toast.success('Image downloaded!');
  };

  const handleShare = async (imageUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SwapMaster Pro Vehicle Mockup',
          text: 'Check out this custom vehicle mockup I created!',
          url: imageUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Design Studio
          </h1>
          <p className="text-slate-400 mt-1">
            Generate realistic vehicle mockups with AI-powered visualization
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <Badge variant="outline" className="border-purple-500 text-purple-400">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Generation Settings
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure your vehicle mockup parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Vehicle Selection */}
              <div className="space-y-2">
                <Label className="text-slate-300">Vehicle Description</Label>
                <Input
                  type="text"
                  placeholder="Enter vehicle description (e.g., 1994 Chevrolet Silverado)"
                  value={settings.vehicle}
                  onChange={(e) => setSettings(prev => ({ ...prev, vehicle: e.target.value }))}
                  className="bg-slate-700/50 border-slate-600 text-slate-200"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {vehicleOptions.slice(0, 3).map((vehicle) => (
                    <Button
                      key={vehicle}
                      variant="outline"
                      size="sm"
                      className="text-xs border-slate-600 hover:bg-slate-700"
                      onClick={() => setSettings(prev => ({ ...prev, vehicle }))}
                    >
                      {vehicle}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Modifications */}
              <div className="space-y-2">
                <Label className="text-slate-300">Modifications</Label>
                <Textarea
                  placeholder="Describe modifications (e.g., lowered suspension, black wheels, custom paint)"
                  value={settings.modifications}
                  onChange={(e) => setSettings(prev => ({ ...prev, modifications: e.target.value }))}
                  className="bg-slate-700/50 border-slate-600 text-slate-200 min-h-[80px]"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {modificationOptions.slice(0, 3).map((mod) => (
                    <Button
                      key={mod}
                      variant="outline"
                      size="sm"
                      className="text-xs border-slate-600 hover:bg-slate-700"
                      onClick={() => setSettings(prev => ({ 
                        ...prev, 
                        modifications: prev.modifications ? `${prev.modifications}, ${mod}` : mod 
                      }))}
                    >
                      + {mod}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Style Selection */}
              <div className="space-y-2">
                <Label className="text-slate-300">Render Style</Label>
                <Select value={settings.style} onValueChange={(value) => setSettings(prev => ({ ...prev, style: value }))}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {styleOptions.map((style) => (
                      <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Settings */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-300">Angle</Label>
                  <Select value={settings.angle} onValueChange={(value) => setSettings(prev => ({ ...prev, angle: value }))}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {angleOptions.map((angle) => (
                        <SelectItem key={angle.value} value={angle.value}>{angle.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Lighting</Label>
                  <Select value={settings.lighting} onValueChange={(value) => setSettings(prev => ({ ...prev, lighting: value }))}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {lightingOptions.map((lighting) => (
                        <SelectItem key={lighting.value} value={lighting.value}>{lighting.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Background */}
              <div className="space-y-2">
                <Label className="text-slate-300">Background</Label>
                <Select value={settings.background} onValueChange={(value) => setSettings(prev => ({ ...prev, background: value }))}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {backgroundOptions.map((bg) => (
                      <SelectItem key={bg.value} value={bg.value}>{bg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quality Slider */}
              <div className="space-y-2">
                <Label className="text-slate-300">Quality: {settings.quality[0]}%</Label>
                <Slider
                  value={settings.quality}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, quality: value }))}
                  max={100}
                  min={50}
                  step={10}
                  className="w-full"
                />
              </div>

              {/* Custom Prompt */}
              <div className="space-y-2">
                <Label className="text-slate-300">Additional Details</Label>
                <Textarea
                  placeholder="Add specific styling details or requirements..."
                  value={settings.prompt}
                  onChange={(e) => setSettings(prev => ({ ...prev, prompt: e.target.value }))}
                  className="bg-slate-700/50 border-slate-600 text-slate-200 min-h-[60px]"
                />
              </div>

              {/* Reference Image Upload */}
              <div className="space-y-2">
                <Label className="text-slate-300">Reference Image</Label>
                <Button
                  variant="outline"
                  onClick={handleUploadReference}
                  className="w-full border-slate-600 hover:bg-slate-700"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Upload Reference
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !settings.vehicle || !settings.modifications || !hasCredits(1)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : !hasCredits(1) ? (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    1 Credit Required
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Mockup (1 Credit)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Reference Image Preview */}
          {selectedImage && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-200">Reference Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-lg overflow-hidden bg-slate-900">
                  <img
                    src={selectedImage}
                    alt="Reference"
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Results */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200 flex items-center justify-between">
                <Tabs defaultValue="generated" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="generated">Your Mockups</TabsTrigger>
                    <TabsTrigger value="recent">Recent Community</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="generated" className="mt-6">
                    {isGenerating ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-slate-600 border-t-purple-500 rounded-full animate-spin"></div>
                          <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-purple-400" />
                        </div>
                        <p className="text-slate-300 mt-4">Generating your custom mockup...</p>
                        <p className="text-slate-500 text-sm mt-1">This may take up to 30 seconds</p>
                      </div>
                    ) : generatedMockups.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {generatedMockups.map((mockup, index) => (
                          <div key={mockup.id} className="relative group">
                            <div className="aspect-video rounded-lg overflow-hidden bg-slate-900">
                              <img
                                src={mockup.imageUrl}
                                alt={`Generated mockup ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iIzMzNCI+PC9yZWN0Pjx0ZXh0IHg9IjIwMCIgeT0iMTEyLjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdlbmVyYXRlZCBNb2NrdXA8L3RleHQ+PC9zdmc+';
                                }}
                              />
                            </div>
                            
                            {/* Action Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center space-x-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleDownload(mockup.imageUrl)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleShare(mockup.imageUrl)}
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {/* Mockup Info */}
                            <div className="mt-2 space-y-1">
                              <p className="text-sm font-medium text-slate-200">
                                {mockup.vehicleDescription}
                              </p>
                              <p className="text-xs text-slate-400">
                                {mockup.modifications}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                          <Car className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-300 mb-2">No mockups yet</h3>
                        <p className="text-slate-400 text-center mb-6">
                          Generate your first AI vehicle mockup by filling out the form and clicking Generate.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="recent" className="mt-6">
                    {recentMockups.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentMockups.map((mockup) => (
                          <div key={mockup.id} className="relative group">
                            <div className="aspect-video rounded-lg overflow-hidden bg-slate-900">
                              <img
                                src={mockup.imageUrl}
                                alt={mockup.vehicleDescription}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iIzMzNCI+PC9yZWN0Pjx0ZXh0IHg9IjIwMCIgeT0iMTEyLjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNvbW11bml0eSBNb2NrdXA8L3RleHQ+PC9zdmc+';
                                }}
                              />
                            </div>
                            
                            {/* Mockup Info */}
                            <div className="mt-2 space-y-1">
                              <p className="text-sm font-medium text-slate-200">
                                {mockup.vehicleDescription}
                              </p>
                              <p className="text-xs text-slate-400">
                                {mockup.modifications}
                              </p>
                              <div className="flex items-center space-x-3 text-xs text-slate-500">
                                <span className="flex items-center">
                                  <Heart className="h-3 w-3 mr-1" />
                                  {mockup.likesCount}
                                </span>
                                <span className="flex items-center">
                                  <Eye className="h-3 w-3 mr-1" />
                                  {mockup.viewsCount}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                          <ImageIcon className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-300 mb-2">No community mockups</h3>
                        <p className="text-slate-400 text-center">
                          Be the first to generate and share a mockup!
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

export default AIDesignStudio;