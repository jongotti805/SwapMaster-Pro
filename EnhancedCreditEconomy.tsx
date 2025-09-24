import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface UserStats {
  totalCredits: number;
  level: number;
  experiencePoints: number;
  nextLevelXP: number;
  badges: Badge[];
  leaderboardPosition: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  earnedAt?: string;
}

interface EarningOpportunity {
  id: string;
  type: 'post' | 'comment' | 'guide' | 'review' | 'referral' | 'achievement';
  title: string;
  description: string;
  credits: number;
  xp: number;
  requirements?: string[];
  cooldown?: string;
  completed: boolean;
}

interface Transaction {
  id: string;
  type: 'earned' | 'spent';
  amount: number;
  source: string;
  description: string;
  timestamp: string;
}

const EnhancedCreditEconomy: React.FC = () => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [earningOpportunities, setEarningOpportunities] = useState<EarningOpportunity[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'earn' | 'history' | 'badges'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setIsLoading(true);
    
    try {
      // Get user stats from the real backend
      const { data: statsData, error: statsError } = await supabase.functions.invoke('credit-economy', {
        body: { action: 'get_user_stats' }
      });
      
      if (statsError) {
        console.error('Failed to fetch user stats:', statsError);
        // Use fallback data if the real backend fails
        const fallbackStats = createFallbackData();
        setUserStats(fallbackStats.userStats);
        setEarningOpportunities(fallbackStats.earningOpportunities);
        setTransactions(fallbackStats.transactions);
        return;
      }
      
      if (statsData && statsData.data) {
        const userData = statsData.data;
        setUserStats({
          totalCredits: userData.totalCredits || 0,
          level: userData.level || 1,
          experiencePoints: userData.experiencePoints || 0,
          nextLevelXP: userData.nextLevelXP || 1000,
          leaderboardPosition: userData.leaderboardPosition || 999,
          badges: userData.badges || []
        });
        
        setTransactions(userData.transactions || []);
      } else {
        // Fallback to sample data if no data returned
        const fallbackStats = createFallbackData();
        setUserStats(fallbackStats.userStats);
        setTransactions(fallbackStats.transactions);
      }
      
      // Set earning opportunities (these are static for now)
      setEarningOpportunities([
        {
          id: 'build_thread_post',
          type: 'post',
          title: 'Share a Build Thread',
          description: 'Post photos and progress of your current build project',
          credits: 25,
          xp: 50,
          cooldown: 'Daily',
          completed: false
        },
        {
          id: 'technical_guide',
          type: 'guide',
          title: 'Write a Technical Guide',
          description: 'Create a detailed how-to guide for the community',
          credits: 150,
          xp: 300,
          requirements: ['Must be 500+ words', 'Include photos or diagrams'],
          completed: false
        },
        {
          id: 'helpful_comment',
          type: 'comment',
          title: 'Help Community Members',
          description: 'Leave helpful comments on build threads',
          credits: 5,
          xp: 10,
          cooldown: 'Per comment (max 10/day)',
          completed: false
        },
        {
          id: 'part_review',
          type: 'review',
          title: 'Review Parts & Suppliers',
          description: 'Share your experience with parts and suppliers',
          credits: 30,
          xp: 60,
          requirements: ['Must have purchased the part'],
          completed: false
        },
        {
          id: 'referral_bonus',
          type: 'referral',
          title: 'Invite Friends',
          description: 'Invite friends to join SwapMaster Pro',
          credits: 100,
          xp: 200,
          requirements: ['Friend must complete first swap'],
          completed: false
        }
      ]);
      
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      // Use fallback data on error
      const fallbackStats = createFallbackData();
      setUserStats(fallbackStats.userStats);
      setEarningOpportunities(fallbackStats.earningOpportunities);
      setTransactions(fallbackStats.transactions);
    } finally {
      setIsLoading(false);
    }
  };

  const createFallbackData = () => {
    return {
      userStats: {
        totalCredits: 1247,
        level: 8,
        experiencePoints: 3250,
        nextLevelXP: 4000,
        leaderboardPosition: 23,
        badges: [
          { id: '1', name: 'First Swap', description: 'Completed your first engine swap mockup', icon: '🏁', rarity: 'Common' },
          { id: '2', name: 'Community Helper', description: 'Answered 10 community questions', icon: '🤝', rarity: 'Rare' },
          { id: '3', name: 'Expert Builder', description: 'Created a detailed build guide', icon: '🔧', rarity: 'Epic' },
          { id: '4', name: 'Trend Setter', description: 'Post received 100+ likes', icon: '⭐', rarity: 'Legendary', earnedAt: '2024-07-15' }
        ]
      } as UserStats,
      earningOpportunities: [
        {
          id: 'build_thread_post',
          type: 'post' as const,
          title: 'Share a Build Thread',
          description: 'Post photos and progress of your current build project',
          credits: 25,
          xp: 50,
          cooldown: 'Daily',
          completed: false
        },
        {
          id: 'technical_guide',
          type: 'guide' as const,
          title: 'Write a Technical Guide',
          description: 'Create a detailed how-to guide for the community',
          credits: 150,
          xp: 300,
          requirements: ['Must be 500+ words', 'Include photos or diagrams'],
          completed: false
        }
      ] as EarningOpportunity[],
      transactions: [
        { id: '1', type: 'earned', amount: 25, source: 'Build Thread Post', description: 'Posted "K20 Civic Build Progress"', timestamp: '2024-07-18 14:30' },
        { id: '2', type: 'spent', amount: -50, source: 'AI Mockup', description: 'Generated LS swap mockup', timestamp: '2024-07-18 12:15' }
      ] as Transaction[]
    };
  };

  const getBadgeRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'border-gray-500 bg-gray-700';
      case 'Rare': return 'border-blue-500 bg-blue-900';
      case 'Epic': return 'border-purple-500 bg-purple-900';
      case 'Legendary': return 'border-yellow-500 bg-yellow-900';
      default: return 'border-gray-500 bg-gray-700';
    }
  };

  const getProgressPercentage = () => {
    if (!userStats) return 0;
    return (userStats.experiencePoints / userStats.nextLevelXP) * 100;
  };

  const handleEarnCredits = async (opportunityId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('credit-economy', {
        body: {
          action: 'earn_credits',
          opportunityId: opportunityId
        }
      });
      
      if (error) {
        console.error('Failed to earn credits:', error);
        // Show error message but don't crash
        return;
      }
      
      // Show success message if credits were earned
      if (data && data.data) {
        console.log('Credits earned successfully:', data.data);
        
        // Refresh user data after earning credits
        await fetchUserData();
      }
    } catch (error) {
      console.error('Failed to earn credits:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">Credit Economy</h2>
        <p className="text-gray-400 mb-8">Earn credits and rewards through community participation and engagement.</p>
        
        {/* Stats Overview */}
        {userStats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold">{userStats.totalCredits.toLocaleString()}</div>
              <div className="text-blue-200">Total Credits</div>
            </div>
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold">Level {userStats.level}</div>
              <div className="text-green-200">Current Level</div>
            </div>
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold">{userStats.badges.length}</div>
              <div className="text-purple-200">Badges Earned</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold">#{userStats.leaderboardPosition}</div>
              <div className="text-yellow-200">Leaderboard</div>
            </div>
          </div>
        )}

        {/* Level Progress */}
        {userStats && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold">Level Progress</span>
              <span className="text-sm text-gray-400">
                {userStats.experiencePoints} / {userStats.nextLevelXP} XP
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-gray-800 rounded-lg mb-8">
          <div className="flex">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'earn', label: 'Earn Credits' },
              { key: 'history', label: 'Transaction History' },
              { key: 'badges', label: 'Badges' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 px-6 py-4 font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                } ${tab.key === 'overview' ? 'rounded-l-lg' : ''} ${tab.key === 'badges' ? 'rounded-r-lg' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'earn' && (
          <div className="grid md:grid-cols-2 gap-6">
            {earningOpportunities.map((opportunity) => (
              <div key={opportunity.id} className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{opportunity.title}</h3>
                    <p className="text-gray-400 mb-3">{opportunity.description}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    opportunity.completed ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'
                  }`}>
                    {opportunity.completed ? 'Completed' : 'Available'}
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="flex space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{opportunity.credits}</div>
                      <div className="text-xs text-gray-400">Credits</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{opportunity.xp}</div>
                      <div className="text-xs text-gray-400">XP</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleEarnCredits(opportunity.id)}
                    disabled={opportunity.completed}
                    className={`px-6 py-2 rounded-lg font-medium transition-all ${
                      opportunity.completed
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    {opportunity.completed ? 'Completed' : 'Start'}
                  </button>
                </div>
                
                {opportunity.requirements && (
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-300 mb-1">Requirements:</div>
                    <ul className="text-sm text-gray-400 space-y-1">
                      {opportunity.requirements.map((req, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="mt-1">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {opportunity.cooldown && (
                  <div className="text-sm text-gray-400">
                    Cooldown: {opportunity.cooldown}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-semibold">Transaction History</h3>
            </div>
            <div className="divide-y divide-gray-700">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-6 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-gray-400">{transaction.source} • {transaction.timestamp}</div>
                  </div>
                  <div className={`text-lg font-bold ${
                    transaction.type === 'earned' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {transaction.type === 'earned' ? '+' : ''}{transaction.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'badges' && userStats && (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {userStats.badges.map((badge) => (
              <div key={badge.id} className={`rounded-lg p-6 border-2 ${getBadgeRarityColor(badge.rarity)}`}>
                <div className="text-center">
                  <div className="text-4xl mb-3">{badge.icon}</div>
                  <h3 className="font-semibold mb-2">{badge.name}</h3>
                  <p className="text-sm text-gray-400 mb-3">{badge.description}</p>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    badge.rarity === 'Common' ? 'bg-gray-600 text-gray-300' :
                    badge.rarity === 'Rare' ? 'bg-blue-600 text-blue-300' :
                    badge.rarity === 'Epic' ? 'bg-purple-600 text-purple-300' :
                    'bg-yellow-600 text-yellow-300'
                  }`}>
                    {badge.rarity}
                  </div>
                  {badge.earnedAt && (
                    <div className="text-xs text-gray-500 mt-2">
                      Earned: {badge.earnedAt}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Today's Opportunities</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">75</div>
                  <div className="text-sm text-gray-400">Credits Available</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">150</div>
                  <div className="text-sm text-gray-400">XP Available</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-400">3</div>
                  <div className="text-sm text-gray-400">New Challenges</div>
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center py-2">
                    <div className="text-sm">
                      <span className="text-gray-300">{transaction.description}</span>
                      <span className="text-gray-500 ml-2">{transaction.timestamp}</span>
                    </div>
                    <div className={`text-sm font-medium ${
                      transaction.type === 'earned' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.type === 'earned' ? '+' : ''}{transaction.amount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCreditEconomy;