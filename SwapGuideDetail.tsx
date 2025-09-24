import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Gauge,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Star,
  Share2,
  Bookmark,
  Download,
  Play,
  Users,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface SwapGuide {
  id: string;
  make: string;
  model: string;
  year: number;
  engine: string;
  displacement: string;
  cylinders: number;
  horsepower: number;
  torque: number;
  fuelType: string;
  difficulty: string;
  estimatedTime: string;
  estimatedCost: string;
  description: string;
  image: string;
  compatibility: string[];
  requiredParts: string[];
  steps: Array<{
    step: number;
    title: string;
    description: string;
    estimatedTime: string;
    tools: string[];
    safety: string[];
  }>;
  commonIssues: Array<{
    issue: string;
    solution: string;
    difficulty: string;
  }>;
  tips: string[];
}

const SwapGuideDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [guide, setGuide] = useState<SwapGuide | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const response = await fetch('/data/engines.json');
        const data = await response.json();
        const foundGuide = data.find((engine: SwapGuide) => engine.id === id);
        setGuide(foundGuide);
      } catch (error) {
        console.error('Error fetching guide:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGuide();
    }
  }, [id]);

  const toggleStepCompletion = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) {
      setCompletedSteps(completedSteps.filter(step => step !== stepIndex));
    } else {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-300 mb-4">Guide not found</h2>
        <Button asChild>
          <Link to="/swap-guides">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Guides
          </Link>
        </Button>
      </div>
    );
  }

  const progressPercentage = (completedSteps.length / guide.steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link to="/swap-guides">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Guides
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {guide.year} {guide.make} {guide.model}
            </h1>
            <p className="text-xl text-slate-300 mt-1">{guide.engine} Engine Swap</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Bookmark className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF Guide
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Badge className={`${getDifficultyColor(guide.difficulty)} text-white`}>
                {guide.difficulty}
              </Badge>
              <span className="text-sm text-slate-400">Difficulty</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-slate-200 font-medium">{guide.estimatedTime}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-slate-200 font-medium">{guide.estimatedCost}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Gauge className="h-4 w-4 text-red-400" />
              <span className="text-slate-200 font-medium">{guide.horsepower} HP</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Tracker */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center justify-between">
            Your Progress
            <span className="text-sm font-normal text-slate-400">
              {completedSteps.length} of {guide.steps.length} steps
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="h-3 mb-2" />
          <p className="text-sm text-slate-400">
            {progressPercentage.toFixed(0)}% complete
          </p>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="steps">Step by Step</TabsTrigger>
          <TabsTrigger value="parts">Parts List</TabsTrigger>
          <TabsTrigger value="issues">Common Issues</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engine Image and Details */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-200">Engine Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-slate-900">
                  <img
                    src={guide.image}
                    alt={`${guide.engine} engine`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzMzNCI+PC9yZWN0Pjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVuZ2luZSBJbWFnZTwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Displacement:</span>
                    <p className="text-slate-200 font-medium">{guide.displacement}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Cylinders:</span>
                    <p className="text-slate-200 font-medium">{guide.cylinders}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Horsepower:</span>
                    <p className="text-slate-200 font-medium">{guide.horsepower} HP</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Torque:</span>
                    <p className="text-slate-200 font-medium">{guide.torque} lb-ft</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Fuel Type:</span>
                    <p className="text-slate-200 font-medium">{guide.fuelType}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description and Compatibility */}
            <div className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-200">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">{guide.description}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-200">Compatible Vehicles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {guide.compatibility.map((vehicle, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-slate-300">{vehicle}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="steps" className="space-y-6">
          <div className="space-y-4">
            {guide.steps.map((step, index) => (
              <Card key={step.step} className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-200 flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStepCompletion(index)}
                        className={`p-1 rounded-full ${
                          completedSteps.includes(index)
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <span>Step {step.step}: {step.title}</span>
                    </CardTitle>
                    <Badge variant="outline" className="border-slate-600">
                      {step.estimatedTime}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-300">{step.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Required Tools:</h4>
                      <ul className="space-y-1">
                        {step.tools.map((tool, toolIndex) => (
                          <li key={toolIndex} className="text-sm text-slate-400 flex items-center">
                            <Wrench className="h-3 w-3 mr-2" />
                            {tool}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Safety Notes:</h4>
                      <ul className="space-y-1">
                        {step.safety.map((safety, safetyIndex) => (
                          <li key={safetyIndex} className="text-sm text-slate-400 flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-2 text-yellow-400" />
                            {safety}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="parts" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">Required Parts List</CardTitle>
              <CardDescription className="text-slate-400">
                Essential components needed for this engine swap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guide.requiredParts.map((part, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">{part}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          <div className="space-y-4">
            {guide.commonIssues.map((issue, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-200 flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <span>{issue.issue}</span>
                    <Badge className={`${getDifficultyColor(issue.difficulty)} text-white ml-auto`}>
                      {issue.difficulty}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">{issue.solution}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">Pro Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {guide.tips.map((tip, index) => (
                  <li key={index} className="text-slate-300 flex items-start space-x-2">
                    <Star className="h-4 w-4 text-yellow-400 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="community" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">Community Discussion</CardTitle>
              <CardDescription className="text-slate-400">
                Connect with others who have completed this swap
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span className="text-slate-300">24 members</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">156 posts</span>
                  </div>
                </div>
                <Button asChild>
                  <Link to="/forum">Join Discussion</Link>
                </Button>
              </div>
              
              <Separator className="bg-slate-700" />
              
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-4">
                  Join the community to ask questions and share your progress
                </p>
                <Button variant="outline" asChild>
                  <Link to="/forum">Go to Forum</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SwapGuideDetail;
