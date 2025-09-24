import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Book,
  Palette,
  Box,
  Package,
  Activity,
  CheckSquare,
  MessageSquare,
  MessageCircle,
  User,
  ShoppingCart,
  X,
  Wrench,
  Zap,
  Brain,
  Users,
  Eye,
  Shield,
  Briefcase,
  Search,
  Trophy,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home,
    description: 'Overview & Quick Actions'
  },
  {
    title: 'Build Threads',
    href: '/build-threads',
    icon: Users,
    description: 'Social Community & Build Sharing'
  },
  {
    title: 'AR Visualization',
    href: '/ar-visualization',
    icon: Eye,
    description: 'Camera-Based Engine Previews'
  },
  {
    title: 'AI Compatibility Check',
    href: '/compatibility-check',
    icon: Search,
    description: 'Smart Swap Analysis'
  },
  {
    title: 'Credit Economy',
    href: '/credit-economy',
    icon: Trophy,
    description: 'Rewards & Achievements'
  },
  {
    title: 'Professional Mode',
    href: '/professional-mode',
    icon: Briefcase,
    description: 'B2B Dashboard for Tuner Shops'
  },
  {
    title: 'Supplier Verification',
    href: '/supplier-verification',
    icon: Shield,
    description: 'Verified Parts Suppliers'
  },
  {
    title: 'Supplier Subscription',
    href: '/supplier-subscription',
    icon: Crown,
    description: 'Join Verified Supplier Program'
  },
  {
    title: 'Professional Subscription',
    href: '/professional-subscription',
    icon: Crown,
    description: 'Upgrade to Professional Mode'
  },
  {
    title: 'Swap Guides',
    href: '/swap-guides',
    icon: Book,
    description: 'Step-by-step Engine Swaps'
  },
  {
    title: 'Dynamic Swap Guide',
    href: '/dynamic-swap-guide',
    icon: Wrench,
    description: 'AI-Powered Custom Guides'
  },
  {
    title: 'AI Design Studio',
    href: '/ai-studio',
    icon: Palette,
    description: 'Vehicle Mockup Generator'
  },
  {
    title: '3D Model Viewer',
    href: '/3d-viewer',
    icon: Box,
    description: 'Interactive 3D Previews'
  },
  {
    title: 'Parts Inventory',
    href: '/parts-inventory',
    icon: Package,
    description: 'Track Your Parts'
  },
  {
    title: 'OBD-II Diagnostics',
    href: '/obd-diagnostics',
    icon: Activity,
    description: 'Engine Diagnostics'
  },
  {
    title: 'Progress Tracker',
    href: '/progress-tracker',
    icon: CheckSquare,
    description: 'Project Management'
  },
  {
    title: 'Community Chat',
    href: '/chat',
    icon: MessageCircle,
    description: 'Real-time Community Chat'
  },
  {
    title: 'Community Forum',
    href: '/forum',
    icon: MessageSquare,
    description: 'Connect with Builders'
  },
  {
    title: 'Parts Marketplace',
    href: '/parts-marketplace',
    icon: ShoppingCart,
    description: 'Find & Compare Parts'
  },
  {
    title: 'AI Recommendations',
    href: '/ai-recommendations',
    icon: Brain,
    description: 'Smart Part Suggestions'
  }
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-slate-900/95 backdrop-blur-sm border-r border-slate-700 transform transition-transform duration-300 ease-in-out z-50',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Close button for mobile */}
          <div className="flex justify-between items-center p-4 lg:hidden">
            <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-400" />
              SwapMaster Pro
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => {
                    // Close sidebar on mobile when item is clicked
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={cn(
                    'group flex items-center px-3 py-3 rounded-lg transition-all duration-200 hover:scale-105',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50 hover:shadow-md'
                  )}
                >
                  <Icon className={cn(
                    'h-5 w-5 mr-3 transition-all duration-200',
                    isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-white group-hover:scale-110'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      'text-sm font-medium truncate transition-colors',
                      isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                    )}>
                      {item.title}
                    </div>
                    <div className={cn(
                      'text-xs truncate mt-0.5 transition-colors',
                      isActive ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-400'
                    )}>
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-1 h-8 bg-white rounded-full opacity-80" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-slate-700">
            <div className="bg-gradient-to-r from-blue-900 to-cyan-900 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-slate-200">Pro Features</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Unlock advanced diagnostics and AI tools
              </p>
              <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-none">
                Upgrade Now
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
