import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  User,
  Star,
  Award,
  MessageSquare,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Settings,
  Edit
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const UserProfile: React.FC = () => {
  const { id } = useParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/data/users.json');
        const users = await response.json();
        const foundUser = users.find((u: any) => u.id === id);
        setUser(foundUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchUser();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!user) {
    return <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-slate-300 mb-4">User not found</h2>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.avatar} alt={user.displayName} />
                <AvatarFallback className="bg-slate-700 text-slate-300 text-2xl">
                  {user.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-200">{user.displayName}</h1>
                  <p className="text-slate-400">@{user.username}</p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge className="bg-blue-500 text-white">{user.level}</Badge>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-slate-300">{user.reputation}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-400">Joined {user.joinDate}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-400">{user.location}</span>
                </div>
                
                <p className="text-slate-300 max-w-md">{user.bio}</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{user.completedSwaps}</div>
            <p className="text-sm text-slate-400">Completed Swaps</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{user.helpfulAnswers}</div>
            <p className="text-sm text-slate-400">Helpful Answers</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{user.projectsShared}</div>
            <p className="text-sm text-slate-400">Projects Shared</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{user.badges.length}</div>
            <p className="text-sm text-slate-400">Badges Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-200">Specialties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.specialties.map((specialty: string, index: number) => (
                    <Badge key={index} variant="outline" className="border-slate-600">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-200">Current Projects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.currentProjects.map((project: any) => (
                  <div key={project.id} className="p-3 bg-slate-700/30 rounded-lg">
                    <h4 className="font-medium text-slate-200">{project.title}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-slate-400">Progress</span>
                      <span className="text-sm text-slate-300">{project.progress}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="badges" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">Achievement Badges</CardTitle>
              <CardDescription className="text-slate-400">
                Badges earned through contributions and expertise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.badges.map((badge: string, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                    <Award className="h-8 w-8 text-yellow-400" />
                    <div>
                      <h4 className="font-medium text-slate-200">{badge}</h4>
                      <p className="text-sm text-slate-400">Earned recently</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">Project Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">Project details would be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">Recent forum posts and contributions would be shown here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;
