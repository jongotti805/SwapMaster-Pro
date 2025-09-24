import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  Wrench,
  TrendingUp,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  MessageSquare,
  Activity,
  ArrowRight,
  Gift,
  Sparkles,
  Star
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditContext';
import CreditBalanceDisplay from '@/components/features/CreditBalanceDisplay';

interface Project {
  id: string;
  title: string;
  progress: number;
  status: 'active' | 'planning' | 'complete';
  dueDate: string;
  nextTask: string;
}

interface RecentActivity {
  id: string;
  type: 'forum' | 'part' | 'progress' | 'diagnostic';
  title: string;
  time: string;
  user?: string;
}

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const { credits, hasCredits } = useCredits();
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedSwaps: 0,
    communityPosts: 0,
    partsTracked: 0
  });

  useEffect(() => {
    // Load dashboard data
    setProjects([
      {
        id: 'proj001',
        title: 'LS3 into 1967 Camaro',
        progress: 75,
        status: 'active',
        dueDate: '2025-08-15',
        nextTask: 'Install exhaust headers'
      },
      {
        id: 'proj002',
        title: '4.3L V6 Silverado Refresh',
        progress: 45,
        status: 'active',
        dueDate: '2025-07-30',
        nextTask: 'Connect wiring harness'
      },
      {
        id: 'proj003',
        title: 'Turbo Miata Build',
        progress: 100,
        status: 'complete',
        dueDate: '2025-06-01',
        nextTask: 'Project completed!'
      }
    ]);

    setRecentActivity([
      {
        id: 'act001',
        type: 'forum',
        title: 'New reply in "4.3L V6 Wiring Issues"',
        time: '2 hours ago',
        user: 'EngineSwapKing'
      },
      {
        id: 'act002',
        type: 'part',
        title: 'Motor mounts marked as received',
        time: '4 hours ago'
      },
      {
        id: 'act003',
        type: 'progress',
        title: 'Completed task: Remove original engine',
        time: '1 day ago'
      },
      {
        id: 'act004',
        type: 'diagnostic',
        title: 'OBD scan completed - 2 codes found',
        time: '2 days ago'
      }
    ]);

    setStats({
      activeProjects: 2,
      completedSwaps: 12,
      communityPosts: 156,
      partsTracked: 47
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'planning': return 'bg-yellow-500';
      case 'complete': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'forum': return MessageSquare;
      case 'part': return Package;
      case 'progress': return CheckCircle;
      case 'diagnostic': return Activity;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Welcome {profile?.display_name || user?.email?.split('@')[0] || 'back'}!
          </h1>
          <p className="text-slate-400 mt-1">
            {credits && credits.creditsRemaining > 0 ? (
              `You have ${credits.creditsRemaining} credits to explore premium features`
            ) : (
              'Explore our free community features and AI swap guides'
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <Button asChild>
            <Link to="/swap-guides">
              <Wrench className="h-4 w-4 mr-2" />
              Browse Guides
            </Link>
          </Button>
          {credits && credits.creditsRemaining > 0 ? (
            <Button variant="outline" asChild>
              <Link to="/ai-studio">
                <Zap className="h-4 w-4 mr-2" />
                Try AI Studio
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/forum">
                <MessageSquare className="h-4 w-4 mr-2" />
                Join Community
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Active Projects</CardTitle>
            <Car className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeProjects}</div>
            <p className="text-xs text-slate-400">
              +1 from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Completed Swaps</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.completedSwaps}</div>
            <p className="text-xs text-slate-400">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Community Posts</CardTitle>
            <Users className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.communityPosts}</div>
            <p className="text-xs text-slate-400">
              +12 this week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Parts Tracked</CardTitle>
            <Package className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.partsTracked}</div>
            <p className="text-xs text-slate-400">
              Across all projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message for New Users - Only show for users with exactly 3 credits and no usage */}
      {credits && credits.creditsRemaining === 3 && credits.totalCreditsUsed === 0 && (
        <Card className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Welcome to SwapMaster Pro! You got 3 free credits
                </h3>
                <p className="text-slate-300 text-sm mb-4">
                  Explore our premium AI features with your complimentary credits. Generate vehicle mockups, 
                  get compatibility checks, and try advanced parts searches!
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button size="sm" asChild className="bg-purple-600 hover:bg-purple-700">
                    <Link to="/ai-studio">
                      <Sparkles className="h-4 w-4 mr-1" />
                      AI Mockups
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white">
                    <Link to="/compatibility-check">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Compatibility
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white">
                    <Link to="/parts-marketplace">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Smart Search
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Balance Card for Mobile */}
      {user && (
        <div className="block md:hidden">
          <CreditBalanceDisplay variant="full" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-200 flex items-center justify-between">
              Active Projects
              <Button variant="ghost" size="sm" asChild>
                <Link to="/progress-tracker">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Your ongoing engine swap projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.filter(p => p.status === 'active').map((project) => (
              <div key={project.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-200">{project.title}</h3>
                  <Badge variant="secondary" className={`${getStatusColor(project.status)} text-white`}>
                    {project.progress}%
                  </Badge>
                </div>
                <Progress value={project.progress} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Next: {project.nextTask}</span>
                  <span className="text-slate-500">Due: {project.dueDate}</span>
                </div>
              </div>
            ))}
            
            {projects.filter(p => p.status === 'active').length === 0 && (
              <div className="text-center py-6">
                <Car className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No active projects</p>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <Link to="/progress-tracker">Start New Project</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-200">Recent Activity</CardTitle>
            <CardDescription className="text-slate-400">
              Latest updates from your projects and community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <Icon className="h-4 w-4 text-slate-400 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 font-medium">{activity.title}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400">{activity.time}</p>
                        {activity.user && (
                          <Badge variant="outline" className="text-xs border-slate-600">
                            {activity.user}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200">Quick Actions</CardTitle>
          <CardDescription className="text-slate-400">
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" asChild className="h-auto p-4 justify-start">
              <Link to="/ai-studio">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Zap className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Generate Mockup</div>
                    <div className="text-sm text-slate-400">AI Design Studio</div>
                  </div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" asChild className="h-auto p-4 justify-start">
              <Link to="/obd-diagnostics">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <Activity className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Run Diagnostics</div>
                    <div className="text-sm text-slate-400">OBD-II Scanner</div>
                  </div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" asChild className="h-auto p-4 justify-start">
              <Link to="/forum">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Ask Community</div>
                    <div className="text-sm text-slate-400">Get Help</div>
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Package = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

export default Dashboard;
