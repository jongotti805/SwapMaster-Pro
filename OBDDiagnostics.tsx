import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Bluetooth,
  Wifi,
  Zap,
  Search,
  Download,
  Play,
  Square,
  RefreshCw,
  Car,
  Gauge
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DiagnosticCode {
  code: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  category: string;
  commonCauses: string[];
  symptoms: string[];
  diagnosticSteps: string[];
  estimatedRepairCost: string;
  urgency: string;
}

interface LiveData {
  parameter: string;
  value: string | number;
  unit: string;
  min: number;
  max: number;
  status: 'normal' | 'warning' | 'critical';
}

const OBDDiagnostics: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [codes, setCodes] = useState<DiagnosticCode[]>([]);
  const [liveData, setLiveData] = useState<LiveData[]>([]);
  const [connectionType, setConnectionType] = useState<'bluetooth' | 'wifi' | 'usb'>('bluetooth');
  const [scanProgress, setScanProgress] = useState(0);
  const [vehicleInfo, setVehicleInfo] = useState({
    vin: 'Unknown',
    year: 'Unknown',
    make: 'Unknown',
    model: 'Unknown',
    engine: 'Unknown'
  });

  useEffect(() => {
    // Load sample diagnostic codes
    const fetchCodes = async () => {
      try {
        const response = await fetch('/data/obd-codes.json');
        const data = await response.json();
        setCodes(data);
      } catch (error) {
        console.error('Error fetching OBD codes:', error);
      }
    };

    fetchCodes();

    // Simulate live data updates when connected
    if (isConnected) {
      const interval = setInterval(() => {
        setLiveData([
          {
            parameter: 'Engine RPM',
            value: Math.floor(Math.random() * 2000) + 800,
            unit: 'RPM',
            min: 0,
            max: 6000,
            status: 'normal'
          },
          {
            parameter: 'Vehicle Speed',
            value: Math.floor(Math.random() * 60),
            unit: 'mph',
            min: 0,
            max: 120,
            status: 'normal'
          },
          {
            parameter: 'Engine Load',
            value: Math.floor(Math.random() * 100),
            unit: '%',
            min: 0,
            max: 100,
            status: Math.random() > 0.8 ? 'warning' : 'normal'
          },
          {
            parameter: 'Coolant Temp',
            value: Math.floor(Math.random() * 40) + 180,
            unit: '°F',
            min: 160,
            max: 220,
            status: 'normal'
          },
          {
            parameter: 'Intake Air Temp',
            value: Math.floor(Math.random() * 50) + 70,
            unit: '°F',
            min: 32,
            max: 200,
            status: 'normal'
          },
          {
            parameter: 'O2 Sensor Bank 1',
            value: (Math.random() * 0.9 + 0.1).toFixed(2),
            unit: 'V',
            min: 0,
            max: 1,
            status: 'normal'
          }
        ]);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const handleConnect = () => {
    setIsScanning(true);
    setScanProgress(0);
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setIsConnected(true);
          setVehicleInfo({
            vin: '1G1FB1R40E0123456',
            year: '1994',
            make: 'Chevrolet',
            model: 'Silverado',
            engine: '4.3L V6 Vortec'
          });
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setLiveData([]);
  };

  const handleDiagnosticScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // In a real app, this would trigger actual diagnostic scan
    }, 3000);
  };

  const clearCodes = () => {
    setCodes([]);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            OBD-II Diagnostics
          </h1>
          <p className="text-slate-400 mt-1">
            Real-time engine diagnostics and trouble code analysis
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <Badge variant="outline" className={`border-${isConnected ? 'green' : 'red'}-500 text-${isConnected ? 'green' : 'red'}-400`}>
            <Activity className="h-3 w-3 mr-1" />
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center">
            <Bluetooth className="h-5 w-5 mr-2" />
            Scanner Connection
          </CardTitle>
          <CardDescription className="text-slate-400">
            Connect to your OBD-II scanner to begin diagnostics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => setConnectionType('bluetooth')}
                  variant={connectionType === 'bluetooth' ? 'default' : 'outline'}
                  size="sm"
                >
                  <Bluetooth className="h-4 w-4 mr-2" />
                  Bluetooth
                </Button>
                <Button
                  onClick={() => setConnectionType('wifi')}
                  variant={connectionType === 'wifi' ? 'default' : 'outline'}
                  size="sm"
                >
                  <Wifi className="h-4 w-4 mr-2" />
                  WiFi
                </Button>
                <Button
                  onClick={() => setConnectionType('usb')}
                  variant={connectionType === 'usb' ? 'default' : 'outline'}
                  size="sm"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  USB
                </Button>
              </div>
              
              {isScanning ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Connecting to scanner...</span>
                    <span className="text-slate-400">{scanProgress}%</span>
                  </div>
                  <Progress value={scanProgress} className="h-2" />
                </div>
              ) : (
                <Button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-700">
                  <Search className="h-4 w-4 mr-2" />
                  Connect Scanner
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-slate-300 font-medium mb-2">Vehicle Information</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-400">VIN: <span className="text-slate-200">{vehicleInfo.vin}</span></p>
                    <p className="text-slate-400">Year: <span className="text-slate-200">{vehicleInfo.year}</span></p>
                    <p className="text-slate-400">Make: <span className="text-slate-200">{vehicleInfo.make}</span></p>
                    <p className="text-slate-400">Model: <span className="text-slate-200">{vehicleInfo.model}</span></p>
                    <p className="text-slate-400">Engine: <span className="text-slate-200">{vehicleInfo.engine}</span></p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-slate-300 font-medium mb-2">Connection Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-slate-300">Connected via {connectionType}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-slate-300">Real-time data streaming</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleDiagnosticScan} disabled={isScanning}>
                  {isScanning ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Diagnostic Scan
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleDisconnect}>
                  <Square className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      {isConnected && (
        <Tabs defaultValue="live-data" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
            <TabsTrigger value="live-data">Live Data</TabsTrigger>
            <TabsTrigger value="trouble-codes">Trouble Codes</TabsTrigger>
            <TabsTrigger value="readiness">Readiness Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="live-data" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-200">Live Engine Data</CardTitle>
                <CardDescription className="text-slate-400">
                  Real-time sensor readings from your vehicle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveData.map((data, index) => (
                    <Card key={index} className="bg-slate-700/30 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-slate-300 font-medium">{data.parameter}</h4>
                          <Gauge className={`h-4 w-4 ${getStatusColor(data.status)}`} />
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                          {data.value} {data.unit}
                        </div>
                        <div className="text-xs text-slate-400">
                          Range: {data.min} - {data.max} {data.unit}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trouble-codes" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center justify-between">
                  Diagnostic Trouble Codes
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={clearCodes}>
                      Clear Codes
                    </Button>
                    <Badge className="bg-red-500 text-white">
                      {codes.length} codes found
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Active and pending diagnostic trouble codes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {codes.length > 0 ? (
                  <div className="space-y-4">
                    {codes.map((code, index) => (
                      <Card key={index} className="bg-slate-700/30 border-slate-600">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="text-lg font-bold text-white">{code.code}</h3>
                                <Badge className={`${getSeverityColor(code.severity)} text-white`}>
                                  {code.severity}
                                </Badge>
                              </div>
                              <p className="text-slate-300">{code.description}</p>
                              <p className="text-sm text-slate-400 mt-1">Category: {code.category}</p>
                            </div>
                            <AlertTriangle className="h-6 w-6 text-yellow-400" />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <h4 className="text-slate-300 font-medium mb-2">Common Causes:</h4>
                              <ul className="text-sm text-slate-400 space-y-1">
                                {code.commonCauses.slice(0, 3).map((cause, i) => (
                                  <li key={i}>• {cause}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="text-slate-300 font-medium mb-2">Symptoms:</h4>
                              <ul className="text-sm text-slate-400 space-y-1">
                                {code.symptoms.slice(0, 3).map((symptom, i) => (
                                  <li key={i}>• {symptom}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-600">
                            <span className="text-sm text-slate-400">
                              Estimated repair cost: {code.estimatedRepairCost}
                            </span>
                            <Badge variant="outline" className="border-slate-500">
                              Urgency: {code.urgency}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">No Codes Found</h3>
                    <p className="text-slate-400">
                      Your vehicle is not reporting any diagnostic trouble codes.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="readiness" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-200">Emissions Readiness Tests</CardTitle>
                <CardDescription className="text-slate-400">
                  Status of onboard diagnostic system readiness monitors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Catalyst', status: 'Ready' },
                    { name: 'Heated Catalyst', status: 'Ready' },
                    { name: 'Evaporative System', status: 'Not Ready' },
                    { name: 'Secondary Air System', status: 'Ready' },
                    { name: 'A/C System Refrigerant', status: 'Ready' },
                    { name: 'Oxygen Sensor', status: 'Ready' },
                    { name: 'Oxygen Sensor Heater', status: 'Ready' },
                    { name: 'EGR System', status: 'Not Ready' }
                  ].map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <span className="text-slate-300">{test.name}</span>
                      <div className="flex items-center space-x-2">
                        {test.status === 'Ready' ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-400" />
                            <span className="text-green-400">Ready</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-5 w-5 text-yellow-400" />
                            <span className="text-yellow-400">Not Ready</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="h-5 w-5 text-blue-400" />
                    <h4 className="text-blue-300 font-medium">Readiness Status</h4>
                  </div>
                  <p className="text-slate-300 text-sm">
                    6 of 8 monitors are ready. Drive cycle required for remaining monitors.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12,6 12,12 16,14"></polyline>
  </svg>
);

export default OBDDiagnostics;
