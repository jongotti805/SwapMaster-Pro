import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Users,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Clock,
  Pin,
  Star,
  Award,
  Gift
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  views: number;
  upvotes: number;
  downvotes: number;
  replies: Array<{
    id: string;
    content: string;
    author: string;
    authorId: string;
    createdAt: string;
    upvotes: number;
    downvotes: number;
  }>;
  status: 'open' | 'solved' | 'ongoing' | 'complete';
  images?: string[];
  isPinned?: boolean;
}

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  reputation: number;
  level: string;
  badges: string[];
}

const Forum: React.FC = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<ForumPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(true);

  const categories = [
    'General Discussion',
    'Engine Swaps',
    'Electrical',
    'Transmission',
    'Troubleshooting',
    'Build Logs',
    'Parts & Tools',
    'Show & Tell'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsResponse, usersResponse] = await Promise.all([
          fetch('/data/forum-posts.json'),
          fetch('/data/users.json')
        ]);
        
        const postsData = await postsResponse.json();
        const usersData = await usersResponse.json();
        
        setPosts(postsData);
        setUsers(usersData);
        setFilteredPosts(postsData);
      } catch (error) {
        console.error('Error fetching forum data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = posts.filter(post => {
      const matchesSearch = 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    // Sort filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.upvotes + b.views) - (a.upvotes + a.views);
        case 'replies':
          return b.replies.length - a.replies.length;
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default: // recent
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    setFilteredPosts(filtered);
  }, [posts, searchTerm, categoryFilter, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'solved': return 'bg-green-500';
      case 'ongoing': return 'bg-blue-500';
      case 'complete': return 'bg-purple-500';
      default: return 'bg-slate-500';
    }
  };

  const getUserById = (userId: string) => {
    return users.find(user => user.id === userId);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
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
      {/* Free Feature Banner */}
      <Alert className="border-green-500 bg-green-500/10">
        <Gift className="h-4 w-4" />
        <AlertDescription className="text-green-400">
          <strong>FREE FEATURE:</strong> Join the community discussion and get help with your builds at no cost!
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Community Forum
          </h1>
          <p className="text-slate-400 mt-1">
            Connect with fellow builders, ask questions, and share knowledge
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <Button variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{posts.length}</p>
                <p className="text-xs text-slate-400">Total Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{users.length}</p>
                <p className="text-xs text-slate-400">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ThumbsUp className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {posts.reduce((sum, post) => sum + post.upvotes, 0)}
                </p>
                <p className="text-xs text-slate-400">Total Upvotes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {posts.filter(post => post.status === 'solved').length}
                </p>
                <p className="text-xs text-slate-400">Solved Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search posts..."
                className="pl-10 bg-slate-700/50 border-slate-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

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

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="replies">Most Replies</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="border-slate-600">
              <Filter className="h-4 w-4 mr-2" />
              Advanced
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Forum Posts */}
      <div className="space-y-4">
        {filteredPosts.map((post) => {
          const author = getUserById(post.authorId);
          
          return (
            <Card key={post.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Author Avatar */}
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={author?.avatar} alt={author?.displayName} />
                    <AvatarFallback className="bg-slate-700 text-slate-300">
                      {author?.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Post Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {post.isPinned && <Pin className="h-4 w-4 text-yellow-400" />}
                        <Link 
                          to={`/forum/${post.id}`}
                          className="text-lg font-semibold text-slate-200 hover:text-white transition-colors"
                        >
                          {post.title}
                        </Link>
                        <Badge className={`${getStatusColor(post.status)} text-white text-xs`}>
                          {post.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-slate-400">
                        {formatTimeAgo(post.updatedAt)}
                      </span>
                    </div>

                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                      {post.content}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="border-slate-600 text-slate-400">
                        {post.category}
                      </Badge>
                      {post.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="border-slate-600 text-slate-400 text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Author and Stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <div className="flex items-center space-x-1">
                          <span>by</span>
                          <Link 
                            to={`/profile/${post.authorId}`}
                            className="font-medium text-slate-300 hover:text-white"
                          >
                            {author?.displayName || post.author}
                          </Link>
                          {author?.level && (
                            <Badge variant="outline" className="text-xs border-slate-600">
                              {author.level}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{post.views}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{post.replies.length}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{post.upvotes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No Results */}
      {filteredPosts.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No posts found</h3>
            <p className="text-slate-400 mb-6">
              Try adjusting your search terms or create a new post to get the conversation started.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Post
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Forum;
