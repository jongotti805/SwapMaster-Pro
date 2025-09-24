import React, { useState } from 'react';
import { Menu, Bell, Search, User, Settings, Moon, Sun, MessageCircle, LogOut, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CreditBalanceDisplay from '@/components/features/CreditBalanceDisplay';
import CreditPurchase from '@/components/features/CreditPurchase';

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
  onChatClick: () => void;
  chatOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, sidebarOpen, onChatClick, chatOpen }) => {
  const { theme, setTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SM</span>
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                SwapMaster Pro
              </h1>
              <p className="text-xs text-slate-400">Advanced Engine Swap Platform</p>
            </div>
          </Link>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              type="search"
              placeholder="Search guides, parts, forums..."
              className="pl-10 bg-slate-800/50 border-slate-600 text-slate-200 placeholder-slate-400 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Credit Balance (for authenticated users) */}
          {user && (
            <div className="hidden md:block">
              <CreditBalanceDisplay variant="compact" />
            </div>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Chat Button */}
          <Button
            variant={chatOpen ? "default" : "ghost"}
            size="sm"
            onClick={onChatClick}
            className={`text-slate-300 hover:text-white hover:bg-slate-800 relative ${
              chatOpen ? 'bg-blue-600 text-white' : ''
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 px-1 py-0 text-xs bg-red-500 hover:bg-red-500">
              2
            </Badge>
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white hover:bg-slate-800 relative"
          >
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 px-1 py-0 text-xs bg-red-500 hover:bg-red-500">
              3
            </Badge>
          </Button>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs">
                        {user?.user_metadata?.is_guest ? 'G' : (profile?.display_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase())}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm">
                      {user?.user_metadata?.is_guest ? 'Guest User' : (profile?.display_name || user.email?.split('@')[0])}
                    </span>
                    {profile?.is_online && !user?.user_metadata?.is_guest && (
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                <DropdownMenuLabel className="text-slate-200">
                  <div>
                    <p className="font-medium">{user?.user_metadata?.is_guest ? 'Guest User' : (profile?.display_name || 'User')}</p>
                    <p className="text-xs text-slate-400">{user?.user_metadata?.is_guest ? 'Temporary Account' : user.email}</p>
                    {profile?.level && !user?.user_metadata?.is_guest && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {profile.level}
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-700" />
                {user?.user_metadata?.is_guest ? (
                  <>
                    <DropdownMenuItem 
                      className="text-green-300 hover:text-white hover:bg-green-700"
                      onClick={() => navigate('/login?convert=true')}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Create Account</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-700" />
                  </>
                ) : (
                  <>
                    <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                      <User className="mr-2 h-4 w-4" />
                      <Link to={`/profile/${profile?.id || user.id}`}>Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-700" />
                  </>
                )}
                <DropdownMenuItem 
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{user?.user_metadata?.is_guest ? 'Start Fresh' : 'Log out'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
              size="sm"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
      </div>
      
      {/* Credit Purchase Modal */}
      <CreditPurchase 
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </header>
  );
};

export default Header;
