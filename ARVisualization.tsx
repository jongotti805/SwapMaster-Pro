import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Camera,
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  Share2,
  Eye,
  Settings,
  Smartphone,
  Tablet,
  Monitor,
  Zap,
  Layers,
  Move3D,
  Sun,
  Moon,
  Palette,
  Save,
  Upload,
  AlertTriangle,
  CheckCircle,
  Info,
  Sparkles,
  Target,
  Crosshair,
  Heart
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ARMockup {
  id: string;
  base_image_url: string;
  mockup_data: any;
  vehicle_info: any;
  modifications: any[];
  generated_preview_url?: string;
  is_public: boolean;
  views_count: number;
  likes_count: number;
  created_at: string;
}

interface AROverlay {
  type: string;
  position: { x: number; y: number; z: number };
  scale: number;
  rotation: { x: number; y: number; z: number };
  modifications: string[];
}

const ARVisualization: React.FC = () => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [arMockups, setArMockups] = useState<ARMockup[]>([]);
  const [currentMockup, setCurrentMockup] = useState<ARMockup | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState<'portrait' | 'landscape'>('landscape');
  
  // AR Settings
  const [arSettings, setArSettings] = useState({
    lighting: 'realistic' as 'enhanced' | 'realistic' | 'dramatic',
    reflections: true,
    shadows: true,
    overlay_opacity: 0.9,
    tracking_sensitivity: 0.8,
    render_quality: 'high' as 'low' | 'medium' | 'high'
  });

  // Vehicle and modification data
  const [vehicleInfo, setVehicleInfo] = useState({
    year: '',
    make: '',
    model: '',
    currentEngine: '',
    color: '#1a1a1a'
  });

  const [selectedModifications, setSelectedModifications] = useState<string[]>([]);
  const [targetEngine, setTargetEngine] = useState('');
  
  // AR Session data
  const [sessionData, setSessionData] = useState({
    sessionDuration: 0,
    mockupsGenerated: 0,
    arFeaturesUsed: [] as string[]
  });

  // Processing state
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [arOverlays, setArOverlays] = useState<AROverlay[]>([]);

  useEffect(() => {
    fetchArMockups();
    detectDeviceOrientation();
    
    // Add orientation change listener
    window.addEventListener('orientationchange', detectDeviceOrientation);
    return () => window.removeEventListener('orientationchange', detectDeviceOrientation);
  }, []);

  const detectDeviceOrientation = () => {
    setDeviceOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use rear camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
      
      toast.success('Camera activated! Point at your vehicle to begin AR visualization');
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Camera access denied or not available');
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        
        // Add AR overlays
        drawArOverlays(ctx);
        
        toast.success('Photo captured! Processing AR overlay...');
        processArMockup(imageData);
      }
    }
  };

  const processArMockup = async (imageData: string) => {
    if (!user) {
      toast.error('Please log in to create AR mockups');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStep('Analyzing vehicle in image...');

    try {
      // Simulate processing steps
      const steps = [
        'Analyzing vehicle in image...',
        'Detecting vehicle contours...',
        'Calculating engine bay dimensions...',
        'Generating AR overlay instructions...',
        'Rendering modifications...',
        'Finalizing AR mockup...'
      ];

      for (let i = 0; i < steps.length; i++) {
        setProcessingStep(steps[i]);
        setProcessingProgress(((i + 1) / steps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Call AR visualization edge function
      const { data, error } = await supabase.functions.invoke('ar-visualization', {
        body: {
          action: 'generate_ar_mockup',
          baseImageUrl: imageData,
          vehicleInfo,
          modifications: selectedModifications.map(mod => ({ type: mod, target: targetEngine })),
          arSessionData: {
            cameraPosition: { x: 0, y: 0, z: 5 },
            lighting: arSettings.lighting,
            vehicleAngle: 'front-quarter'
          },
          overlayPreferences: arSettings
        }
      });

      if (error) throw error;

      const newMockup = data.data.mockup;
      setArMockups(prev => [newMockup, ...prev]);
      setCurrentMockup(newMockup);
      setSessionData(prev => ({
        ...prev,
        mockupsGenerated: prev.mockupsGenerated + 1,
        arFeaturesUsed: [...prev.arFeaturesUsed, 'ar_generation']
      }));

      toast.success('AR mockup generated successfully!');
    } catch (error) {
      console.error('Error processing AR mockup:', error);
      toast.error('Failed to process AR mockup');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingStep('');
    }
  };

  const drawArOverlays = (ctx: CanvasRenderingContext2D) => {
    // Simulate AR overlay drawing
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    
    // Draw engine bay outline
    ctx.strokeRect(
      ctx.canvas.width * 0.3,
      ctx.canvas.height * 0.2,
      ctx.canvas.width * 0.4,
      ctx.canvas.height * 0.3
    );
    
    // Draw targeting reticle
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const reticleSize = 50;
    
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    
    // Crosshair
    ctx.beginPath();
    ctx.moveTo(centerX - reticleSize, centerY);
    ctx.lineTo(centerX - 10, centerY);
    ctx.moveTo(centerX + 10, centerY);
    ctx.lineTo(centerX + reticleSize, centerY);
    ctx.moveTo(centerX, centerY - reticleSize);
    ctx.lineTo(centerX, centerY - 10);
    ctx.moveTo(centerX, centerY + 10);
    ctx.lineTo(centerX, centerY + reticleSize);
    ctx.stroke();
    
    // Corner brackets
    ctx.beginPath();
    ctx.moveTo(centerX - reticleSize, centerY - reticleSize);
    ctx.lineTo(centerX - reticleSize + 15, centerY - reticleSize);
    ctx.moveTo(centerX - reticleSize, centerY - reticleSize);
    ctx.lineTo(centerX - reticleSize, centerY - reticleSize + 15);
    ctx.stroke();
  };

  const uploadImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCapturedImage(result);
      processArMockup(result);
    };
    reader.readAsDataURL(file);
  };

  const fetchArMockups = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ar-visualization', {
        body: {
          action: 'get_ar_mockups',
          isPublic: true,
          limit: 20
        }
      });

      if (error) throw error;
      setArMockups(data.data.mockups || []);
    } catch (error) {
      console.error('Error fetching AR mockups:', error);
    }
  };

  const toggleMockupVisibility = async (mockupId: string, isPublic: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('ar-visualization', {
        body: {
          action: 'update_mockup_visibility',
          mockupId,
          isPublic
        }
      });

      if (error) throw error;
      
      setArMockups(prev => prev.map(mockup => 
        mockup.id === mockupId ? { ...mockup, is_public: isPublic } : mockup
      ));
      
      toast.success(`Mockup ${isPublic ? 'published' : 'made private'} successfully`);
    } catch (error) {
      console.error('Error updating mockup visibility:', error);
      toast.error('Failed to update mockup visibility');
    }
  };

  const availableModifications = [
    'Engine Swap',
    'Turbocharger',
    'Supercharger',
    'Cold Air Intake',
    'Exhaust System',
    'Suspension',
    'Wheels & Tires',
    'Body Kit',
    'Spoiler',
    'Hood',
    'Intercooler',
    'Fuel System'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            AR Visualization Studio
          </h1>
          <p className="text-muted-foreground mt-2">
            Project AI-generated mockups onto your real car using augmented reality
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            AR Settings
          </Button>
          <Button 
            onClick={cameraActive ? stopCamera : startCamera}
            className={cameraActive ? 'bg-red-600 hover:bg-red-700' : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'}
          >
            <Camera className="h-4 w-4 mr-2" />
            {cameraActive ? 'Stop Camera' : 'Start AR Camera'}
          </Button>
        </div>
      </div>

      {/* Device Orientation Warning */}
      {deviceOrientation === 'portrait' && (
        <Alert>
          <Smartphone className="h-4 w-4" />
          <AlertDescription>
            For the best AR experience, please rotate your device to landscape mode.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main AR View */}
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  AR Camera View
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={uploadImage}
                    disabled={isProcessing}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  {cameraActive && (
                    <Button 
                      onClick={capturePhoto}
                      disabled={isProcessing}
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Capture & Process
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                {cameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    {/* AR Overlay UI */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Targeting reticle */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <Crosshair className="h-12 w-12 text-orange-500 animate-pulse" />
                      </div>
                      
                      {/* Corner guides */}
                      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-orange-500" />
                      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-orange-500" />
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-orange-500" />
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-orange-500" />
                      
                      {/* Status overlay */}
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-orange-500/90 text-white">
                          <Eye className="h-3 w-3 mr-1" />
                          AR Ready - Point at your vehicle
                        </Badge>
                      </div>
                    </div>
                  </>
                ) : capturedImage ? (
                  <img 
                    src={capturedImage} 
                    alt="Captured for AR processing" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center space-y-4">
                      <Camera className="h-16 w-16 mx-auto opacity-50" />
                      <div>
                        <p className="font-semibold">AR Camera View</p>
                        <p className="text-sm">Start camera or upload an image to begin</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <canvas 
                  ref={canvasRef} 
                  className="hidden" 
                  width={1920} 
                  height={1080}
                />
              </div>
              
              {/* Processing Overlay */}
              {isProcessing && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-orange-500 animate-spin" />
                    <span className="font-medium">{processingStep}</span>
                  </div>
                  <Progress value={processingProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    Processing AR visualization... This may take a few moments.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Mockup */}
          {currentMockup && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Generated AR Mockup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <img 
                    src={currentMockup.generated_preview_url || currentMockup.base_image_url} 
                    alt="AR Mockup"
                    className="w-full rounded-lg"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {currentMockup.views_count} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {currentMockup.likes_count} likes
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleMockupVisibility(currentMockup.id, !currentMockup.is_public)}
                      >
                        {currentMockup.is_public ? 'Make Private' : 'Make Public'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Configuration Panel */}
        <div className="space-y-4">
          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    placeholder="2015"
                    value={vehicleInfo.year}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, year: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    placeholder="Chevrolet"
                    value={vehicleInfo.make}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, make: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="Camaro"
                    value={vehicleInfo.model}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, model: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="current-engine">Current Engine</Label>
                  <Input
                    id="current-engine"
                    placeholder="Stock V6"
                    value={vehicleInfo.currentEngine}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, currentEngine: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Target Modifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AR Modifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="target-engine">Target Engine</Label>
                <Input
                  id="target-engine"
                  placeholder="LS3 V8"
                  value={targetEngine}
                  onChange={(e) => setTargetEngine(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Modifications to Visualize</Label>
                <div className="grid grid-cols-1 gap-2 mt-2 max-h-40 overflow-y-auto">
                  {availableModifications.map((mod) => (
                    <label key={mod} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedModifications.includes(mod)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedModifications([...selectedModifications, mod]);
                          } else {
                            setSelectedModifications(selectedModifications.filter(m => m !== mod));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{mod}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Selected modifications will be overlaid on your vehicle in AR
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AR Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent AR Mockups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {arMockups.length === 0 ? (
                  <p className="text-muted-foreground text-center text-sm py-8">
                    No AR mockups yet. Create your first one!
                  </p>
                ) : (
                  arMockups.slice(0, 5).map((mockup) => (
                    <div 
                      key={mockup.id} 
                      className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => setCurrentMockup(mockup)}
                    >
                      <img 
                        src={mockup.generated_preview_url || mockup.base_image_url} 
                        alt="AR mockup thumbnail"
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {mockup.vehicle_info?.year} {mockup.vehicle_info?.make} {mockup.vehicle_info?.model}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {mockup.modifications?.length || 0} mods
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {mockup.views_count} views
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AR Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>AR Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Lighting</Label>
              <Select 
                value={arSettings.lighting} 
                onValueChange={(value: any) => setArSettings({...arSettings, lighting: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enhanced">Enhanced</SelectItem>
                  <SelectItem value="realistic">Realistic</SelectItem>
                  <SelectItem value="dramatic">Dramatic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Render Quality</Label>
              <Select 
                value={arSettings.render_quality} 
                onValueChange={(value: any) => setArSettings({...arSettings, render_quality: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (Faster)</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High (Better Quality)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm">Reflections</span>
                <input
                  type="checkbox"
                  checked={arSettings.reflections}
                  onChange={(e) => setArSettings({...arSettings, reflections: e.target.checked})}
                  className="rounded border-gray-300"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm">Shadows</span>
                <input
                  type="checkbox"
                  checked={arSettings.shadows}
                  onChange={(e) => setArSettings({...arSettings, shadows: e.target.checked})}
                  className="rounded border-gray-300"
                />
              </label>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowSettings(false)}>
                Apply Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default ARVisualization;