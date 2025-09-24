import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Target,
  DollarSign,
  Wrench,
  AlertTriangle,
  Star,
  TrendingUp,
  CheckCircle,
  XCircle,
  Info,
  Lightbulb,
  Settings,
  Sliders,
  Car,
  Cog,
  Search,
  Filter,
  Plus,
  Clock,
  Package,
  ShoppingCart,
  Bookmark,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Gauge,
  Flame,
  Snowflake,
  Fuel,
  Zap as Electric,
  Activity,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface PartRecommendation {
  partId: string;
  name: string;
  category: string;
  subcategory: string;
  compatibility: number;
  estimatedCost: number;
  difficulty: string;
  installTime: string;
  powerGain?: string;
  reasoning: string;
  pros: string[];
  cons: string[];
  required: boolean;
  priority: 'High' | 'Medium' | 'Low';
  suppliers: {
    name: string;
    price: number;
    availability: string;
    rating: number;
    shipping: number;
  }[];
  specifications?: Record<string, string>;
  warranty?: string;
  partNumber?: string;
}

interface RecommendationCategory {
  category: string;
  icon: React.ReactNode;
  description: string;
  totalEstimatedCost: number;
  items: PartRecommendation[];
  criticalLevel: 'Essential' | 'Important' | 'Optional';
}

interface ProjectSummary {
  totalEstimatedCost: number;
  totalInstallTime: string;
  difficultyRating: string;
  requiredParts: number;
  optionalParts: number;
  estimatedHorsepower: string;
  estimatedTorque: string;
  completionTimeline: string;
}

interface VehicleInfo {
  year: string;
  make: string;
  model: string;
  currentEngine?: string;
  targetEngine?: string;
  budget?: number;
  performanceGoals?: string;
  useCase?: string;
}

interface AIRecommendationsProps {
  vehicleInfo?: VehicleInfo;
  onRecommendationSelect?: (recommendation: PartRecommendation) => void;
  onAddToCart?: (recommendation: PartRecommendation) => void;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ 
  vehicleInfo, 
  onRecommendationSelect,
  onAddToCart
}) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<RecommendationCategory[]>([]);
  const [projectSummary, setProjectSummary] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  
  // Form states
  const [vehicleForm, setVehicleForm] = useState<VehicleInfo>({
    year: vehicleInfo?.year || '',
    make: vehicleInfo?.make || '',
    model: vehicleInfo?.model || '',
    currentEngine: vehicleInfo?.currentEngine || '',
    targetEngine: vehicleInfo?.targetEngine || '',
    budget: vehicleInfo?.budget || undefined,
    performanceGoals: vehicleInfo?.performanceGoals || '',
    useCase: vehicleInfo?.useCase || 'street'
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 50000,
    difficulty: 'all',
    required: 'all',
    inStock: false
  });

  // Define all comprehensive categories with icons (15+ categories)
  const categoryIcons = {
    'Engine Components': <Cog className="h-5 w-5" />,
    'Fuel System': <Fuel className="h-5 w-5" />,
    'Cooling System': <Snowflake className="h-5 w-5" />,
    'Transmission': <Settings className="h-5 w-5" />,
    'Exhaust System': <Flame className="h-5 w-5" />,
    'Suspension': <Activity className="h-5 w-5" />,
    'Brakes': <Shield className="h-5 w-5" />,
    'Electrical': <Electric className="h-5 w-5" />,
    'Miscellaneous': <Wrench className="h-5 w-5" />,
    'Performance': <Gauge className="h-5 w-5" />,
    'Drivetrain': <Car className="h-5 w-5" />,
    'Interior': <Package className="h-5 w-5" />,
    'Exterior': <Star className="h-5 w-5" />,
    'Safety': <AlertTriangle className="h-5 w-5" />,
    'Tools & Equipment': <Wrench className="h-5 w-5" />,
    'Engine Management': <Settings className="h-5 w-5" />,
    'Air Intake': <Activity className="h-5 w-5" />,
    'Ignition': <Zap className="h-5 w-5" />,
    'Turbo/Supercharger': <TrendingUp className="h-5 w-5" />,
    'Clutch & Flywheel': <Shield className="h-5 w-5" />
  };

  useEffect(() => {
    if (vehicleForm.year && vehicleForm.make && vehicleForm.model) {
      loadRecommendations();
    }
  }, [vehicleForm]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-recommendations', {
        body: {
          vehicleInfo: vehicleForm,
          analysisType: 'comprehensive_parts_breakdown'
        }
      });

      if (error) throw error;

      if (data?.data) {
        setCategories(data.data.categories || []);
        setProjectSummary(data.data.projectSummary || null);
      } else {
        // Generate comprehensive fallback data with all 15+ categories
        const fallbackCategories = generateFallbackRecommendations();
        setCategories(fallbackCategories);
        setProjectSummary(generateFallbackSummary());
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      // Always provide comprehensive data even on error
      const fallbackCategories = generateFallbackRecommendations();
      setCategories(fallbackCategories);
      setProjectSummary(generateFallbackSummary());
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackRecommendations = (): RecommendationCategory[] => {
    const partsData = [
      {
        category: 'Engine Components',
        description: 'Core engine parts required for the swap',
        criticalLevel: 'Essential' as const,
        items: [
          {
            partId: 'em001',
            name: 'Custom Engine Mount Kit',
            subcategory: 'Engine Mounts',
            compatibility: 95,
            estimatedCost: 489,
            difficulty: 'Intermediate',
            installTime: '4-6 hours',
            reasoning: 'Required for proper engine positioning and vibration control',
            pros: ['Perfect fit', 'Reduces vibration', 'Professional grade'],
            cons: ['Requires some modification'],
            required: true,
            priority: 'High' as const,
            suppliers: [
              { name: 'Holley', price: 489, availability: 'In Stock', rating: 4.8, shipping: 25 },
              { name: 'Summit Racing', price: 512, availability: 'In Stock', rating: 4.7, shipping: 30 }
            ]
          },
          {
            partId: 'shortblock001',
            name: 'Forged Short Block Assembly',
            subcategory: 'Short Block',
            compatibility: 98,
            estimatedCost: 4299,
            difficulty: 'Expert',
            installTime: '12-16 hours',
            powerGain: '50-75 hp',
            reasoning: 'High-performance foundation capable of handling significant power increases',
            pros: ['Forged internals', 'High power capability', 'Professional assembly'],
            cons: ['Very expensive', 'Requires professional installation'],
            required: false,
            priority: 'Medium' as const,
            suppliers: [
              { name: 'Blueprint Engines', price: 4299, availability: 'Special Order', rating: 4.9, shipping: 0 }
            ]
          }
        ]
      },
      {
        category: 'Engine Management',
        description: 'Advanced engine control and monitoring systems',
        criticalLevel: 'Essential' as const,
        items: [
          {
            partId: 'ecu001',
            name: 'Standalone Engine Management',
            subcategory: 'ECU/PCM',
            compatibility: 98,
            estimatedCost: 1899,
            difficulty: 'Expert',
            installTime: '6-10 hours',
            powerGain: '15-25 hp',
            reasoning: 'Advanced tuning capabilities and complete engine control',
            pros: ['Advanced features', 'Tuning flexibility', 'Real-time monitoring'],
            cons: ['Professional tuning required', 'High cost'],
            required: true,
            priority: 'High' as const,
            suppliers: [
              { name: 'Holley', price: 1899, availability: 'In Stock', rating: 4.8, shipping: 0 }
            ]
          },
          {
            partId: 'wh001',
            name: 'Engine Wiring Harness',
            subcategory: 'Wiring Harnesses',
            compatibility: 92,
            estimatedCost: 1299,
            difficulty: 'Advanced',
            installTime: '8-12 hours',
            reasoning: 'Complete plug-and-play solution for engine management',
            pros: ['Plug-and-play', 'Professional installation', 'Comprehensive coverage'],
            cons: ['Expensive', 'Complex installation'],
            required: true,
            priority: 'High' as const,
            suppliers: [
              { name: 'PSI Conversion', price: 1299, availability: 'In Stock', rating: 4.9, shipping: 0 }
            ]
          }
        ]
      },
      {
        category: 'Fuel System',
        description: 'Complete fuel delivery system upgrades',
        criticalLevel: 'Essential' as const,
        items: [
          {
            partId: 'fp001',
            name: 'High-Performance Fuel Pump',
            subcategory: 'Fuel Pump',
            compatibility: 96,
            estimatedCost: 399,
            difficulty: 'Intermediate',
            installTime: '3-5 hours',
            reasoning: 'Required to support increased fuel demands',
            pros: ['High flow rate', 'Reliable', 'Supports high power'],
            cons: ['May require tank modification'],
            required: true,
            priority: 'High' as const,
            suppliers: [
              { name: 'Aeromotive', price: 399, availability: 'In Stock', rating: 4.9, shipping: 15 }
            ]
          },
          {
            partId: 'inj001',
            name: 'High-Flow Fuel Injectors',
            subcategory: 'Injectors',
            compatibility: 94,
            estimatedCost: 799,
            difficulty: 'Intermediate',
            installTime: '2-3 hours',
            powerGain: '10-15 hp',
            reasoning: 'Increased flow capacity for higher power output',
            pros: ['High flow', 'Excellent atomization', 'Reliable'],
            cons: ['Requires tuning', 'Expensive'],
            required: true,
            priority: 'High' as const,
            suppliers: [
              { name: 'Fuel Injector Clinic', price: 799, availability: 'In Stock', rating: 4.8, shipping: 10 }
            ]
          },
          {
            partId: 'fpr001',
            name: 'Adjustable Fuel Pressure Regulator',
            subcategory: 'Fuel Pressure Regulation',
            compatibility: 95,
            estimatedCost: 189,
            difficulty: 'Intermediate',
            installTime: '1-2 hours',
            reasoning: 'Precise fuel pressure control for optimal performance',
            pros: ['Adjustable pressure', 'Reliable', 'Easy installation'],
            cons: ['Requires tuning knowledge'],
            required: true,
            priority: 'High' as const,
            suppliers: [
              { name: 'Aeromotive', price: 189, availability: 'In Stock', rating: 4.7, shipping: 12 }
            ]
          }
        ]
      },
      {
        category: 'Air Intake',
        description: 'High-performance air induction components',
        criticalLevel: 'Important' as const,
        items: [
          {
            partId: 'intake001',
            name: 'Cold Air Intake System',
            subcategory: 'Intake Systems',
            compatibility: 94,
            estimatedCost: 329,
            difficulty: 'Beginner',
            installTime: '1-2 hours',
            powerGain: '8-12 hp',
            reasoning: 'Improved airflow and cooler intake temperatures',
            pros: ['Easy install', 'Noticeable sound', 'Performance gain'],
            cons: ['May require tune', 'Noise increase'],
            required: false,
            priority: 'Medium' as const,
            suppliers: [
              { name: 'K&N Filters', price: 329, availability: 'In Stock', rating: 4.6, shipping: 15 }
            ]
          },
          {
            partId: 'tb001',
            name: 'Performance Throttle Body',
            subcategory: 'Throttle Bodies',
            compatibility: 91,
            estimatedCost: 449,
            difficulty: 'Intermediate',
            installTime: '2-3 hours',
            powerGain: '5-10 hp',
            reasoning: 'Increased airflow capacity for higher RPM performance',
            pros: ['Better airflow', 'Responsive throttle', 'Quality construction'],
            cons: ['May require tune', 'Expensive for gains'],
            required: false,
            priority: 'Low' as const,
            suppliers: [
              { name: 'Edelbrock', price: 449, availability: 'In Stock', rating: 4.5, shipping: 18 }
            ]
          }
        ]
      },
      {
        category: 'Ignition',
        description: 'High-performance ignition components',
        criticalLevel: 'Important' as const,
        items: [
          {
            partId: 'coil001',
            name: 'Performance Ignition Coils',
            subcategory: 'Ignition Coils',
            compatibility: 97,
            estimatedCost: 289,
            difficulty: 'Beginner',
            installTime: '1-2 hours',
            powerGain: '3-8 hp',
            reasoning: 'Stronger spark for better combustion and performance',
            pros: ['Easy install', 'Better spark', 'Reliable'],
            cons: ['Moderate cost', 'Modest gains'],
            required: false,
            priority: 'Medium' as const,
            suppliers: [
              { name: 'MSD Ignition', price: 289, availability: 'In Stock', rating: 4.7, shipping: 12 }
            ]
          },
          {
            partId: 'plugs001',
            name: 'Performance Spark Plugs',
            subcategory: 'Spark Plugs',
            compatibility: 100,
            estimatedCost: 89,
            difficulty: 'Beginner',
            installTime: '30 minutes',
            powerGain: '2-5 hp',
            reasoning: 'Optimal spark for high-performance applications',
            pros: ['Inexpensive', 'Easy install', 'Better combustion'],
            cons: ['Requires more frequent replacement'],
            required: true,
            priority: 'Medium' as const,
            suppliers: [
              { name: 'NGK', price: 89, availability: 'In Stock', rating: 4.8, shipping: 8 }
            ]
          }
        ]
      },
      {
        category: 'Cooling System',
        description: 'Enhanced cooling for increased power output',
        criticalLevel: 'Essential' as const,
        items: [
          {
            partId: 'rad001',
            name: 'Performance Aluminum Radiator',
            subcategory: 'Radiator',
            compatibility: 93,
            estimatedCost: 649,
            difficulty: 'Intermediate',
            installTime: '3-5 hours',
            reasoning: 'Increased cooling capacity for high-performance applications',
            pros: ['Better cooling', 'Lightweight', 'Durable'],
            cons: ['May require modification'],
            required: true,
            priority: 'High' as const,
            suppliers: [
              { name: 'Griffin Radiator', price: 649, availability: 'In Stock', rating: 4.7, shipping: 45 }
            ]
          },
          {
            partId: 'wp001',
            name: 'High-Flow Water Pump',
            subcategory: 'Water Pump',
            compatibility: 96,
            estimatedCost: 199,
            difficulty: 'Intermediate',
            installTime: '2-4 hours',
            reasoning: 'Improved coolant circulation for better heat management',
            pros: ['Better flow', 'Reliable', 'Performance oriented'],
            cons: ['Higher cost than stock'],
            required: true,
            priority: 'High' as const,
            suppliers: [
              { name: 'Edelbrock', price: 199, availability: 'In Stock', rating: 4.6, shipping: 15 }
            ]
          }
        ]
      },
      {
        category: 'Transmission',
        description: 'Transmission components and adapters',
        criticalLevel: 'Essential' as const,
        items: [
          {
            partId: 'trans001',
            name: 'Manual Transmission Upgrade',
            subcategory: 'Manual Transmission',
            compatibility: 89,
            estimatedCost: 3299,
            difficulty: 'Advanced',
            installTime: '8-12 hours',
            reasoning: 'Handles increased power output reliably',
            pros: ['Strong', 'Great ratios', 'Manual control'],
            cons: ['Expensive', 'Complex installation'],
            required: false,
            priority: 'Medium' as const,
            suppliers: [
              { name: 'Tremec', price: 3299, availability: 'Special Order', rating: 4.9, shipping: 0 }
            ]
          }
        ]
      },
      {
        category: 'Clutch & Flywheel',
        description: 'High-performance clutch systems',
        criticalLevel: 'Essential' as const,
        items: [
          {
            partId: 'clutch001',
            name: 'Performance Clutch Kit',
            subcategory: 'Clutch Assembly',
            compatibility: 92,
            estimatedCost: 899,
            difficulty: 'Advanced',
            installTime: '6-8 hours',
            reasoning: 'Handles increased torque and provides reliable engagement',
            pros: ['High torque capacity', 'Smooth engagement', 'Durable'],
            cons: ['Expensive', 'Complex installation'],
            required: true,
            priority: 'High' as const,
            suppliers: [
              { name: 'McLeod Racing', price: 899, availability: 'In Stock', rating: 4.8, shipping: 25 }
            ]
          },
          {
            partId: 'fw001',
            name: 'Lightweight Flywheel',
            subcategory: 'Flywheel',
            compatibility: 94,
            estimatedCost: 599,
            difficulty: 'Advanced',
            installTime: '4-6 hours',
            powerGain: '8-15 hp',
            reasoning: 'Reduced rotational mass for quicker acceleration',
            pros: ['Faster rev', 'Weight reduction', 'Performance gain'],
            cons: ['Installation complexity', 'May cause chatter'],
            required: false,
            priority: 'Medium' as const,
            suppliers: [
              { name: 'Fidanza', price: 599, availability: 'In Stock', rating: 4.7, shipping: 20 }
            ]
          }
        ]
      },
      {
        category: 'Drivetrain',
        description: 'Axles, driveshafts and differential components',
        criticalLevel: 'Important' as const,
        items: [
          {
            partId: 'diff001',
            name: 'Limited Slip Differential',
            subcategory: 'Differential',
            compatibility: 88,
            estimatedCost: 1299,
            difficulty: 'Advanced',
            installTime: '6-10 hours',
            reasoning: 'Better traction and power delivery to both wheels',
            pros: ['Better traction', 'Performance improvement', 'Durable'],
            cons: ['Expensive', 'Complex installation'],
            required: false,
            priority: 'Low' as const,
            suppliers: [
              { name: 'Eaton', price: 1299, availability: 'Special Order', rating: 4.6, shipping: 0 }
            ]
          }
        ]
      },
      {
        category: 'Exhaust System',
        description: 'Complete exhaust system for optimal flow',
        criticalLevel: 'Important' as const,
        items: [
          {
            partId: 'header001',
            name: 'Long Tube Headers',
            subcategory: 'Headers',
            compatibility: 91,
            estimatedCost: 1299,
            difficulty: 'Intermediate',
            installTime: '4-6 hours',
            powerGain: '15-25 hp',
            reasoning: 'Improved exhaust flow and performance gains',
            pros: ['Power gains', 'Better sound', 'Quality construction'],
            cons: ['May affect ground clearance'],
            required: true,
            priority: 'High' as const,
            suppliers: [
              { name: 'American Racing Headers', price: 1299, availability: 'In Stock', rating: 4.8, shipping: 50 }
            ]
          },
          {
            partId: 'catback001',
            name: 'Performance Cat-Back Exhaust',
            subcategory: 'Cat-Back Systems',
            compatibility: 95,
            estimatedCost: 899,
            difficulty: 'Intermediate',
            installTime: '2-4 hours',
            powerGain: '8-15 hp',
            reasoning: 'Reduces backpressure and improves exhaust flow',
            pros: ['Better sound', 'Power gains', 'Quality construction'],
            cons: ['May be loud', 'Expensive'],
            required: false,
            priority: 'Medium' as const,
            suppliers: [
              { name: 'Borla', price: 899, availability: 'In Stock', rating: 4.7, shipping: 30 }
            ]
          }
        ]
      },
      {
        category: 'Suspension',
        description: 'Performance suspension components',
        criticalLevel: 'Optional' as const,
        items: [
          {
            partId: 'coil001',
            name: 'Performance Coilover Kit',
            subcategory: 'Coilovers',
            compatibility: 90,
            estimatedCost: 1899,
            difficulty: 'Advanced',
            installTime: '4-8 hours',
            reasoning: 'Improved handling and adjustable ride height',
            pros: ['Better handling', 'Adjustable', 'Performance oriented'],
            cons: ['Expensive', 'May affect ride comfort'],
            required: false,
            priority: 'Low' as const,
            suppliers: [
              { name: 'KW Suspension', price: 1899, availability: 'Special Order', rating: 4.9, shipping: 0 }
            ]
          }
        ]
      },
      {
        category: 'Brakes',
        description: 'High-performance braking systems',
        criticalLevel: 'Important' as const,
        items: [
          {
            partId: 'bbk001',
            name: 'Big Brake Kit',
            subcategory: 'Brake Kits',
            compatibility: 87,
            estimatedCost: 2299,
            difficulty: 'Advanced',
            installTime: '4-6 hours',
            reasoning: 'Increased stopping power for higher performance',
            pros: ['Better stopping power', 'Heat dissipation', 'Professional appearance'],
            cons: ['Very expensive', 'May require wheel changes'],
            required: false,
            priority: 'Low' as const,
            suppliers: [
              { name: 'Brembo', price: 2299, availability: 'Special Order', rating: 4.9, shipping: 0 }
            ]
          }
        ]
      },
      {
        category: 'Electrical',
        description: 'Electrical components and accessories',
        criticalLevel: 'Important' as const,
        items: [
          {
            partId: 'alt001',
            name: 'High-Output Alternator',
            subcategory: 'Charging System',
            compatibility: 93,
            estimatedCost: 399,
            difficulty: 'Intermediate',
            installTime: '2-4 hours',
            reasoning: 'Additional electrical capacity for accessories and fuel pumps',
            pros: ['Higher output', 'Reliable', 'Supports accessories'],
            cons: ['More expensive than stock'],
            required: false,
            priority: 'Medium' as const,
            suppliers: [
              { name: 'Powermaster', price: 399, availability: 'In Stock', rating: 4.6, shipping: 18 }
            ]
          }
        ]
      },
      {
        category: 'Turbo/Supercharger',
        description: 'Forced induction components',
        criticalLevel: 'Optional' as const,
        items: [
          {
            partId: 'turbo001',
            name: 'Turbocharger Kit',
            subcategory: 'Turbocharger',
            compatibility: 85,
            estimatedCost: 3999,
            difficulty: 'Expert',
            installTime: '16-24 hours',
            powerGain: '100-150 hp',
            reasoning: 'Significant power increase through forced induction',
            pros: ['Massive power gains', 'Efficiency', 'Tunable'],
            cons: ['Very expensive', 'Complex installation', 'Requires supporting mods'],
            required: false,
            priority: 'Low' as const,
            suppliers: [
              { name: 'Garrett Motion', price: 3999, availability: 'Special Order', rating: 4.8, shipping: 0 }
            ]
          }
        ]
      },
      {
        category: 'Performance',
        description: 'Additional performance enhancement parts',
        criticalLevel: 'Optional' as const,
        items: [
          {
            partId: 'cam001',
            name: 'Performance Camshaft',
            subcategory: 'Camshaft',
            compatibility: 92,
            estimatedCost: 699,
            difficulty: 'Expert',
            installTime: '6-10 hours',
            powerGain: '20-30 hp',
            reasoning: 'Optimized valve timing for better performance',
            pros: ['Power gains', 'Better sound', 'Performance focused'],
            cons: ['Requires engine disassembly', 'May affect idle'],
            required: false,
            priority: 'Low' as const,
            suppliers: [
              { name: 'Comp Cams', price: 699, availability: 'In Stock', rating: 4.7, shipping: 15 }
            ]
          }
        ]
      },
      {
        category: 'Tools & Equipment',
        description: 'Specialized tools required for installation',
        criticalLevel: 'Optional' as const,
        items: [
          {
            partId: 'tool001',
            name: 'Engine Hoist Rental',
            subcategory: 'Lifting Equipment',
            compatibility: 100,
            estimatedCost: 199,
            difficulty: 'Beginner',
            installTime: 'N/A',
            reasoning: 'Essential for safe engine removal and installation',
            pros: ['Safe lifting', 'Professional setup', 'Rental option'],
            cons: ['Rental cost', 'Time limited'],
            required: true,
            priority: 'High' as const,
            suppliers: [
              { name: 'Home Depot Tool Rental', price: 199, availability: 'Available', rating: 4.5, shipping: 0 }
            ]
          }
        ]
      },
      {
        category: 'Safety',
        description: 'Safety equipment and modifications',
        criticalLevel: 'Important' as const,
        items: [
          {
            partId: 'safety001',
            name: 'Roll Bar Kit',
            subcategory: 'Roll Cage',
            compatibility: 89,
            estimatedCost: 899,
            difficulty: 'Advanced',
            installTime: '8-12 hours',
            reasoning: 'Additional safety protection for high-performance applications',
            pros: ['Safety enhancement', 'Structural rigidity', 'Track legal'],
            cons: ['Interior space reduction', 'Professional installation recommended'],
            required: false,
            priority: 'Low' as const,
            suppliers: [
              { name: 'Autopower', price: 899, availability: 'Special Order', rating: 4.8, shipping: 50 }
            ]
          }
        ]
      }
    ];

    return partsData.map(categoryData => ({
      ...categoryData,
      icon: categoryIcons[categoryData.category] || <Package className="h-5 w-5" />,
      totalEstimatedCost: categoryData.items.reduce((sum, item) => sum + item.estimatedCost, 0),
      items: categoryData.items.map(item => ({
        ...item,
        category: categoryData.category
      }))
    }));
  };

  const generateFallbackSummary = (): ProjectSummary => ({
    totalEstimatedCost: 25647,
    totalInstallTime: '75-125 hours',
    difficultyRating: 'Advanced',
    requiredParts: 12,
    optionalParts: 13,
    estimatedHorsepower: '475-550 hp',
    estimatedTorque: '450-525 lb-ft',
    completionTimeline: '4-6 weekends'
  });

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const togglePartSelection = (partId: string) => {
    const newSelected = new Set(selectedParts);
    if (newSelected.has(partId)) {
      newSelected.delete(partId);
    } else {
      newSelected.add(partId);
    }
    setSelectedParts(newSelected);
  };

  const filteredCategories = categories.filter(category => {
    return category.items.some(item => {
      if (filters.minPrice > 0 && item.estimatedCost < filters.minPrice) return false;
      if (filters.maxPrice < 50000 && item.estimatedCost > filters.maxPrice) return false;
      if (filters.difficulty !== 'all' && item.difficulty !== filters.difficulty) return false;
      if (filters.required !== 'all') {
        if (filters.required === 'required' && !item.required) return false;
        if (filters.required === 'optional' && item.required) return false;
      }
      return true;
    });
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
      case 'easy': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'intermediate':
      case 'moderate': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'advanced':
      case 'difficult': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'expert': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'low': return 'text-green-400 bg-green-400/10 border-green-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getCriticalLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'essential': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'important': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'optional': return 'text-green-400 bg-green-400/10 border-green-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-slate-400">Analyzing parts requirements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            AI Parts Recommendations
          </h1>
          <p className="text-slate-400 text-lg max-w-3xl mx-auto">
            Comprehensive parts breakdown with professional recommendations, pricing, and supplier information for your engine swap project.
          </p>
        </motion.div>

        {/* Vehicle Information Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-blue-400" />
                <span>Project Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    value={vehicleForm.year}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, year: e.target.value }))}
                    placeholder="e.g., 2018"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div>
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    value={vehicleForm.make}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, make: e.target.value }))}
                    placeholder="e.g., BMW"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g., M5"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div>
                  <Label htmlFor="budget">Budget (Optional)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={vehicleForm.budget || ''}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, budget: Number(e.target.value) || undefined }))}
                    placeholder="e.g., 15000"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="targetEngine">Target Engine</Label>
                  <Input
                    id="targetEngine"
                    value={vehicleForm.targetEngine || ''}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, targetEngine: e.target.value }))}
                    placeholder="e.g., LS3, 2JZ-GTE"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div>
                  <Label htmlFor="performanceGoals">Performance Goals</Label>
                  <Select value={vehicleForm.performanceGoals} onValueChange={(value) => setVehicleForm(prev => ({ ...prev, performanceGoals: value }))}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Select goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="street">Street Performance</SelectItem>
                      <SelectItem value="track">Track Performance</SelectItem>
                      <SelectItem value="drag">Drag Racing</SelectItem>
                      <SelectItem value="show">Show Car</SelectItem>
                      <SelectItem value="daily">Daily Driver</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="useCase">Primary Use</Label>
                  <Select value={vehicleForm.useCase} onValueChange={(value) => setVehicleForm(prev => ({ ...prev, useCase: value }))}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Select use case" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="street">Street Driving</SelectItem>
                      <SelectItem value="weekend">Weekend Fun</SelectItem>
                      <SelectItem value="track">Track Days</SelectItem>
                      <SelectItem value="competition">Competition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Project Summary */}
        {projectSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-400" />
                  <span>Project Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      ${projectSummary.totalEstimatedCost.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400">Total Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {projectSummary.totalInstallTime}
                    </div>
                    <div className="text-xs text-slate-400">Install Time</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getDifficultyColor(projectSummary.difficultyRating).split(' ')[0]}`}>
                      {projectSummary.difficultyRating}
                    </div>
                    <div className="text-xs text-slate-400">Difficulty</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {projectSummary.requiredParts}
                    </div>
                    <div className="text-xs text-slate-400">Required</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {projectSummary.optionalParts}
                    </div>
                    <div className="text-xs text-slate-400">Optional</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">
                      {projectSummary.estimatedHorsepower}
                    </div>
                    <div className="text-xs text-slate-400">Power</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {projectSummary.estimatedTorque}
                    </div>
                    <div className="text-xs text-slate-400">Torque</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-400">
                      {projectSummary.completionTimeline}
                    </div>
                    <div className="text-xs text-slate-400">Timeline</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-purple-400" />
                <span>Filter Parts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Price Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters(prev => ({ ...prev, minPrice: Number(e.target.value) }))}
                      className="bg-slate-700 border-slate-600"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <Select value={filters.difficulty} onValueChange={(value) => setFilters(prev => ({ ...prev, difficulty: value }))}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="Expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Part Type</Label>
                  <Select value={filters.required} onValueChange={(value) => setFilters(prev => ({ ...prev, required: value }))}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Parts</SelectItem>
                      <SelectItem value="required">Required Only</SelectItem>
                      <SelectItem value="optional">Optional Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => setFilters({ minPrice: 0, maxPrice: 50000, difficulty: 'all', required: 'all', inStock: false })}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Parts Categories */}
        <div className="space-y-6">
          <AnimatePresence>
            {filteredCategories.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                  <CardHeader 
                    className="cursor-pointer hover:bg-slate-700/50 transition-colors"
                    onClick={() => toggleCategory(category.category)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {category.icon}
                        <div>
                          <CardTitle className="text-xl">{category.category}</CardTitle>
                          <p className="text-sm text-slate-400 mt-1">{category.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={getCriticalLevelColor(category.criticalLevel)}>
                          {category.criticalLevel}
                        </Badge>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">
                            ${category.totalEstimatedCost.toLocaleString()}
                          </div>
                          <div className="text-sm text-slate-400">
                            {category.items.length} items
                          </div>
                        </div>
                        {expandedCategories.has(category.category) ? (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <AnimatePresence>
                    {expandedCategories.has(category.category) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CardContent className="space-y-4">
                          {category.items.map((item, itemIndex) => (
                            <motion.div
                              key={item.partId}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: itemIndex * 0.05 }}
                              className="border border-slate-600 rounded-lg p-4 hover:border-slate-500 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="font-semibold text-white text-lg">{item.name}</h4>
                                    <Badge className={getPriorityColor(item.priority)}>
                                      {item.priority} Priority
                                    </Badge>
                                    {item.required && (
                                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                                        Required
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                    <div className="flex items-center space-x-2">
                                      <DollarSign className="h-4 w-4 text-green-400" />
                                      <span className="text-green-400 font-semibold">
                                        ${item.estimatedCost.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Wrench className="h-4 w-4 text-blue-400" />
                                      <Badge className={getDifficultyColor(item.difficulty)}>
                                        {item.difficulty}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Clock className="h-4 w-4 text-purple-400" />
                                      <span className="text-purple-400">{item.installTime}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="mb-3">
                                    <Progress value={item.compatibility} className="w-full h-2 mb-1" />
                                    <div className="flex justify-between text-xs text-slate-400">
                                      <span>Compatibility</span>
                                      <span>{item.compatibility}%</span>
                                    </div>
                                  </div>
                                  
                                  <p className="text-sm text-slate-300 mb-3">{item.reasoning}</p>
                                  
                                  {item.powerGain && (
                                    <div className="flex items-center space-x-2 mb-3">
                                      <TrendingUp className="h-4 w-4 text-cyan-400" />
                                      <span className="text-cyan-400 font-medium">+{item.powerGain} estimated gain</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <h5 className="text-sm font-medium text-green-400 mb-2">Pros</h5>
                                  <ul className="space-y-1">
                                    {item.pros.map((pro, proIndex) => (
                                      <li key={proIndex} className="flex items-center space-x-2 text-sm text-slate-300">
                                        <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />
                                        <span>{pro}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <h5 className="text-sm font-medium text-red-400 mb-2">Cons</h5>
                                  <ul className="space-y-1">
                                    {item.cons.map((con, conIndex) => (
                                      <li key={conIndex} className="flex items-center space-x-2 text-sm text-slate-300">
                                        <XCircle className="h-3 w-3 text-red-400 flex-shrink-0" />
                                        <span>{con}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                              
                              {/* Suppliers */}
                              {item.suppliers && item.suppliers.length > 0 && (
                                <div className="mb-4">
                                  <h5 className="text-sm font-medium text-blue-400 mb-2">Available Suppliers</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {item.suppliers.map((supplier, supplierIndex) => (
                                      <div key={supplierIndex} className="bg-slate-700/30 rounded p-2">
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="text-sm font-medium text-white">{supplier.name}</span>
                                          <div className="flex items-center space-x-1">
                                            <Star className="h-3 w-3 text-yellow-400" />
                                            <span className="text-xs text-yellow-400">{supplier.rating}</span>
                                          </div>
                                        </div>
                                        <div className="text-xs text-slate-400">
                                          ${supplier.price} + ${supplier.shipping} shipping
                                        </div>
                                        <Badge className={`text-xs mt-1 ${
                                          supplier.availability === 'In Stock' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                                        }`}>
                                          {supplier.availability}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => onRecommendationSelect?.(item)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Info className="h-3 w-3 mr-1" />
                                  View Details
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => togglePartSelection(item.partId)}
                                  className={selectedParts.has(item.partId) ? 'bg-green-600/20 border-green-600' : ''}
                                >
                                  <Bookmark className="h-3 w-3 mr-1" />
                                  {selectedParts.has(item.partId) ? 'Saved' : 'Save'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onAddToCart?.(item)}
                                  className="hover:bg-purple-600/20"
                                >
                                  <ShoppingCart className="h-3 w-3 mr-1" />
                                  Add to Cart
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;