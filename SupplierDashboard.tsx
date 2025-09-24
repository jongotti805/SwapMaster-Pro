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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ShieldCheck,
  Star,
  Award,
  Building,
  MapPin,
  Phone,
  Globe,
  Clock,
  CreditCard,
  Package,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  FileText,
  Crown,
  Zap,
  Target,
  BarChart3,
  Calendar,
  DollarSign,
  Plus,
  Settings,
  Eye,
  MessageSquare,
  ThumbsUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface SupplierProfile {
  id: string;
  business_name: string;
  business_type: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  trust_score: number;
  verification_date: string;
  specialties: string[];
  service_areas: string[];
  business_address: string;
  phone: string;
  website: string;
  business_hours: any;
  is_featured: boolean;
  created_at: string;
}

interface SupplierApplication {
  id: string;
  application_data: any;
  documents: string[];
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  reviewer_notes: string;
  created_at: string;
  updated_at: string;
}

interface SupplierSubscription {
  id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  plan_name: string;
  monthly_price: number;
}

interface SupplierProduct {
  id: string;
  product_name: string;
  category: string;
  price: number;
  condition: string;
  is_featured: boolean;
  is_active: boolean;
  views_count: number;
  inquiries_count: number;
  created_at: string;
}

const SupplierDashboard: React.FC = () => {
  const { user } = useAuth();
  const [supplierProfile, setSupplierProfile] = useState<SupplierProfile | null>(null);
  const [application, setApplication] = useState<SupplierApplication | null>(null);
  const [subscription, setSubscription] = useState<SupplierSubscription | null>(null);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplication, setShowApplication] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Application form state
  const [applicationForm, setApplicationForm] = useState({
    businessName: '',
    businessLicense: '',
    taxId: '',
    businessAddress: '',
    phone: '',
    website: '',
    businessType: 'parts_dealer',
    specialties: [] as string[],
    serviceAreas: [] as string[],
    businessHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: true }
    },
    returnPolicy: '',
    warrantyPolicy: '',
    documents: [] as string[]
  });

  const [newProduct, setNewProduct] = useState({
    productName: '',
    category: '',
    subcategory: '',
    partNumber: '',
    manufacturer: '',
    condition: 'new',
    price: '',
    description: '',
    images: [] as string[],
    specifications: {} as any,
    compatibility: [] as string[]
  });

  const [availableSpecialties] = useState([
    'Engine Parts', 'Transmission', 'Suspension', 'Brakes', 'Exhaust',
    'Turbochargers', 'Superchargers', 'Fuel Systems', 'Cooling Systems',
    'Electrical', 'Interior', 'Exterior', 'Performance', 'Racing Parts',
    'Classic/Vintage', 'Import Specialist', 'Domestic Specialist'
  ]);

  useEffect(() => {
    if (user) {
      fetchSupplierStatus();
    }
  }, [user]);

  const fetchSupplierStatus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('supplier-verification', {
        body: {
          action: 'get_verification_status'
        }
      });

      if (error) throw error;

      setSupplierProfile(data.data.supplier);
      setApplication(data.data.latestApplication);
      setSubscription(data.data.activeSubscription);
      
      if (data.data.supplier) {
        fetchSupplierProducts();
      }
    } catch (error) {
      console.error('Error fetching supplier status:', error);
      toast.error('Failed to load supplier status');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const submitApplication = async () => {
    if (!applicationForm.businessName || !applicationForm.phone || !applicationForm.businessAddress) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('supplier-verification', {
        body: {
          action: 'submit_application',
          ...applicationForm
        }
      });

      if (error) throw error;

      toast.success('Application submitted successfully!');
      setShowApplication(false);
      fetchSupplierStatus();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application');
    }
  };

  const addProduct = async () => {
    if (!newProduct.productName || !newProduct.category || !newProduct.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('supplier-verification', {
        body: {
          action: 'submit_product',
          product_name: newProduct.productName,
          category: newProduct.category,
          subcategory: newProduct.subcategory,
          part_number: newProduct.partNumber,
          manufacturer: newProduct.manufacturer,
          condition: newProduct.condition,
          price: parseFloat(newProduct.price),
          product_description: newProduct.description,
          images: newProduct.images,
          specifications: newProduct.specifications,
          compatibility: newProduct.compatibility
        }
      });

      if (error) throw error;

      toast.success('Product added successfully!');
      setNewProduct({
        productName: '',
        category: '',
        subcategory: '',
        partNumber: '',
        manufacturer: '',
        condition: 'new',
        price: '',
        description: '',
        images: [],
        specifications: {},
        compatibility: []
      });
      fetchSupplierProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    }
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      case 'suspended': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getVerificationStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'suspended': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-green-500';
    if (score >= 7.0) return 'text-yellow-500';
    if (score >= 5.0) return 'text-orange-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-muted-foreground">Loading supplier dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            Supplier Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            {supplierProfile ? 'Manage your verified supplier profile and products' : 'Join our verified supplier program'}
          </p>
        </div>
        
        <div className="flex gap-2">
          {!supplierProfile && !application && (
            <Button 
              onClick={() => setShowApplication(true)}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Apply for Verification
            </Button>
          )}
          {supplierProfile && (
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Profile Settings
            </Button>
          )}
        </div>
      </div>

      {!supplierProfile && !application ? (
        // Not Applied Yet
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                Verified Supplier Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-sm">Trust badge and verified status</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-sm">Priority listing in search results</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-sm">Advanced analytics and insights</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-sm">Customer review management</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-sm">Featured product placements</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-sm">Professional support and account management</span>
                </div>
              </div>
              <Button 
                onClick={() => setShowApplication(true)}
                className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
              >
                Start Application
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Basic Supplier</h4>
                    <Badge variant="secondary">$25/month</Badge>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Up to 50 product listings</li>
                    <li>• Basic analytics</li>
                    <li>• Email support</li>
                  </ul>
                </div>
                
                <div className="border-2 border-emerald-500 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      Premium Supplier
                      <Crown className="h-4 w-4 text-emerald-500" />
                    </h4>
                    <Badge className="bg-emerald-500">$50/month</Badge>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Up to 200 product listings</li>
                    <li>• Priority search ranking</li>
                    <li>• Featured placements</li>
                    <li>• Advanced analytics</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      Enterprise
                      <Zap className="h-4 w-4 text-blue-500" />
                    </h4>
                    <Badge variant="outline">$100/month</Badge>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Unlimited listings</li>
                    <li>• White-label tools</li>
                    <li>• Dedicated account manager</li>
                    <li>• Custom integrations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : application && !supplierProfile ? (
        // Application Submitted
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getVerificationStatusIcon(application.status)}
              Application Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getVerificationStatusColor(application.status)}`} />
                <span className="font-medium capitalize">
                  {application.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Submitted:</span>
                  <span className="ml-2">
                    {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Business Name:</span>
                  <span className="ml-2 font-medium">
                    {application.application_data.businessName}
                  </span>
                </div>
              </div>

              {application.reviewer_notes && (
                <Alert>
                  <MessageSquare className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Reviewer Notes:</strong> {application.reviewer_notes}
                  </AlertDescription>
                </Alert>
              )}

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Next Steps:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Our team will review your application within 3-5 business days</li>
                  <li>• You'll receive an email notification once the review is complete</li>
                  <li>• If approved, you can choose a subscription plan to activate your verified status</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Verified Supplier Dashboard
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Profile Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Supplier Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg">
                        {supplierProfile?.business_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{supplierProfile?.business_name}</h3>
                        <Badge className={`${getVerificationStatusColor(supplierProfile?.verification_status || '')} text-white`}>
                          {getVerificationStatusIcon(supplierProfile?.verification_status || '')}
                          <span className="ml-1 capitalize">
                            {supplierProfile?.verification_status}
                          </span>
                        </Badge>
                        {supplierProfile?.is_featured && (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                            <Crown className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {supplierProfile?.business_address}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {supplierProfile?.phone}
                        </span>
                        {supplierProfile?.website && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-4 w-4" />
                            Website
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium">Trust Score:</span>
                        <span className={`text-lg font-bold ${getTrustScoreColor(supplierProfile?.trust_score || 0)}`}>
                          {supplierProfile?.trust_score}/10
                        </span>
                        <div className="flex">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < (supplierProfile?.trust_score || 0) / 2 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      {supplierProfile?.specialties && supplierProfile.specialties.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-muted-foreground">Specialties:</span>
                          {supplierProfile.specialties.slice(0, 4).map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                          {supplierProfile.specialties.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{supplierProfile.specialties.length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Products Listed</span>
                      <span className="font-semibold">{products.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Views</span>
                      <span className="font-semibold">
                        {products.reduce((sum, p) => sum + p.views_count, 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Inquiries</span>
                      <span className="font-semibold">
                        {products.reduce((sum, p) => sum + p.inquiries_count, 0)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Member Since</span>
                      <span className="text-sm">
                        {supplierProfile?.created_at && formatDistanceToNow(new Date(supplierProfile.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Subscription Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {subscription ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{subscription.plan_name}</span>
                          <Badge className="bg-green-500">
                            {subscription.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span>${subscription.monthly_price}/month</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Renews {formatDistanceToNow(new Date(subscription.current_period_end), { addSuffix: true })}
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-3">
                          Manage Subscription
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-3">
                          No active subscription
                        </p>
                        <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-blue-600">
                          Choose Plan
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Products */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Products</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab('products')}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.slice(0, 6).map((product) => (
                    <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm truncate flex-1">{product.product_name}</h4>
                        {product.is_featured && (
                          <Badge className="bg-yellow-500 text-xs ml-2">
                            <Star className="h-3 w-3" />
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>{product.category}</span>
                          <span className="font-medium">${product.price}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {product.views_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {product.inquiries_count}
                          </span>
                          <Badge 
                            variant={product.is_active ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {product.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {products.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No products listed yet</p>
                      <Button onClick={() => setActiveTab('products')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Product
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            {/* Add Product Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Product</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product-name">Product Name *</Label>
                    <Input
                      id="product-name"
                      placeholder="LS3 6.2L V8 Crate Engine"
                      value={newProduct.productName}
                      onChange={(e) => setNewProduct({...newProduct, productName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={newProduct.category} onValueChange={(value) => 
                      setNewProduct({...newProduct, category: value})
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Engine">Engine</SelectItem>
                        <SelectItem value="Transmission">Transmission</SelectItem>
                        <SelectItem value="Suspension">Suspension</SelectItem>
                        <SelectItem value="Brakes">Brakes</SelectItem>
                        <SelectItem value="Exhaust">Exhaust</SelectItem>
                        <SelectItem value="Turbo">Turbocharger</SelectItem>
                        <SelectItem value="Performance">Performance</SelectItem>
                        <SelectItem value="Electrical">Electrical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      placeholder="GM Performance Parts"
                      value={newProduct.manufacturer}
                      onChange={(e) => setNewProduct({...newProduct, manufacturer: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="part-number">Part Number</Label>
                    <Input
                      id="part-number"
                      placeholder="19420197"
                      value={newProduct.partNumber}
                      onChange={(e) => setNewProduct({...newProduct, partNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="condition">Condition</Label>
                    <Select value={newProduct.condition} onValueChange={(value) => 
                      setNewProduct({...newProduct, condition: value})
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="used">Used</SelectItem>
                        <SelectItem value="refurbished">Refurbished</SelectItem>
                        <SelectItem value="rebuilt">Rebuilt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="price">Price (USD) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="8999.99"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your product in detail..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    rows={4}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={addProduct}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Products List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Products ({products.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{product.product_name}</h4>
                          {product.is_featured && (
                            <Badge className="bg-yellow-500 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          <Badge 
                            variant={product.is_active ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {product.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{product.category} • {product.condition}</span>
                          <span className="font-medium text-foreground">${product.price}</span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {product.views_count} views
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {product.inquiries_count} inquiries
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          {product.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {products.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No products listed yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Views</p>
                      <p className="text-2xl font-bold">
                        {products.reduce((sum, p) => sum + p.views_count, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Inquiries</p>
                      <p className="text-2xl font-bold">
                        {products.reduce((sum, p) => sum + p.inquiries_count, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Active Products</p>
                      <p className="text-2xl font-bold">
                        {products.filter(p => p.is_active).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Conversion Rate</p>
                      <p className="text-2xl font-bold">4.2%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Detailed analytics will be available here</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    View product performance, customer insights, and sales trends
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <ThumbsUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reviews yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Customer reviews will appear here once you start receiving orders
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
              </CardHeader>
              <CardContent>
                {subscription ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{subscription.plan_name}</h4>
                        <p className="text-muted-foreground">${subscription.monthly_price}/month</p>
                      </div>
                      <Badge className="bg-green-500">{subscription.status}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Current Period:</span>
                        <span className="ml-2">
                          {new Date(subscription.current_period_start).toLocaleDateString()} - 
                          {new Date(subscription.current_period_end).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Next Billing:</span>
                        <span className="ml-2">
                          {formatDistanceToNow(new Date(subscription.current_period_end), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline">
                        Change Plan
                      </Button>
                      <Button variant="outline">
                        Cancel Subscription
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No active subscription</p>
                    <Button className="bg-gradient-to-r from-emerald-600 to-blue-600">
                      Choose Subscription Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Application Dialog */}
      <Dialog open={showApplication} onOpenChange={setShowApplication}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Supplier Verification Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="business-name">Business Name *</Label>
                <Input
                  id="business-name"
                  placeholder="Performance Parts Pro"
                  value={applicationForm.businessName}
                  onChange={(e) => setApplicationForm({...applicationForm, businessName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="business-type">Business Type</Label>
                <Select value={applicationForm.businessType} onValueChange={(value) => 
                  setApplicationForm({...applicationForm, businessType: value})
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parts_dealer">Parts Dealer</SelectItem>
                    <SelectItem value="machine_shop">Machine Shop</SelectItem>
                    <SelectItem value="tuner">Tuner/Performance Shop</SelectItem>
                    <SelectItem value="fabricator">Fabricator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="business-license">Business License #</Label>
                <Input
                  id="business-license"
                  placeholder="BL123456789"
                  value={applicationForm.businessLicense}
                  onChange={(e) => setApplicationForm({...applicationForm, businessLicense: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="tax-id">Tax ID / EIN</Label>
                <Input
                  id="tax-id"
                  placeholder="12-3456789"
                  value={applicationForm.taxId}
                  onChange={(e) => setApplicationForm({...applicationForm, taxId: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="business-address">Business Address *</Label>
              <Textarea
                id="business-address"
                placeholder="123 Performance Street, Speed City, SC 12345"
                value={applicationForm.businessAddress}
                onChange={(e) => setApplicationForm({...applicationForm, businessAddress: e.target.value})}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="(555) 123-4567"
                  value={applicationForm.phone}
                  onChange={(e) => setApplicationForm({...applicationForm, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://www.yourshop.com"
                  value={applicationForm.website}
                  onChange={(e) => setApplicationForm({...applicationForm, website: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Specialties</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                {availableSpecialties.map((specialty) => (
                  <label key={specialty} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applicationForm.specialties.includes(specialty)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setApplicationForm({
                            ...applicationForm, 
                            specialties: [...applicationForm.specialties, specialty]
                          });
                        } else {
                          setApplicationForm({
                            ...applicationForm,
                            specialties: applicationForm.specialties.filter(s => s !== specialty)
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{specialty}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="return-policy">Return Policy</Label>
                <Textarea
                  id="return-policy"
                  placeholder="30-day return policy for defective items..."
                  value={applicationForm.returnPolicy}
                  onChange={(e) => setApplicationForm({...applicationForm, returnPolicy: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="warranty-policy">Warranty Policy</Label>
                <Textarea
                  id="warranty-policy"
                  placeholder="1-year manufacturer warranty on all new parts..."
                  value={applicationForm.warrantyPolicy}
                  onChange={(e) => setApplicationForm({...applicationForm, warrantyPolicy: e.target.value})}
                  rows={3}
                />
              </div>
            </div>

            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                After submitting your application, you may be asked to provide additional documentation such as business license copies, insurance certificates, or tax documents.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowApplication(false)}>
                Cancel
              </Button>
              <Button onClick={submitApplication}>
                Submit Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierDashboard;