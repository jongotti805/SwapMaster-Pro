import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Wrench,
  Building2,
  Users,
  BarChart3,
  DollarSign,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Plus,
  Settings,
  User,
  Car,
  Award,
  Star,
  MapPin,
  Phone,
  Globe,
  Crown,
  Zap,
  CheckCircle,
  AlertTriangle,
  Package,
  CreditCard,
  Download,
  FileText,
  Upload,
  Activity,
  PieChart,
  LineChart,
  Briefcase,
  Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

interface ProfessionalAccount {
  id: string;
  business_name: string;
  business_type: string;
  business_address: string;
  phone: string;
  website: string;
  specialties: string[];
  hourly_rate: number;
  certification_level: string;
  years_experience: number;
  team_size: number;
  is_verified: boolean;
  created_at: string;
}

interface CustomerProject {
  id: string;
  customer_id: string;
  project_name: string;
  project_description: string;
  project_type: string;
  vehicle_info: any;
  project_status: string;
  estimated_cost: number;
  actual_cost: number;
  progress_percentage: number;
  start_date: string;
  completion_date: string;
  created_at: string;
}

interface BusinessAnalytics {
  totalRevenue: number;
  totalProjects: number;
  activeProjects: number;
  avgProjectValue: number;
  avgSatisfaction: number;
  conversionRate: number;
  topServices: { service: string; count: number }[];
  dailyMetrics: any[];
}

interface CreditPackage {
  package: string;
  credits: number;
  basePrice: number;
  discount: number;
}

const ProfessionalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [professionalAccount, setProfessionalAccount] = useState<ProfessionalAccount | null>(null);
  const [projects, setProjects] = useState<CustomerProject[]>([]);
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewProject, setShowNewProject] = useState(false);
  const [showBulkCredits, setShowBulkCredits] = useState(false);
  const [selectedProject, setSelectedProject] = useState<CustomerProject | null>(null);
  const [showUpdateProgress, setShowUpdateProgress] = useState(false);

  // New project form
  const [newProject, setNewProject] = useState({
    customerId: '',
    projectName: '',
    projectDescription: '',
    projectType: 'engine_swap',
    vehicleInfo: {
      year: '',
      make: '',
      model: '',
      engine: ''
    },
    targetSpecs: {},
    estimatedCost: '',
    estimatedDuration: ''
  });

  // Progress update form
  const [progressUpdate, setProgressUpdate] = useState({
    updateType: 'progress',
    title: '',
    description: '',
    progressPercentage: 0,
    images: [] as string[],
    partsUsed: [] as any[],
    timeSpent: '',
    costIncurred: ''
  });

  const [selectedCreditPackage, setSelectedCreditPackage] = useState<CreditPackage | null>(null);

  const creditPackages: CreditPackage[] = [
    { package: '500_credits', credits: 500, basePrice: 50, discount: 0.20 },
    { package: '1000_credits', credits: 1000, basePrice: 90, discount: 0.25 },
    { package: '5000_credits', credits: 5000, basePrice: 400, discount: 0.30 }
  ];

  useEffect(() => {
    if (user) {
      fetchProfessionalData();
    }
  }, [user]);

  const fetchProfessionalData = async () => {
    try {
      setLoading(true);
      
      // Check if user has professional account
      const { data: profData, error: profError } = await supabase
        .from('professional_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profError && profError.code !== 'PGRST116') {
        throw profError;
      }

      if (profData) {
        setProfessionalAccount(profData);
        await fetchBusinessAnalytics();
        await fetchCustomerProjects();
      }
    } catch (error) {
      console.error('Error fetching professional data:', error);
      toast.error('Failed to load professional dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessAnalytics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('professional-analytics', {
        body: {
          action: 'get_business_analytics',
          dateRange: '30d'
        }
      });

      if (error) throw error;
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchCustomerProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const createProject = async () => {
    if (!newProject.projectName || !newProject.customerId || !newProject.estimatedCost) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('professional-analytics', {
        body: {
          action: 'create_customer_project',
          customerId: newProject.customerId,
          projectName: newProject.projectName,
          projectDescription: newProject.projectDescription,
          projectType: newProject.projectType,
          vehicleInfo: newProject.vehicleInfo,
          targetSpecs: newProject.targetSpecs,
          estimatedCost: parseFloat(newProject.estimatedCost),
          estimatedDuration: parseInt(newProject.estimatedDuration)
        }
      });

      if (error) throw error;

      toast.success('Customer project created successfully!');
      setShowNewProject(false);
      setNewProject({
        customerId: '',
        projectName: '',
        projectDescription: '',
        projectType: 'engine_swap',
        vehicleInfo: { year: '', make: '', model: '', engine: '' },
        targetSpecs: {},
        estimatedCost: '',
        estimatedDuration: ''
      });
      fetchCustomerProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const updateProjectProgress = async () => {
    if (!selectedProject || !progressUpdate.description) {
      toast.error('Please fill in the progress description');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('professional-analytics', {
        body: {
          action: 'update_project_progress',
          projectId: selectedProject.id,
          updateType: progressUpdate.updateType,
          title: progressUpdate.title,
          description: progressUpdate.description,
          progressPercentage: progressUpdate.progressPercentage,
          images: progressUpdate.images,
          partsUsed: progressUpdate.partsUsed,
          timeSpent: parseFloat(progressUpdate.timeSpent),
          costIncurred: parseFloat(progressUpdate.costIncurred)
        }
      });

      if (error) throw error;

      toast.success('Project progress updated successfully!');
      setShowUpdateProgress(false);
      setSelectedProject(null);
      setProgressUpdate({
        updateType: 'progress',
        title: '',
        description: '',
        progressPercentage: 0,
        images: [],
        partsUsed: [],
        timeSpent: '',
        costIncurred: ''
      });
      fetchCustomerProjects();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update project progress');
    }
  };

  const purchaseBulkCredits = async (creditPackage: CreditPackage) => {
    if (!user) {
      toast.error('Please log in to purchase credits');
      return;
    }

    try {
      setSelectedCreditPackage(creditPackage);
      
      // Create checkout session through Supabase function
      const { data, error } = await supabase.functions.invoke('purchase-credits', {
        body: {
          planType: creditPackage.package,
          customerEmail: user.email,
          isSubscription: false
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
    } catch (error: any) {
      console.error('Error purchasing credits:', error);
      toast.error(error.message || 'Failed to initiate purchase');
      setSelectedCreditPackage(null);
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'approved': return 'bg-emerald-500';
      case 'quoted': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCertificationBadge = (level: string) => {
    switch (level) {
      case 'elite':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500"><Crown className="h-3 w-3 mr-1" />Elite</Badge>;
      case 'premium':
        return <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500"><Star className="h-3 w-3 mr-1" />Premium</Badge>;
      default:
        return <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />Standard</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-muted-foreground">Loading professional dashboard...</p>
        </div>
      </div>
    );
  }

  if (!professionalAccount) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Professional Mode
            </h1>
            <p className="text-muted-foreground">
              Unlock advanced B2B features designed for tuner shops and performance professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-500" />
                  Customer Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Project tracking and management</li>
                  <li>• Customer communication tools</li>
                  <li>• Progress updates and photos</li>
                  <li>• Digital work orders</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-500" />
                  Business Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Revenue and profit tracking</li>
                  <li>• Customer insights and trends</li>
                  <li>• Service performance metrics</li>
                  <li>• Automated reporting</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-500" />
                  Bulk Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Volume discounts up to 30%</li>
                  <li>• Bulk credit purchasing</li>
                  <li>• Team credit management</li>
                  <li>• Usage analytics</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Alert>
              <Building2 className="h-4 w-4" />
              <AlertDescription>
                Professional Mode is designed for established tuner shops, performance centers, and automotive businesses. 
                Apply now to unlock advanced features and bulk pricing.
              </AlertDescription>
            </Alert>
            
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Building2 className="h-5 w-5 mr-2" />
              Apply for Professional Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Professional Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              {professionalAccount.business_name} • {professionalAccount.business_type.replace('_', ' ')}
            </p>
          </div>
          {getCertificationBadge(professionalAccount.certification_level)}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkCredits(true)}>
            <CreditCard className="h-4 w-4 mr-2" />
            Bulk Credits
          </Button>
          <Button onClick={() => setShowNewProject(true)} className="bg-gradient-to-r from-purple-600 to-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                    <p className="text-2xl font-bold">${analytics?.totalRevenue.toFixed(0) || '0'}</p>
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +12.5% from last month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Active Projects</p>
                    <p className="text-2xl font-bold">{analytics?.activeProjects || 0}</p>
                    <p className="text-xs text-blue-600">In progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Project Value</p>
                    <p className="text-2xl font-bold">${analytics?.avgProjectValue.toFixed(0) || '0'}</p>
                    <p className="text-xs text-purple-600">Per project</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Rating</p>
                    <p className="text-2xl font-bold">{analytics?.avgSatisfaction.toFixed(1) || '0.0'}</p>
                    <p className="text-xs text-yellow-600">Out of 5.0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Business Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {professionalAccount.business_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{professionalAccount.business_name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span className="capitalize">{professionalAccount.business_type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{professionalAccount.business_address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{professionalAccount.phone}</span>
                        </div>
                        {professionalAccount.website && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Globe className="h-4 w-4" />
                            <span>{professionalAccount.website}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {professionalAccount.years_experience} years experience
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {professionalAccount.team_size} team member{professionalAccount.team_size !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            ${professionalAccount.hourly_rate}/hour
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {professionalAccount.is_verified ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {professionalAccount.is_verified ? 'Verified Professional' : 'Verification Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {professionalAccount.specialties && professionalAccount.specialties.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">Specialties:</p>
                        <div className="flex flex-wrap gap-1">
                          {professionalAccount.specialties.map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Project completed: LS3 Camaro Swap</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>New customer inquiry received</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span>Quote sent: Twin Turbo Setup</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span>Customer review received (5 stars)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Projects</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('projects')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{project.project_name}</h4>
                        <div className={`w-2 h-2 rounded-full ${getProjectStatusColor(project.project_status)}`} />
                        <Badge variant="outline" className="text-xs capitalize">
                          {project.project_status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Car className="h-3 w-3" />
                          {project.vehicle_info?.year} {project.vehicle_info?.make} {project.vehicle_info?.model}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${project.estimated_cost}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-medium">{project.progress_percentage}%</p>
                        <Progress value={project.progress_percentage} className="w-20" />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedProject(project);
                          setShowUpdateProgress(true);
                        }}
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                ))}
                
                {projects.length === 0 && (
                  <div className="text-center py-12">
                    <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No projects yet</p>
                    <Button onClick={() => setShowNewProject(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Project
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Customer Projects</h2>
            <Button onClick={() => setShowNewProject(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {projects.filter(p => p.project_status === 'in_progress').length}
                  </p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {projects.filter(p => p.project_status === 'quoted').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Quoted</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {projects.filter(p => p.project_status === 'completed').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    ${projects.reduce((sum, p) => sum + (p.estimated_cost || 0), 0).toFixed(0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{project.project_name}</h3>
                          <div className={`w-3 h-3 rounded-full ${getProjectStatusColor(project.project_status)}`} />
                          <Badge variant="outline" className="text-xs capitalize">
                            {project.project_status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{project.project_description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {project.vehicle_info?.year} {project.vehicle_info?.make} {project.vehicle_info?.model}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Started {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">${project.estimated_cost}</p>
                        <p className="text-sm text-muted-foreground">Estimated</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Progress:</span>
                          <Progress value={project.progress_percentage} className="w-32" />
                          <span className="text-sm font-medium">{project.progress_percentage}%</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedProject(project);
                            setShowUpdateProgress(true);
                          }}
                        >
                          Update Progress
                        </Button>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue Growth</p>
                    <p className="text-2xl font-bold">+15.3%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-bold">{analytics?.conversionRate.toFixed(1) || '0'}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Repeat Customers</p>
                    <p className="text-2xl font-bold">68%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Project Time</p>
                    <p className="text-2xl font-bold">28 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.topServices?.map((service, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{service.service}</span>
                      <Badge variant="outline">{service.count} projects</Badge>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-center py-8">No service data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <LineChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Revenue chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Customer management features coming soon</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Track customer preferences, project history, and communication
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Project Dialog */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Customer Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer-id">Customer Email/ID *</Label>
                <Input
                  id="customer-id"
                  placeholder="customer@email.com"
                  value={newProject.customerId}
                  onChange={(e) => setNewProject({...newProject, customerId: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="project-type">Project Type</Label>
                <Select value={newProject.projectType} onValueChange={(value) => 
                  setNewProject({...newProject, projectType: value})
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="engine_swap">Engine Swap</SelectItem>
                    <SelectItem value="turbo_install">Turbo Installation</SelectItem>
                    <SelectItem value="suspension">Suspension Work</SelectItem>
                    <SelectItem value="custom_build">Custom Build</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="project-name">Project Name *</Label>
              <Input
                id="project-name"
                placeholder="LS3 Swap - 2015 Camaro"
                value={newProject.projectName}
                onChange={(e) => setNewProject({...newProject, projectName: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="project-description">Project Description</Label>
              <Textarea
                id="project-description"
                placeholder="Detailed description of the project scope and requirements..."
                value={newProject.projectDescription}
                onChange={(e) => setNewProject({...newProject, projectDescription: e.target.value})}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicle-year">Vehicle Year</Label>
                <Input
                  id="vehicle-year"
                  placeholder="2015"
                  value={newProject.vehicleInfo.year}
                  onChange={(e) => setNewProject({
                    ...newProject,
                    vehicleInfo: {...newProject.vehicleInfo, year: e.target.value}
                  })}
                />
              </div>
              <div>
                <Label htmlFor="vehicle-make">Make</Label>
                <Input
                  id="vehicle-make"
                  placeholder="Chevrolet"
                  value={newProject.vehicleInfo.make}
                  onChange={(e) => setNewProject({
                    ...newProject,
                    vehicleInfo: {...newProject.vehicleInfo, make: e.target.value}
                  })}
                />
              </div>
              <div>
                <Label htmlFor="vehicle-model">Model</Label>
                <Input
                  id="vehicle-model"
                  placeholder="Camaro"
                  value={newProject.vehicleInfo.model}
                  onChange={(e) => setNewProject({
                    ...newProject,
                    vehicleInfo: {...newProject.vehicleInfo, model: e.target.value}
                  })}
                />
              </div>
              <div>
                <Label htmlFor="vehicle-engine">Current Engine</Label>
                <Input
                  id="vehicle-engine"
                  placeholder="Stock V6"
                  value={newProject.vehicleInfo.engine}
                  onChange={(e) => setNewProject({
                    ...newProject,
                    vehicleInfo: {...newProject.vehicleInfo, engine: e.target.value}
                  })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimated-cost">Estimated Cost (USD) *</Label>
                <Input
                  id="estimated-cost"
                  type="number"
                  placeholder="15000"
                  value={newProject.estimatedCost}
                  onChange={(e) => setNewProject({...newProject, estimatedCost: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="estimated-duration">Estimated Duration (Days)</Label>
                <Input
                  id="estimated-duration"
                  type="number"
                  placeholder="30"
                  value={newProject.estimatedDuration}
                  onChange={(e) => setNewProject({...newProject, estimatedDuration: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowNewProject(false)}>
                Cancel
              </Button>
              <Button onClick={createProject}>
                Create Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Progress Dialog */}
      <Dialog open={showUpdateProgress} onOpenChange={setShowUpdateProgress}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Project Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="update-type">Update Type</Label>
              <Select value={progressUpdate.updateType} onValueChange={(value) => 
                setProgressUpdate({...progressUpdate, updateType: value})
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="progress">Progress Update</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="issue">Issue/Delay</SelectItem>
                  <SelectItem value="completion">Completion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="update-title">Update Title</Label>
              <Input
                id="update-title"
                placeholder="Engine installation completed"
                value={progressUpdate.title}
                onChange={(e) => setProgressUpdate({...progressUpdate, title: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="update-description">Description *</Label>
              <Textarea
                id="update-description"
                placeholder="Describe the progress made, parts used, or issues encountered..."
                value={progressUpdate.description}
                onChange={(e) => setProgressUpdate({...progressUpdate, description: e.target.value})}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="progress-percentage">Progress Percentage</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="progress-percentage"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="75"
                  value={progressUpdate.progressPercentage}
                  onChange={(e) => setProgressUpdate({...progressUpdate, progressPercentage: parseInt(e.target.value) || 0})}
                  className="w-24"
                />
                <Progress value={progressUpdate.progressPercentage} className="flex-1" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time-spent">Time Spent (Hours)</Label>
                <Input
                  id="time-spent"
                  type="number"
                  step="0.5"
                  placeholder="8.5"
                  value={progressUpdate.timeSpent}
                  onChange={(e) => setProgressUpdate({...progressUpdate, timeSpent: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="cost-incurred">Cost Incurred (USD)</Label>
                <Input
                  id="cost-incurred"
                  type="number"
                  placeholder="1200"
                  value={progressUpdate.costIncurred}
                  onChange={(e) => setProgressUpdate({...progressUpdate, costIncurred: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowUpdateProgress(false)}>
                Cancel
              </Button>
              <Button onClick={updateProjectProgress}>
                Update Progress
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Credits Dialog */}
      <Dialog open={showBulkCredits} onOpenChange={setShowBulkCredits}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Credit Packages</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Save money with bulk credit purchases. Professional accounts get exclusive discounts.
            </p>
            
            {creditPackages.map((pkg) => (
              <div 
                key={pkg.package} 
                className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedCreditPackage?.package === pkg.package ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''
                }`}
                onClick={() => setSelectedCreditPackage(pkg)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{pkg.credits.toLocaleString()} Credits</h4>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      ${(pkg.basePrice * (1 - pkg.discount)).toFixed(0)}
                    </p>
                    {pkg.discount > 0 && (
                      <p className="text-sm text-muted-foreground line-through">
                        ${pkg.basePrice}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    ${(pkg.basePrice * (1 - pkg.discount) / pkg.credits * 1000).toFixed(2)} per 1K credits
                  </span>
                  {pkg.discount > 0 && (
                    <Badge className="bg-emerald-500">
                      Save {(pkg.discount * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowBulkCredits(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedCreditPackage && purchaseBulkCredits(selectedCreditPackage)}
                disabled={!selectedCreditPackage}
              >
                Purchase Credits
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessionalDashboard;