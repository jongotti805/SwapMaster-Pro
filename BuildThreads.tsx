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
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Eye, 
  Calendar,
  User,
  Car,
  Wrench,
  Trophy,
  Star,
  Image as ImageIcon,
  Tag,
  Filter,
  TrendingUp,
  Heart,
  Share2,
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface BuildThread {
  id: string;
  title: string;
  content: string;
  thread_type: string;
  vehicle_info: any;
  build_stage: string;
  images: string[];
  tags: string[];
  is_featured: boolean;
  upvotes_count: number;
  downvotes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  user_id: string;
  author_name?: string;
  author_image?: string;
}

interface ThreadComment {
  id: string;
  content: string;
  images: string[];
  upvotes_count: number;
  is_helpful: boolean;
  created_at: string;
  user_id: string;
  author_name?: string;
}

const BuildThreads: React.FC = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<BuildThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<BuildThread | null>(null);
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [threadType, setThreadType] = useState('all');
  const [buildStage, setBuildStage] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');

  // New thread form state
  const [newThread, setNewThread] = useState({
    title: '',
    content: '',
    thread_type: 'build_progress',
    build_stage: 'planning',
    vehicle_info: {
      year: '',
      make: '',
      model: '',
      engine: ''
    },
    tags: [] as string[],
    images: [] as string[]
  });

  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchThreads();
  }, [threadType, buildStage, sortBy, searchQuery]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('build_threads')
        .select('*')
        .order('created_at', { ascending: false });

      if (threadType !== 'all') {
        query = query.eq('thread_type', threadType);
      }

      if (buildStage !== 'all') {
        query = query.eq('build_stage', buildStage);
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      setThreads(data || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
      toast.error('Failed to load build threads');
    } finally {
      setLoading(false);
    }
  };

  const createThread = async () => {
    if (!user) {
      toast.error('Please log in to create a thread');
      return;
    }

    if (!newThread.title || !newThread.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('community-engagement', {
        body: {
          action: 'create_thread',
          title: newThread.title,
          content: newThread.content,
          threadType: newThread.thread_type,
          vehicleInfo: newThread.vehicle_info,
          buildStage: newThread.build_stage,
          images: newThread.images,
          tags: newThread.tags
        }
      });

      if (error) throw error;

      toast.success('Build thread created successfully! You earned 2 credits!');
      setShowCreateThread(false);
      setNewThread({
        title: '',
        content: '',
        thread_type: 'build_progress',
        build_stage: 'planning',
        vehicle_info: { year: '', make: '', model: '', engine: '' },
        tags: [],
        images: []
      });
      fetchThreads();
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error('Failed to create thread');
    }
  };

  const voteOnThread = async (threadId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) {
      toast.error('Please log in to vote');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('community-engagement', {
        body: {
          action: 'vote_thread',
          threadId,
          voteType
        }
      });

      if (error) throw error;

      toast.success(`Thread ${data.data.action === 'vote_removed' ? 'vote removed' : 'voted on'} successfully`);
      fetchThreads();
    } catch (error) {
      console.error('Error voting on thread:', error);
      toast.error('Failed to vote on thread');
    }
  };

  const addComment = async (threadId: string) => {
    if (!user || !newComment.trim()) return;

    try {
      const { data, error } = await supabase.functions.invoke('community-engagement', {
        body: {
          action: 'add_comment',
          threadId,
          content: newComment,
          images: []
        }
      });

      if (error) throw error;

      setNewComment('');
      toast.success('Comment added successfully!');
      fetchThreadComments(threadId);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const fetchThreadComments = async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from('build_thread_comments')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const getThreadTypeIcon = (type: string) => {
    switch (type) {
      case 'build_progress': return <Car className="h-4 w-4" />;
      case 'question': return <MessageSquare className="h-4 w-4" />;
      case 'showcase': return <Trophy className="h-4 w-4" />;
      case 'guide': return <BookOpen className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  const getBuildStageColor = (stage: string) => {
    switch (stage) {
      case 'planning': return 'bg-blue-500';
      case 'in_progress': return 'bg-orange-500';
      case 'completed': return 'bg-green-500';
      case 'stalled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Build Threads
          </h1>
          <p className="text-muted-foreground mt-2">
            Share your build journey, get help from the community, and showcase your projects
          </p>
        </div>
        
        <Dialog open={showCreateThread} onOpenChange={setShowCreateThread}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              New Build Thread
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Build Thread</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="thread-type">Thread Type</Label>
                  <Select value={newThread.thread_type} onValueChange={(value) => 
                    setNewThread({...newThread, thread_type: value})
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="build_progress">Build Progress</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                      <SelectItem value="showcase">Showcase</SelectItem>
                      <SelectItem value="guide">Guide/Tutorial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="build-stage">Build Stage</Label>
                  <Select value={newThread.build_stage} onValueChange={(value) => 
                    setNewThread({...newThread, build_stage: value})
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="stalled">Stalled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Thread Title</Label>
                <Input
                  id="title"
                  placeholder="My LS3 swap journey..."
                  value={newThread.title}
                  onChange={(e) => setNewThread({...newThread, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Share your build details, progress updates, questions, or showcase your work..."
                  value={newThread.content}
                  onChange={(e) => setNewThread({...newThread, content: e.target.value})}
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vehicle Year</Label>
                  <Input
                    placeholder="2015"
                    value={newThread.vehicle_info.year}
                    onChange={(e) => setNewThread({
                      ...newThread, 
                      vehicle_info: {...newThread.vehicle_info, year: e.target.value}
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Make</Label>
                  <Input
                    placeholder="Chevrolet"
                    value={newThread.vehicle_info.make}
                    onChange={(e) => setNewThread({
                      ...newThread, 
                      vehicle_info: {...newThread.vehicle_info, make: e.target.value}
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input
                    placeholder="Camaro"
                    value={newThread.vehicle_info.model}
                    onChange={(e) => setNewThread({
                      ...newThread, 
                      vehicle_info: {...newThread.vehicle_info, model: e.target.value}
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Engine</Label>
                  <Input
                    placeholder="LS3 V8"
                    value={newThread.vehicle_info.engine}
                    onChange={(e) => setNewThread({
                      ...newThread, 
                      vehicle_info: {...newThread.vehicle_info, engine: e.target.value}
                    })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowCreateThread(false)}>
                  Cancel
                </Button>
                <Button onClick={createThread}>
                  Create Thread
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search build threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select value={threadType} onValueChange={setThreadType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Thread Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="build_progress">Build Progress</SelectItem>
                  <SelectItem value="question">Questions</SelectItem>
                  <SelectItem value="showcase">Showcase</SelectItem>
                  <SelectItem value="guide">Guides</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={buildStage} onValueChange={setBuildStage}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Build Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="stalled">Stalled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="most_comments">Most Comments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thread List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading build threads...</p>
          </div>
        ) : threads.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No build threads found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search or filters' : 'Be the first to share your build journey!'}
              </p>
              <Button onClick={() => setShowCreateThread(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Thread
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {threads.map((thread) => (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer" 
                      onClick={() => {
                        setSelectedThread(thread);
                        fetchThreadComments(thread.id);
                      }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={thread.author_image} />
                          <AvatarFallback>
                            {thread.author_name ? thread.author_name.charAt(0) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getThreadTypeIcon(thread.thread_type)}
                            <Badge variant="secondary" className="text-xs">
                              {thread.thread_type.replace('_', ' ')}
                            </Badge>
                            <div className={`w-2 h-2 rounded-full ${getBuildStageColor(thread.build_stage)}`} />
                            <span className="text-xs text-muted-foreground capitalize">
                              {thread.build_stage.replace('_', ' ')}
                            </span>
                            {thread.is_featured && (
                              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg truncate">{thread.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {thread.vehicle_info?.year && thread.vehicle_info?.make && (
                              <span className="flex items-center gap-1">
                                <Car className="h-3 w-3" />
                                {thread.vehicle_info.year} {thread.vehicle_info.make} {thread.vehicle_info.model}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {thread.upvotes_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {thread.comments_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {thread.views_count}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground line-clamp-3">
                      {thread.content}
                    </p>
                    {thread.tags && thread.tags.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <div className="flex gap-1 flex-wrap">
                          {thread.tags.slice(0, 5).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {thread.tags.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{thread.tags.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Thread Detail Dialog */}
      <Dialog open={!!selectedThread} onOpenChange={() => setSelectedThread(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedThread && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedThread.author_image} />
                      <AvatarFallback>
                        {selectedThread.author_name ? selectedThread.author_name.charAt(0) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-xl">{selectedThread.title}</DialogTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{selectedThread.author_name || 'Anonymous'}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(selectedThread.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => voteOnThread(selectedThread.id, 'upvote')}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {selectedThread.upvotes_count}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => voteOnThread(selectedThread.id, 'downvote')}
                    >
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      {selectedThread.downvotes_count}
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {getThreadTypeIcon(selectedThread.thread_type)}
                  <Badge variant="secondary">
                    {selectedThread.thread_type.replace('_', ' ')}
                  </Badge>
                  <div className={`w-2 h-2 rounded-full ${getBuildStageColor(selectedThread.build_stage)}`} />
                  <span className="text-sm text-muted-foreground capitalize">
                    {selectedThread.build_stage.replace('_', ' ')}
                  </span>
                  {selectedThread.vehicle_info?.year && selectedThread.vehicle_info?.make && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Car className="h-3 w-3" />
                        {selectedThread.vehicle_info.year} {selectedThread.vehicle_info.make} {selectedThread.vehicle_info.model}
                      </div>
                    </>
                  )}
                </div>

                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{selectedThread.content}</p>
                </div>

                {selectedThread.images && selectedThread.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedThread.images.map((image, index) => (
                      <img 
                        key={index} 
                        src={image} 
                        alt={`Build image ${index + 1}`}
                        className="rounded-lg object-cover aspect-square"
                      />
                    ))}
                  </div>
                )}

                {selectedThread.tags && selectedThread.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <div className="flex gap-1 flex-wrap">
                      {selectedThread.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Comments Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
                
                {user && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Add your comment, question, or helpful advice..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => addComment(selectedThread.id)}
                        disabled={!newComment.trim()}
                      >
                        Post Comment
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No comments yet. Be the first to help or ask a question!
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 p-4 rounded-lg bg-muted/50">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {comment.author_name ? comment.author_name.charAt(0) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.author_name || 'Anonymous'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                            {comment.is_helpful && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Helpful
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              {comment.upvotes_count}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuildThreads;