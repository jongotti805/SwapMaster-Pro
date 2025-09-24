import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Filter,
  Star,
  DollarSign,
  Heart,
  BarChart3 as Compare,
  Eye,
  TrendingUp,
  Grid,
  List,
  SortDesc,
  Plus,
  Package,
  Truck,
  Clock,
  AlertCircle,
  Zap,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditContext';
import { supabase } from '@/lib/supabase';
import VendorPricingDisplay from '@/components/features/VendorPricingDisplay';
import AIRecommendations from '@/components/features/AIRecommendations';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price?: number;
  condition: string;
  brand?: string;
  part_number?: string;
  compatibility: any;
  location?: string;
  shipping_cost: number;
  quantity: number;
  images: string[];
  status: string;
  views_count: number;
  is_featured: boolean;
  created_at: string;
  seller_id: string;
  category_id: string;
  // Joined data
  category?: {
    id: string;
    name: string;
    description: string;
  };
  seller?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  reviews?: {
    average_rating: number;
    review_count: number;
  };
}

interface Category {
  id: string;
  name: string;
  description: string;
  sort_order: number;
}

const EnhancedMarketplace: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const conditions = ['new', 'used', 'refurbished'];

  useEffect(() => {
    loadInitialData();
    if (user) {
      loadUserWishlist();
      loadUserCart();
    }
  }, [user]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProducts(),
        loadCategories()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_categories!inner(id, name, description),
          user_profiles!inner(id, username, display_name, avatar_url)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match our interface
      const transformedProducts = data?.map(product => ({
        ...product,
        category: product.product_categories,
        seller: product.user_profiles
      })) || [];
      
      setProducts(transformedProducts);
      setFilteredProducts(transformedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadUserWishlist = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', user.id);
        
      if (error) throw error;
      setWishlist(data?.map(item => item.product_id) || []);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  };

  const loadUserCart = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('shopping_cart')
        .select('product_id')
        .eq('user_id', user.id);
        
      if (error) throw error;
      setCartItems(data?.map(item => item.product_id) || []);
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter, conditionFilter, sortBy, priceRange]);

  const filterProducts = () => {
    let filtered = products.filter(product => {
      const matchesSearch = 
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
      const matchesCondition = conditionFilter === 'all' || product.condition === conditionFilter;
      const totalPrice = product.price + product.shipping_cost;
      const matchesPrice = totalPrice >= priceRange[0] && totalPrice <= priceRange[1];

      return matchesSearch && matchesCategory && matchesCondition && matchesPrice;
    });

    // Sort filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.price + a.shipping_cost) - (b.price + b.shipping_cost);
        case 'price-high':
          return (b.price + b.shipping_cost) - (a.price + a.shipping_cost);
        case 'name':
          return a.title.localeCompare(b.title);
        case 'views':
          return b.views_count - a.views_count;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredProducts(filtered);
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      alert('Please sign in to use wishlist');
      return;
    }

    try {
      const isInWishlist = wishlist.includes(productId);
      
      if (isInWishlist) {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
          
        if (error) throw error;
        setWishlist(prev => prev.filter(id => id !== productId));
      } else {
        const { error } = await supabase
          .from('wishlists')
          .insert({
            user_id: user.id,
            product_id: productId,
            priority: 1
          });
          
        if (error) throw error;
        setWishlist(prev => [...prev, productId]);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
    }
  };

  const addToCart = async (product: Product) => {
    if (!user) {
      alert('Please sign in to add items to cart');
      return;
    }

    try {
      const { error } = await supabase
        .from('shopping_cart')
        .upsert({
          user_id: user.id,
          product_id: product.id,
          quantity: 1
        }, {
          onConflict: 'user_id,product_id'
        });
        
      if (error) throw error;
      setCartItems(prev => [...prev.filter(id => id !== product.id), product.id]);
      alert('Item added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-500';
      case 'refurbished': return 'bg-blue-500';
      case 'used': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const totalPrice = product.price + product.shipping_cost;
    const isInWishlist = wishlist.includes(product.id);
    const isInCart = cartItems.includes(product.id);
    const hasDiscount = product.original_price && product.original_price > product.price;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors group">
          <CardHeader className="relative p-0">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-full h-48 object-cover rounded-t-lg"
              />
            ) : (
              <div className="w-full h-48 bg-slate-700 rounded-t-lg flex items-center justify-center">
                <Package className="h-12 w-12 text-slate-500" />
              </div>
            )}
            
            {/* Action buttons overlay */}
            <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(product.id);
                }}
              >
                <Heart 
                  className={`h-4 w-4 ${
                    isInWishlist ? 'fill-red-500 text-red-500' : 'text-white'
                  }`} 
                />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProduct(product);
                  setShowPricing(true);
                }}
              >
                <Compare className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Featured badge */}
            {product.is_featured && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-yellow-500 text-black">
                  Featured
                </Badge>
              </div>
            )}
            
            {/* Discount badge */}
            {hasDiscount && (
              <div className="absolute top-10 left-2">
                <Badge className="bg-red-500 text-white">
                  {Math.round((1 - product.price / product.original_price!) * 100)}% OFF
                </Badge>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Title and Category */}
              <div>
                <h3 className="font-semibold text-white text-lg line-clamp-2">
                  {product.title}
                </h3>
                <p className="text-sm text-slate-400">
                  {product.category?.name} • {product.brand}
                </p>
              </div>
              
              {/* Part Number */}
              {product.part_number && (
                <p className="text-xs text-slate-500 font-mono">
                  Part #: {product.part_number}
                </p>
              )}
              
              {/* Price */}
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-green-400">
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-slate-400 line-through">
                    {formatPrice(product.original_price!)}
                  </span>
                )}
                {product.shipping_cost > 0 && (
                  <span className="text-xs text-slate-400">
                    +{formatPrice(product.shipping_cost)} shipping
                  </span>
                )}
              </div>
              
              {/* Condition and Stock */}
              <div className="flex items-center justify-between">
                <Badge 
                  className={`${getConditionColor(product.condition)} text-white text-xs`}
                >
                  {product.condition.charAt(0).toUpperCase() + product.condition.slice(1)}
                </Badge>
                <div className="flex items-center space-x-1 text-sm text-slate-400">
                  <Package className="h-4 w-4" />
                  <span>{product.quantity} available</span>
                </div>
              </div>
              
              {/* Seller info */}
              {product.seller && (
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  {product.seller.avatar_url ? (
                    <img 
                      src={product.seller.avatar_url} 
                      alt={product.seller.display_name}
                      className="h-5 w-5 rounded-full"
                    />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-slate-600" />
                  )}
                  <span>Sold by {product.seller.display_name || product.seller.username}</span>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => addToCart(product)}
                  disabled={isInCart}
                >
                  {isInCart ? (
                    <><CheckCircle className="h-4 w-4 mr-2" /> In Cart</>
                  ) : (
                    <><ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart</>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowPricing(true);
                  }}
                >
                  <Zap className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            Enhanced Marketplace
          </h1>
          <p className="text-slate-400 mt-1">
            Find and compare parts from multiple vendors with real-time pricing
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <Button
            variant="outline"
            onClick={() => setShowRecommendations(true)}
          >
            <Zap className="h-4 w-4 mr-2" />
            AI Recommendations
          </Button>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search parts, brands, part numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600"
                />
              </div>
            </div>
            
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="views">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Condition Filter */}
            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="All Conditions" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="all">All Conditions</SelectItem>
                {conditions.map(condition => (
                  <SelectItem key={condition} value={condition}>
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Price Range */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">
                Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
              </Label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={5000}
                min={0}
                step={50}
                className="w-full"
              />
            </div>
            
            {/* Results count */}
            <div className="flex items-end">
              <p className="text-sm text-slate-400">
                {filteredProducts.length} of {products.length} products
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </AnimatePresence>
      </div>
      
      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No products found</h3>
            <p className="text-slate-400">Try adjusting your search criteria or filters.</p>
          </CardContent>
        </Card>
      )}

      {/* Vendor Pricing Dialog */}
      <Dialog open={showPricing} onOpenChange={setShowPricing}>
        <DialogContent className="max-w-4xl bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle>Live Vendor Pricing</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <VendorPricingDisplay
              partId={selectedProduct.part_number || selectedProduct.id}
              partName={selectedProduct.title}
              vehicleInfo={{
                year: selectedProduct.compatibility?.year,
                make: selectedProduct.compatibility?.make,
                model: selectedProduct.compatibility?.model
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* AI Recommendations Dialog */}
      <Dialog open={showRecommendations} onOpenChange={setShowRecommendations}>
        <DialogContent className="max-w-4xl bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle>AI Recommendations</DialogTitle>
          </DialogHeader>
          <AIRecommendations
            onRecommendationSelect={(recommendation) => {
              console.log('Selected recommendation:', recommendation);
              setShowRecommendations(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedMarketplace;