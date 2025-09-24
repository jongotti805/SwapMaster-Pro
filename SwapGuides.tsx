import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Clock,
  DollarSign,
  Gauge,
  Star,
  Users,
  ChevronRight,
  Wrench,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Engine {
  id: string;
  make: string;
  model: string;
  year: number;
  engine: string;
  displacement: string;
  cylinders: number;
  horsepower: number;
  torque: number;
  difficulty: string;
  estimatedTime: string;
  estimatedCost: string;
  description: string;
  image: string;
  compatibility: string[];
  requiredParts: string[];
}

const SwapGuides: React.FC = () => {
  const [engines, setEngines] = useState<Engine[]>([]);
  const [filteredEngines, setFilteredEngines] = useState<Engine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEngines = async () => {
      try {
        const response = await fetch('/data/engines.json');
        const data = await response.json();
        setEngines(data);
        setFilteredEngines(data);
      } catch (error) {
        console.error('Error fetching engines:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEngines();
  }, []);

  useEffect(() => {
    let filtered = engines.filter(engine => {
      const matchesSearch = 
        engine.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        engine.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        engine.engine.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDifficulty = difficultyFilter === 'all' || 
        engine.difficulty.toLowerCase() === difficultyFilter.toLowerCase();

      return matchesSearch && matchesDifficulty;
    });

    // Sort filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'difficulty':
          const difficultyOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case 'horsepower':
          return b.horsepower - a.horsepower;
        case 'year':
          return b.year - a.year;
        default: // popularity
          return 0; // Would normally sort by popularity metric
      }
    });

    setFilteredEngines(filtered);
  }, [engines, searchTerm, difficultyFilter, sortBy]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Engine Swap Guides
          </h1>
          <p className="text-slate-400 mt-1">
            Step-by-step guides for popular engine swaps
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <Button variant="outline">
            <Wrench className="h-4 w-4 mr-2" />
            Request Guide
          </Button>
          <Button>
            <Zap className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search engines, makes, models..."
                className="pl-10 bg-slate-700/50 border-slate-600 text-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Difficulty Filter */}
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-200">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-200">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="difficulty">Difficulty</SelectItem>
                <SelectItem value="horsepower">Power Output</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Button */}
            <Button variant="outline" className="border-slate-600">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEngines.map((engine) => (
          <Card key={engine.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-200 group">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg text-slate-200 group-hover:text-white transition-colors">
                    {engine.year} {engine.make} {engine.model}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {engine.engine} • {engine.displacement}
                  </CardDescription>
                </div>
                <Badge className={`${getDifficultyColor(engine.difficulty)} text-white`}>
                  {engine.difficulty}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Engine Image */}
              <div className="aspect-video rounded-lg overflow-hidden bg-slate-900">
                <img
                  src={engine.image}
                  alt={`${engine.engine} engine`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzMzNCI+PC9yZWN0Pjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVuZ2luZSBJbWFnZTwvdGV4dD48L3N2Zz4=';
                  }}
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Gauge className="h-4 w-4 text-red-400" />
                  <span className="text-slate-300">{engine.horsepower} HP</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Wrench className="h-4 w-4 text-blue-400" />
                  <span className="text-slate-300">{engine.torque} lb-ft</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span className="text-slate-300">{engine.estimatedTime}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <span className="text-slate-300">{engine.estimatedCost}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-400 line-clamp-2">
                {engine.description}
              </p>

              {/* Compatibility */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-300">Compatible Vehicles:</h4>
                <div className="flex flex-wrap gap-1">
                  {engine.compatibility.slice(0, 2).map((vehicle, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-slate-600 text-slate-400">
                      {vehicle}
                    </Badge>
                  ))}
                  {engine.compatibility.length > 2 && (
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                      +{engine.compatibility.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <Button asChild className="w-full">
                <Link to={`/swap-guides/${engine.id}`}>
                  View Guide
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredEngines.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="text-center py-12">
            <Wrench className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No guides found</h3>
            <p className="text-slate-400 mb-6">
              Try adjusting your search terms or filters, or request a new guide.
            </p>
            <Button variant="outline">
              Request New Guide
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SwapGuides;
