import React, { useState } from 'react';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move3D,
  Palette,
  Settings,
  Share2,
  Download,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Layers,
  Eye,
  EyeOff,
  Box,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ModelViewer3D: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState('silverado-1994');
  const [modelColor, setModelColor] = useState('#3b82f6');
  const [wireframeMode, setWireframeMode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState([1]);
  const [layers, setLayers] = useState({
    body: true,
    engine: true,
    wheels: true,
    interior: false
  });

  const vehicleModels = [
    { id: 'silverado-1994', name: '1994 Chevrolet Silverado', year: 1994 },
    { id: 'mustang-1965', name: '1965 Ford Mustang', year: 1965 },
    { id: 'camaro-1967', name: '1967 Chevrolet Camaro', year: 1967 },
    { id: 'bmw-e30', name: '1987 BMW E30', year: 1987 }
  ];

  const colorPresets = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Silver', value: '#94a3b8' },
    { name: 'Black', value: '#1f2937' },
    { name: 'White', value: '#f8fafc' }
  ];

  const environments = [
    'studio',
    'city',
    'forest',
    'sunset',
    'dawn',
    'night'
  ];

  const [currentEnvironment, setCurrentEnvironment] = useState('studio');

  const resetCamera = () => {
    console.log('Camera reset');
  };

  const exportModel = () => {
    console.log('Exporting 3D model...');
  };

  const shareModel = () => {
    if (navigator.share) {
      navigator.share({
        title: 'SwapMaster Pro 3D Model',
        text: 'Check out this 3D vehicle model!',
        url: window.location.href
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            3D Model Viewer
          </h1>
          <p className="text-slate-400 mt-1">
            Interactive 3D visualization of vehicle modifications
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <Badge variant="outline" className="border-blue-500 text-blue-400">
            <Move3D className="h-3 w-3 mr-1" />
            Interactive 3D
          </Badge>
          <Button variant="outline" onClick={shareModel}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={exportModel}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Model Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Model Selection */}
              <div className="space-y-2">
                <Label className="text-slate-300">Vehicle Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {vehicleModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color Selection */}
              <div className="space-y-2">
                <Label className="text-slate-300">Vehicle Color</Label>
                <div className="grid grid-cols-3 gap-2">
                  {colorPresets.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setModelColor(color.value)}
                      className={`w-8 h-8 rounded-lg border-2 ${
                        modelColor === color.value ? 'border-white' : 'border-slate-600'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Visualization Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Wireframe Mode</Label>
                  <Switch
                    checked={wireframeMode}
                    onCheckedChange={setWireframeMode}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Auto Rotate</Label>
                  <Switch
                    checked={autoRotate}
                    onCheckedChange={setAutoRotate}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Show Grid</Label>
                  <Switch
                    checked={showGrid}
                    onCheckedChange={setShowGrid}
                  />
                </div>
              </div>

              {/* Animation Speed */}
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Animation Speed: {animationSpeed[0]}x
                </Label>
                <Slider
                  value={animationSpeed}
                  onValueChange={setAnimationSpeed}
                  max={3}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Environment */}
              <div className="space-y-2">
                <Label className="text-slate-300">Environment</Label>
                <Select value={currentEnvironment} onValueChange={setCurrentEnvironment}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {environments.map((env) => (
                      <SelectItem key={env} value={env}>
                        {env.charAt(0).toUpperCase() + env.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Camera Controls */}
              <div className="space-y-2">
                <Label className="text-slate-300">Camera Controls</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={resetCamera}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                  <Button variant="outline" size="sm">
                    <ZoomIn className="h-4 w-4 mr-1" />
                    Zoom
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Layer Controls */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200 flex items-center">
                <Layers className="h-5 w-5 mr-2" />
                Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(layers).map(([layer, visible]) => (
                <div key={layer} className="flex items-center justify-between">
                  <Label className="text-slate-300 capitalize">{layer}</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={visible}
                      onCheckedChange={(checked) => 
                        setLayers(prev => ({ ...prev, [layer]: checked }))
                      }
                    />
                    {visible ? (
                      <Eye className="h-4 w-4 text-green-400" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 3D Viewer */}
        <div className="lg:col-span-3">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200 flex items-center justify-between">
                3D Vehicle Model
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    {autoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription className="text-slate-400">
                3D model viewer currently under development
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="aspect-video bg-slate-900 rounded-b-lg overflow-hidden flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <Box className="h-24 w-24 text-slate-600 mx-auto" />
                    <div 
                      className="absolute inset-0 opacity-30"
                      style={{ 
                        backgroundColor: modelColor,
                        mask: 'url(#box-mask)',
                        WebkitMask: 'url(#box-mask)'
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-slate-300">
                      3D Model Viewer
                    </h3>
                    <p className="text-slate-400 max-w-md">
                      Full Three.js integration coming soon. This will provide interactive 
                      3D visualization of vehicle modifications and engine swaps.
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Feature in development</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Model Information */}
          <Card className="bg-slate-800/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="text-slate-200">Model Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="specs" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
                  <TabsTrigger value="specs">Specifications</TabsTrigger>
                  <TabsTrigger value="modifications">Modifications</TabsTrigger>
                  <TabsTrigger value="export">Export Options</TabsTrigger>
                </TabsList>
                
                <TabsContent value="specs" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Polygons:</span>
                      <p className="text-slate-200 font-medium">12,456</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Vertices:</span>
                      <p className="text-slate-200 font-medium">8,234</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Materials:</span>
                      <p className="text-slate-200 font-medium">8</p>
                    </div>
                    <div>
                      <span className="text-slate-400">File Size:</span>
                      <p className="text-slate-200 font-medium">2.4 MB</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="modifications" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-slate-300 font-medium">Engine Modifications</h4>
                      <ul className="text-sm text-slate-400 space-y-1">
                        <li>• LS3 6.2L V8 Engine</li>
                        <li>• Performance Headers</li>
                        <li>• Cold Air Intake</li>
                        <li>• Custom ECU Tune</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-slate-300 font-medium">Visual Modifications</h4>
                      <ul className="text-sm text-slate-400 space-y-1">
                        <li>• Lowered Suspension</li>
                        <li>• Custom Wheels</li>
                        <li>• Body Kit</li>
                        <li>• Custom Paint</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="export" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button variant="outline" size="sm">
                      Export .OBJ
                    </Button>
                    <Button variant="outline" size="sm">
                      Export .FBX
                    </Button>
                    <Button variant="outline" size="sm">
                      Export .GLTF
                    </Button>
                    <Button variant="outline" size="sm">
                      Export .STL
                    </Button>
                  </div>
                  <p className="text-sm text-slate-400">
                    Choose your preferred 3D format for export. Models include textures and materials.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModelViewer3D;
