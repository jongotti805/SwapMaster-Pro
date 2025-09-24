import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Flag,
  Eye,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';

const ForumPost: React.FC = () => {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch('/data/forum-posts.json');
        const posts = await response.json();
        const foundPost = posts.find((p: any) => p.id === id);
        setPost(foundPost);
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPost();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!post) {
    return <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-slate-300 mb-4">Post not found</h2>
      <Button asChild>
        <Link to="/forum">Back to Forum</Link>
      </Button>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link to="/forum">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forum
          </Link>
        </Button>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Flag className="h-4 w-4 mr-2" />
            Report
          </Button>
        </div>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl text-slate-200">{post.title}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-slate-400">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.views} views</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <Badge className="bg-blue-500 text-white">{post.category}</Badge>
              </div>
            </div>
            <Badge className={`${post.status === 'solved' ? 'bg-green-500' : 'bg-slate-500'} text-white`}>
              {post.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-4">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-slate-700 text-slate-300">
                {post.author.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-slate-200">{post.author}</span>
                <Badge variant="outline" className="text-xs">Expert</Badge>
              </div>
              <div className="text-slate-300 whitespace-pre-wrap">{post.content}</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <ThumbsUp className="h-4 w-4 mr-1" />
                {post.upvotes}
              </Button>
              <Button variant="ghost" size="sm">
                <ThumbsDown className="h-4 w-4 mr-1" />
                {post.downvotes}
              </Button>
            </div>
            <div className="flex gap-1">
              {post.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">#{tag}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-200">
          Replies ({post.replies.length})
        </h3>
        
        {post.replies.map((reply: any) => (
          <Card key={reply.id} className="bg-slate-800/30 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-slate-700 text-slate-300">
                    {reply.author.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-slate-200">{reply.author}</span>
                    <span className="text-xs text-slate-400">{new Date(reply.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-slate-300">{reply.content}</div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Button variant="ghost" size="sm">
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      {reply.upvotes}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ThumbsDown className="h-3 w-3 mr-1" />
                      {reply.downvotes}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reply Form */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200">Add Your Reply</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Share your thoughts, solutions, or questions..."
            className="bg-slate-700/50 border-slate-600 text-slate-200 min-h-[120px]"
          />
          <div className="flex justify-between">
            <Button variant="outline">Preview</Button>
            <Button>Post Reply</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForumPost;
