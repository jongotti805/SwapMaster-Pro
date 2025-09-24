import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  BarChart3,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PremiumGuard from '@/components/features/PremiumGuard';
import PremiumPartsSearch from '@/components/features/PremiumPartsSearch';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  status: 'needed' | 'ordered' | 'received' | 'installed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost: number;
  actualCost?: number;
  supplier?: string;
  orderDate?: string;
  receivedDate?: string;
  notes?: string;
  project: string;
  image?: string;
  partNumber?: string;
  quantity: number;
  quantityReceived?: number;
}

const PartsInventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    status: 'needed',
    priority: 'medium',
    estimatedCost: 0,
    supplier: '',
    notes: '',
    project: '',
    partNumber: '',
    quantity: 1
  });

  const categories = [
    'Engine',
    'Transmission',
    'Electrical',
    'Exhaust',
    'Fuel System',
    'Cooling',
    'Suspension',
    'Brakes',
    'Interior',
    'Exterior',
    'Tools',
    'Hardware'
  ];

  const projects = [
    'LS3 Camaro Build',
    '4.3L Silverado Refresh',
    'Turbo Miata Project',
    'BMW E30 Restoration'
  ];

  useEffect(() => {
    // Load sample inventory data
    const sampleData: InventoryItem[] = [
      {
        id: '1',
        name: 'LS3 Engine Block',
        category: 'Engine',
        status: 'received',
        priority: 'critical',
        estimatedCost: 4500,
        actualCost: 4200,
        supplier: 'GM Performance',
        orderDate: '2025-05-15',
        receivedDate: '2025-05-22',
        project: 'LS3 Camaro Build',
        partNumber: 'GM-LS3-BLOCK',
        quantity: 1,
        quantityReceived: 1,
        notes: 'Remanufactured block, includes pistons and rods'
      },
      {
        id: '2',
        name: 'Wiring Harness Adapter',
        category: 'Electrical',
        status: 'ordered',
        priority: 'high',
        estimatedCost: 125,
        supplier: 'PSI Conversion',
        orderDate: '2025-06-01',
        project: 'LS3 Camaro Build',
        partNumber: 'PSI-HRNS-LS3',
        quantity: 1,
        notes: 'Plug-and-play harness for LS3 swap'
      },
      {
        id: '3',
        name: 'Performance Headers',
        category: 'Exhaust',
        status: 'needed',
        priority: 'medium',
        estimatedCost: 245,
        project: 'LS3 Camaro Build',
        quantity: 1,
        notes: 'Long tube headers for improved flow'
      },
      {
        id: '4',
        name: 'Motor Mount Set',
        category: 'Engine',
        status: 'installed',
        priority: 'high',
        estimatedCost: 89,
        actualCost: 76,
        supplier: 'AutoZone',
        orderDate: '2025-05-10',
        receivedDate: '2025-05-12',
        project: '4.3L Silverado Refresh',
        partNumber: 'DEA-A2242',
        quantity: 2,
        quantityReceived: 2,
        notes: 'Heavy-duty mounts for V6 engine'
      },
      {
        id: '5',
        name: 'Fuel Pump',
        category: 'Fuel System',
        status: 'needed',
        priority: 'critical',
        estimatedCost: 165,
        project: 'LS3 Camaro Build',
        quantity: 1,
        notes: 'High-flow pump for performance application'
      }
    ];
    
    setInventory(sampleData);
    setFilteredInventory(sampleData);
  }, []);

  useEffect(() => {
    let filtered = inventory.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
      const matchesProject = selectedProject === 'all' || item.project === selectedProject;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority && matchesProject;
    });

    setFilteredInventory(filtered);
  }, [inventory, searchTerm, statusFilter, categoryFilter, priorityFilter, selectedProject]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'needed': return 'bg-red-500';
      case 'ordered': return 'bg-yellow-500';
      case 'received': return 'bg-blue-500';
      case 'installed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleAddItem = () => {
    const id = Date.now().toString();
    const item: InventoryItem = {
      ...newItem,
      id,
      estimatedCost: Number(newItem.estimatedCost),
      quantity: Number(newItem.quantity),
      status: newItem.status as any,
      priority: newItem.priority as any
    };
    
    setInventory([...inventory, item]);
    setNewItem({
      name: '',
      category: '',
      status: 'needed',
      priority: 'medium',
      estimatedCost: 0,
      supplier: '',
      notes: '',
      project: '',
      partNumber: '',
      quantity: 1
    });
    setShowAddDialog(false);
  };

  const handleStatusChange = (itemId: string, newStatus: string) => {
    setInventory(inventory.map(item => 
      item.id === itemId 
        ? { ...item, status: newStatus as any, receivedDate: newStatus === 'received' ? new Date().toISOString().split('T')[0] : item.receivedDate }
        : item
    ));
  };

  const getProjectStats = () => {
    const stats = {
      totalItems: inventory.length,
      needed: inventory.filter(item => item.status === 'needed').length,
      ordered: inventory.filter(item => item.status === 'ordered').length,
      received: inventory.filter(item => item.status === 'received').length,
      installed: inventory.filter(item => item.status === 'installed').length,
      totalEstimated: inventory.reduce((sum, item) => sum + item.estimatedCost, 0),
      totalActual: inventory.reduce((sum, item) => sum + (item.actualCost || 0), 0)
    };
    
    const completionPercentage = stats.totalItems > 0 ? ((stats.received + stats.installed) / stats.totalItems) * 100 : 0;
    
    return { ...stats, completionPercentage };
  };

  const stats = getProjectStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Parts Inventory
          </h1>
          <p className="text-slate-400 mt-1">
            Track and manage parts for your engine swap projects
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Part
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-slate-200">Add New Part</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Add a new part to your inventory tracking
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Part Name</Label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="bg-slate-700/50 border-slate-600"
                    placeholder="Enter part name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Category</Label>
                    <Select value={newItem.category} onValueChange={(value) => setNewItem({...newItem, category: value})}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-300">Priority</Label>
                    <Select value={newItem.priority} onValueChange={(value) => setNewItem({...newItem, priority: value})}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Estimated Cost</Label>
                    <Input
                      type="number"
                      value={newItem.estimatedCost}
                      onChange={(e) => setNewItem({...newItem, estimatedCost: Number(e.target.value)})}
                      className="bg-slate-700/50 border-slate-600"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-300">Quantity</Label>
                    <Input
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
                      className="bg-slate-700/50 border-slate-600"
                      placeholder="1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">Project</Label>
                  <Select value={newItem.project} onValueChange={(value) => setNewItem({...newItem, project: value})}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {projects.map((project) => (
                        <SelectItem key={project} value={project}>{project}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">Notes</Label>
                  <Textarea
                    value={newItem.notes}
                    onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                    className="bg-slate-700/50 border-slate-600"
                    placeholder="Additional notes..."
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleAddItem} className="flex-1">
                    Add Part
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Parts</CardTitle>
            <Package className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalItems}</div>
            <Progress value={stats.completionPercentage} className="mt-2 h-2" />
            <p className="text-xs text-slate-400 mt-1">
              {stats.completionPercentage.toFixed(0)}% complete
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Estimated Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${stats.totalEstimated.toLocaleString()}</div>
            <p className="text-xs text-slate-400">
              Actual: ${stats.totalActual.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.ordered}</div>
            <p className="text-xs text-slate-400">
              {stats.needed} still needed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Ready to Install</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.received}</div>
            <p className="text-xs text-slate-400">
              {stats.installed} already installed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
          <TabsTrigger value="search" className="flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            Premium Parts Search
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-6 mt-6">
          {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search parts..."
                className="pl-10 bg-slate-700/50 border-slate-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="needed">Needed</SelectItem>
                <SelectItem value="ordered">Ordered</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="installed">Installed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project} value={project}>{project}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200">Parts Inventory</CardTitle>
          <CardDescription className="text-slate-400">
            Manage your parts across all projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-slate-300">Part Name</TableHead>
                <TableHead className="text-slate-300">Category</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Priority</TableHead>
                <TableHead className="text-slate-300">Cost</TableHead>
                <TableHead className="text-slate-300">Project</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-200">{item.name}</p>
                      {item.partNumber && (
                        <p className="text-sm text-slate-400">{item.partNumber}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-slate-600">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.status}
                      onValueChange={(value) => handleStatusChange(item.id, value)}
                    >
                      <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`} />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="needed">Needed</SelectItem>
                        <SelectItem value="ordered">Ordered</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="installed">Installed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getPriorityColor(item.priority)} text-white`}>
                      {item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-slate-200">${item.estimatedCost}</p>
                      {item.actualCost && (
                        <p className="text-sm text-green-400">Actual: ${item.actualCost}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-slate-300 text-sm">{item.project}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </TabsContent>
        
        <TabsContent value="search" className="mt-6">
          <PremiumGuard
            requiredCredits={1}
            featureName="Premium Parts Search"
            featureDescription="Search AutoZone's database for compatible parts specific to your vehicle and build requirements."
          >
            <PremiumPartsSearch />
          </PremiumGuard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PartsInventory;
