import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Settings,
  Target,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  estimatedTime: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  category: string;
  dependencies: string[];
  dueDate?: string;
  completedDate?: string;
  notes?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  targetDate: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Complete';
  progress: number;
  categories: Array<{
    name: string;
    tasks: Task[];
  }>;
}

const ProgressTracker: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    // Load project templates and user projects
    const loadProjects = async () => {
      try {
        const response = await fetch('/data/project-templates.json');
        const templates = await response.json();
        
        // Convert template to user project
        const userProject: Project = {
          id: 'user-project-1',
          name: 'LS3 Camaro Build',
          description: 'Complete LS engine swap into 1967 Camaro',
          startDate: '2025-05-01',
          targetDate: '2025-08-15',
          status: 'Active',
          progress: 45,
          categories: templates[0].categories.map((cat: any) => ({
            name: cat.name,
            tasks: cat.tasks.map((task: any) => ({
              ...task,
              completed: Math.random() > 0.7, // Random completion for demo
              priority: task.priority || 'Medium',
              category: cat.name,
              dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }))
          }))
        };
        
        setProjects([userProject]);
        setSelectedProject(userProject.id);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };

    loadProjects();
  }, []);

  const currentProject = projects.find(p => p.id === selectedProject);

  const toggleTaskCompletion = (taskId: string) => {
    setProjects(projects.map(project => ({
      ...project,
      categories: project.categories.map(category => ({
        ...category,
        tasks: category.tasks.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                completed: !task.completed, 
                completedDate: !task.completed ? new Date().toISOString().split('T')[0] : undefined 
              }
            : task
        )
      }))
    })));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'High': return 'bg-orange-500';
      case 'Critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planning': return 'bg-blue-500';
      case 'Active': return 'bg-green-500';
      case 'On Hold': return 'bg-yellow-500';
      case 'Complete': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateCategoryProgress = (tasks: Task[]) => {
    if (tasks.length === 0) return 0;
    return (tasks.filter(task => task.completed).length / tasks.length) * 100;
  };

  const getOverallStats = () => {
    if (!currentProject) return { totalTasks: 0, completedTasks: 0, overdueTasks: 0, upcomingTasks: 0 };
    
    const allTasks = currentProject.categories.flatMap(cat => cat.tasks);
    const today = new Date().toISOString().split('T')[0];
    
    return {
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter(task => task.completed).length,
      overdueTasks: allTasks.filter(task => !task.completed && task.dueDate && task.dueDate < today).length,
      upcomingTasks: allTasks.filter(task => !task.completed && task.dueDate && task.dueDate >= today && task.dueDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).length
    };
  };

  const stats = getOverallStats();

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <CheckSquare className="h-16 w-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-300 mb-2">No Projects Found</h3>
        <p className="text-slate-400 mb-6">Create your first project to start tracking progress</p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Progress Tracker
          </h1>
          <p className="text-slate-400 mt-1">
            Manage tasks and track progress for your engine swap projects
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <Badge className={`${getStatusColor(currentProject.status)} text-white`}>
            {currentProject.status}
          </Badge>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Project Settings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Project Overview */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center justify-between">
            {currentProject.name}
            <div className="text-sm font-normal text-slate-400">
              {Math.round(currentProject.progress)}% Complete
            </div>
          </CardTitle>
          <CardDescription className="text-slate-400">
            {currentProject.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={currentProject.progress} className="h-3" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span className="text-slate-400">Started:</span>
              <span className="text-slate-200">{currentProject.startDate}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-400" />
              <span className="text-slate-400">Target:</span>
              <span className="text-slate-200">{currentProject.targetDate}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckSquare className="h-4 w-4 text-purple-400" />
              <span className="text-slate-400">Tasks:</span>
              <span className="text-slate-200">{stats.completedTasks}/{stats.totalTasks}</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-orange-400" />
              <span className="text-slate-400">Progress:</span>
              <span className="text-slate-200">{Math.round(currentProject.progress)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalTasks}</div>
            <p className="text-xs text-slate-400">
              {stats.completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.completedTasks}</div>
            <p className="text-xs text-slate-400">
              {Math.round((stats.completedTasks / stats.totalTasks) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.overdueTasks}</div>
            <p className="text-xs text-slate-400">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Due This Week</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.upcomingTasks}</div>
            <p className="text-xs text-slate-400">
              Coming up
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Categories */}
      <Tabs defaultValue={currentProject.categories[0]?.name} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-slate-800/50">
            {currentProject.categories.map((category) => (
              <TabsTrigger key={category.name} value={category.name}>
                {category.name}
                <Badge className="ml-2 text-xs" variant="outline">
                  {category.tasks.filter(t => t.completed).length}/{category.tasks.length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-completed"
              checked={showCompleted}
              onCheckedChange={(checked) => setShowCompleted(checked as boolean)}
            />
            <label htmlFor="show-completed" className="text-sm text-slate-300">
              Show completed tasks
            </label>
          </div>
        </div>

        {currentProject.categories.map((category) => (
          <TabsContent key={category.name} value={category.name} className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center justify-between">
                  {category.name}
                  <div className="text-sm font-normal text-slate-400">
                    {Math.round(calculateCategoryProgress(category.tasks))}% Complete
                  </div>
                </CardTitle>
                <Progress value={calculateCategoryProgress(category.tasks)} className="h-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.tasks
                    .filter(task => showCompleted || !task.completed)
                    .map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 rounded-lg border transition-all ${
                        task.completed
                          ? 'bg-slate-700/30 border-slate-600 opacity-60'
                          : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTaskCompletion(task.id)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`font-medium ${
                              task.completed ? 'text-slate-400 line-through' : 'text-slate-200'
                            }`}>
                              {task.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                                {task.priority}
                              </Badge>
                              {task.dueDate && (
                                <Badge variant="outline" className="text-xs border-slate-500">
                                  Due: {task.dueDate}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <p className={`text-sm mb-2 ${
                            task.completed ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            {task.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-slate-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{task.estimatedTime}</span>
                            </div>
                            {task.completedDate && (
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="h-3 w-3 text-green-400" />
                                <span>Completed: {task.completedDate}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ProgressTracker;
