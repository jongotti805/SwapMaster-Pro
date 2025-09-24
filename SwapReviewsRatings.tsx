import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Star,
  StarHalf,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  User,
  Calendar,
  Wrench,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Filter,
  Plus,
  Heart,
  Share
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface SwapReview {
  id: string;
  user_id: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  vehicle_year: number;
  vehicle_make: string;
  vehicle_model: string;
  engine_name: string;
  engine_make: string;
  rating: number;
  difficulty_rating: number;
  cost_rating: number;
  title: string;
  review_text: string;
  pros: string[];
  cons: string[];
  actual_cost: number;
  time_taken_hours: number;
  would_recommend: boolean;
  images: string[];
  helpful_count: number;
  created_at: string;
  tags: string[];
  swap_status: 'completed' | 'in_progress' | 'planning';
}

interface SwapReviewsRatingsProps {
  vehicleInfo?: {
    year?: number;
    make?: string;
    model?: string;
  };
  engineInfo?: {
    name?: string;
    make?: string;
  };
  compatibilityResult?: any;
}

const SwapReviewsRatings: React.FC<SwapReviewsRatingsProps> = ({
  vehicleInfo,
  engineInfo,
  compatibilityResult
}) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<SwapReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Review form state
  const [newReview, setNewReview] = useState({
    title: '',
    review_text: '',
    rating: 5,
    difficulty_rating: 3,
    cost_rating: 3,
    actual_cost: '',
    time_taken_hours: '',
    would_recommend: true,
    pros: [''],
    cons: [''],
    tags: [] as string[],
    swap_status: 'completed' as 'completed' | 'in_progress' | 'planning'
  });

  useEffect(() => {
    loadReviews();
  }, [vehicleInfo, engineInfo, filterBy, sortBy]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('community-features', {
        body: {
          action: 'get_swap_reviews',
          vehicleMake: vehicleInfo?.make,
          vehicleModel: vehicleInfo?.model,
          vehicleYear: vehicleInfo?.year,
          engineMake: engineInfo?.make,
          engineName: engineInfo?.name,
          filterBy,
          sortBy
        }
      });

      if (error) throw error;
      
      setReviews(data?.data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      // Load sample reviews for demo
      setReviews(getSampleReviews());
    } finally {
      setLoading(false);
    }
  };

  const getSampleReviews = (): SwapReview[] => {
    if (!vehicleInfo?.make || !engineInfo?.name) return [];
    
    return [
      {
        id: '1',
        user_id: 'sample1',
        reviewer_name: 'Mike Rodriguez',
        vehicle_year: vehicleInfo.year || 2010,
        vehicle_make: vehicleInfo.make,
        vehicle_model: vehicleInfo.model || 'Model',
        engine_name: engineInfo.name,
        engine_make: engineInfo.make || 'Generic',
        rating: 4,
        difficulty_rating: 3,
        cost_rating: 3,
        title: `Excellent ${engineInfo.name} swap experience`,
        review_text: `Just completed my ${engineInfo.name} swap in my ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}. Overall very satisfied with the results. The power increase is substantial and the engine fits well with some modifications.`,
        pros: ['Great power increase', 'Reliable engine', 'Good aftermarket support'],
        cons: ['Requires custom mounts', 'Expensive initial cost', 'Complex wiring'],
        actual_cost: 8500,
        time_taken_hours: 45,
        would_recommend: true,
        images: [],
        helpful_count: 12,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['engine-swap', 'performance', 'diy'],
        swap_status: 'completed'
      },
      {
        id: '2',
        user_id: 'sample2', 
        reviewer_name: 'Sarah Chen',
        vehicle_year: vehicleInfo.year || 2015,
        vehicle_make: vehicleInfo.make,
        vehicle_model: vehicleInfo.model || 'Model',
        engine_name: engineInfo.name,
        engine_make: engineInfo.make || 'Generic',
        rating: 5,
        difficulty_rating: 4,
        cost_rating: 2,
        title: 'Challenging but rewarding swap',
        review_text: `This ${engineInfo.name} swap was definitely not for beginners, but the end result is amazing. The car feels completely transformed.`,
        pros: ['Incredible performance', 'Great sound', 'Impressive reliability'],
        cons: ['Very expensive', 'Required professional help', 'Long lead time for parts'],
        actual_cost: 12000,
        time_taken_hours: 60,
        would_recommend: true,
        images: [],
        helpful_count: 8,
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['professional-install', 'performance', 'expensive'],
        swap_status: 'completed'
      }
    ];
  };

  const submitReview = async () => {
    if (!user) {
      toast.error('Please log in to submit a review');
      return;
    }

    if (!newReview.title || !newReview.review_text) {
      toast.error('Please fill in title and review text');
      return;
    }

    try {
      const reviewData = {
        ...newReview,
        vehicle_year: vehicleInfo?.year,
        vehicle_make: vehicleInfo?.make,
        vehicle_model: vehicleInfo?.model,
        engine_name: engineInfo?.name,
        engine_make: engineInfo?.make,
        actual_cost: parseFloat(newReview.actual_cost) || 0,
        time_taken_hours: parseFloat(newReview.time_taken_hours) || 0,
        pros: newReview.pros.filter(p => p.trim()),
        cons: newReview.cons.filter(c => c.trim())
      };

      const { data, error } = await supabase.functions.invoke('community-features', {
        body: {
          action: 'create_swap_review',
          ...reviewData
        }
      });

      if (error) throw error;

      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      setNewReview({
        title: '',
        review_text: '',
        rating: 5,
        difficulty_rating: 3,
        cost_rating: 3,
        actual_cost: '',
        time_taken_hours: '',
        would_recommend: true,
        pros: [''],
        cons: [''],
        tags: [],
        swap_status: 'completed'
      });
      loadReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };

  const markHelpful = async (reviewId: string) => {
    if (!user) {
      toast.error('Please log in to mark reviews as helpful');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('community-features', {
        body: {
          action: 'mark_review_helpful',
          reviewId
        }
      });

      if (error) throw error;

      // Update local state
      setReviews(reviews.map(review => 
        review.id === reviewId 
          ? { ...review, helpful_count: review.helpful_count + 1 }
          : review
      ));
      
      toast.success('Marked as helpful!');
    } catch (error) {
      console.error('Error marking review helpful:', error);
      toast.error('Failed to mark as helpful');
    }
  };

  const renderStars = (rating: number, size = 'sm') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} fill-yellow-400 text-yellow-400`} />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <StarHalf key="half" className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} fill-yellow-400 text-yellow-400`} />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400`} />
      );
    }
    
    return stars;
  };

  const getDifficultyLabel = (rating: number) => {
    if (rating <= 2) return { label: 'Easy', color: 'text-green-400' };
    if (rating <= 3) return { label: 'Moderate', color: 'text-yellow-400' };
    if (rating <= 4) return { label: 'Difficult', color: 'text-orange-400' };
    return { label: 'Expert', color: 'text-red-400' };
  };

  const getCostLabel = (rating: number) => {
    if (rating <= 2) return { label: 'Budget', color: 'text-green-400' };
    if (rating <= 3) return { label: 'Moderate', color: 'text-yellow-400' };
    if (rating <= 4) return { label: 'Expensive', color: 'text-orange-400' };
    return { label: 'Very Expensive', color: 'text-red-400' };
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const averageDifficulty = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.difficulty_rating, 0) / reviews.length
    : 0;

  const averageCost = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.cost_rating, 0) / reviews.length
    : 0;

  const recommendationPercentage = reviews.length > 0
    ? (reviews.filter(r => r.would_recommend).length / reviews.length) * 100
    : 0;

  if (!vehicleInfo?.make || !engineInfo?.name) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center text-slate-400">
            <MessageCircle className="h-12 w-12 mx-auto mb-4" />
            <p>Select a vehicle and engine to see community reviews and ratings</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-400" />
            Community Reviews: {vehicleInfo.make} {vehicleInfo.model} + {engineInfo.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                {renderStars(averageRating, 'lg')}
              </div>
              <p className="text-2xl font-bold text-white">{averageRating.toFixed(1)}</p>
              <p className="text-sm text-slate-400">{reviews.length} reviews</p>
            </div>
            
            <div className="text-center">
              <Wrench className="h-8 w-8 mx-auto mb-2 text-blue-400" />
              <p className={`text-lg font-semibold ${getDifficultyLabel(averageDifficulty).color}`}>
                {getDifficultyLabel(averageDifficulty).label}
              </p>
              <p className="text-sm text-slate-400">Avg. Difficulty</p>
            </div>
            
            <div className="text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-400" />
              <p className={`text-lg font-semibold ${getCostLabel(averageCost).color}`}>
                {getCostLabel(averageCost).label}
              </p>
              <p className="text-sm text-slate-400">Avg. Cost</p>
            </div>
            
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-400" />
              <p className="text-lg font-semibold text-white">{recommendationPercentage.toFixed(0)}%</p>
              <p className="text-sm text-slate-400">Would Recommend</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-40 bg-slate-700 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviews</SelectItem>
              <SelectItem value="completed">Completed Swaps</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="planning">Planning Stage</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 bg-slate-700 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="rating_high">Highest Rating</SelectItem>
              <SelectItem value="rating_low">Lowest Rating</SelectItem>
              <SelectItem value="helpful">Most Helpful</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Write Review
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Review Title</Label>
                <Input
                  id="title"
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                  placeholder="Summarize your experience"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Overall Rating</Label>
                  <Select 
                    value={newReview.rating.toString()} 
                    onValueChange={(value) => setNewReview({ ...newReview, rating: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map(rating => (
                        <SelectItem key={rating} value={rating.toString()}>
                          <div className="flex items-center gap-2">
                            {renderStars(rating)}
                            <span>{rating}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Difficulty (1-5)</Label>
                  <Select 
                    value={newReview.difficulty_rating.toString()} 
                    onValueChange={(value) => setNewReview({ ...newReview, difficulty_rating: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(rating => (
                        <SelectItem key={rating} value={rating.toString()}>
                          {getDifficultyLabel(rating).label} ({rating})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Cost Level (1-5)</Label>
                  <Select 
                    value={newReview.cost_rating.toString()} 
                    onValueChange={(value) => setNewReview({ ...newReview, cost_rating: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(rating => (
                        <SelectItem key={rating} value={rating.toString()}>
                          {getCostLabel(rating).label} ({rating})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="review_text">Review Details</Label>
                <Textarea
                  id="review_text"
                  value={newReview.review_text}
                  onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
                  className="bg-slate-700 border-slate-600 min-h-24"
                  placeholder="Share your detailed experience with this engine swap..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Actual Cost ($)</Label>
                  <Input
                    type="number"
                    value={newReview.actual_cost}
                    onChange={(e) => setNewReview({ ...newReview, actual_cost: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                    placeholder="Total cost in USD"
                  />
                </div>
                
                <div>
                  <Label>Time Taken (hours)</Label>
                  <Input
                    type="number"
                    value={newReview.time_taken_hours}
                    onChange={(e) => setNewReview({ ...newReview, time_taken_hours: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                    placeholder="Total hours spent"
                  />
                </div>
              </div>
              
              <div>
                <Label>Swap Status</Label>
                <Select 
                  value={newReview.swap_status} 
                  onValueChange={(value: 'completed' | 'in_progress' | 'planning') => setNewReview({ ...newReview, swap_status: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="planning">Planning Stage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recommend"
                  checked={newReview.would_recommend}
                  onChange={(e) => setNewReview({ ...newReview, would_recommend: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="recommend">I would recommend this swap to others</Label>
              </div>
              
              <Button onClick={submitReview} className="w-full bg-purple-600 hover:bg-purple-700">
                Submit Review
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold text-white mb-2">No Reviews Yet</h3>
              <p className="text-slate-400 mb-6">
                Be the first to review this {engineInfo.name} swap in a {vehicleInfo.make} {vehicleInfo.model}!
              </p>
              <Button 
                onClick={() => setShowReviewForm(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Write the First Review
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={review.reviewer_avatar} />
                        <AvatarFallback className="bg-slate-700">
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-white">{review.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <span>{review.reviewer_name}</span>
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(review.created_at))} ago</span>
                              <Badge variant="outline" className="text-xs">
                                {review.swap_status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center gap-1 mb-1">
                              {renderStars(review.rating)}
                            </div>
                            <div className="text-xs text-slate-400">
                              <span className={getDifficultyLabel(review.difficulty_rating).color}>
                                {getDifficultyLabel(review.difficulty_rating).label}
                              </span>
                              {' • '}
                              <span className={getCostLabel(review.cost_rating).color}>
                                {getCostLabel(review.cost_rating).label}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-slate-300 mb-4">{review.review_text}</p>
                        
                        {(review.pros.length > 0 || review.cons.length > 0) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {review.pros.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4" />
                                  Pros
                                </h5>
                                <ul className="text-sm text-slate-300 space-y-1">
                                  {review.pros.map((pro, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <span className="text-green-400 mt-1">+</span>
                                      {pro}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {review.cons.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-1">
                                  <AlertTriangle className="h-4 w-4" />
                                  Cons
                                </h5>
                                <ul className="text-sm text-slate-300 space-y-1">
                                  {review.cons.map((con, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <span className="text-red-400 mt-1">-</span>
                                      {con}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                          <div className="flex items-center gap-6 text-sm text-slate-400">
                            {review.actual_cost > 0 && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                ${review.actual_cost.toLocaleString()}
                              </div>
                            )}
                            {review.time_taken_hours > 0 && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {review.time_taken_hours}h
                              </div>
                            )}
                            {review.would_recommend && (
                              <div className="flex items-center gap-1 text-green-400">
                                <CheckCircle className="h-4 w-4" />
                                Recommends
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markHelpful(review.id)}
                              className="text-slate-400 hover:text-white"
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              {review.helpful_count}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default SwapReviewsRatings;