import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { CreditProvider } from '@/contexts/CreditContext';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Dashboard from '@/components/pages/Dashboard';
import SwapGuides from '@/components/pages/SwapGuides';
import SwapGuideDetail from '@/components/pages/SwapGuideDetail';
import DynamicSwapGuide from '@/components/pages/DynamicSwapGuide';
import AIDesignStudio from '@/components/pages/AIDesignStudio';
import ModelViewer3D from '@/components/pages/ModelViewer3D';
import PartsInventory from '@/components/pages/PartsInventory';
import OBDDiagnostics from '@/components/pages/OBDDiagnostics';
import ProgressTracker from '@/components/pages/ProgressTracker';
import Forum from '@/components/pages/Forum';
import ForumPost from '@/components/pages/ForumPost';
import UserProfile from '@/components/pages/UserProfile';
import PartsMarketplace from '@/components/pages/PartsMarketplace';
import ChatPage from '@/components/pages/ChatPage';
import ChatSidebar from '@/components/features/ChatSidebar';
import AIRecommendations from '@/components/features/AIRecommendations';
import BuildThreads from '@/components/pages/BuildThreads';
import ARVisualization from '@/components/pages/ARVisualization';
import SupplierDashboard from '@/components/pages/SupplierDashboard';
import ProfessionalDashboard from '@/components/pages/ProfessionalDashboard';
import AICompatibilityCheck from '@/components/features/AICompatibilityCheck';
import EnhancedCreditEconomy from '@/components/features/EnhancedCreditEconomy';
import SupplierSubscription from '@/components/features/SupplierSubscription';
import ProfessionalSubscription from '@/components/features/ProfessionalSubscription';
import Login from '@/components/pages/Login';
import { useState } from 'react';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <CreditProvider>
          <Router>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Header 
              onMenuClick={() => setSidebarOpen(!sidebarOpen)}
              sidebarOpen={sidebarOpen}
              onChatClick={() => setChatOpen(!chatOpen)}
              chatOpen={chatOpen}
            />
            
            <div className="flex h-[calc(100vh-4rem)]">
              <Sidebar 
                isOpen={sidebarOpen} 
                onClose={() => setSidebarOpen(false)}
              />
              
              <main className={`flex-1 overflow-y-auto transition-all duration-300 ${
                sidebarOpen ? 'lg:ml-64' : 'ml-0'
              }`}>
                <div className="container mx-auto px-4 py-6">
                  <Routes>
                    <Route path="/" element={<AICompatibilityCheck />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/swap-guides" element={<SwapGuides />} />
                    <Route path="/swap-guides/:id" element={<SwapGuideDetail />} />
                    <Route path="/dynamic-swap-guide" element={<DynamicSwapGuide />} />
                    <Route path="/ai-studio" element={<AIDesignStudio />} />
                    <Route path="/3d-viewer" element={<ModelViewer3D />} />
                    <Route path="/parts-inventory" element={<PartsInventory />} />
                    <Route path="/obd-diagnostics" element={<OBDDiagnostics />} />
                    <Route path="/progress-tracker" element={<ProgressTracker />} />
                    <Route path="/forum" element={<Forum />} />
                    <Route path="/forum/:id" element={<ForumPost />} />
                    <Route path="/profile/:id" element={<UserProfile />} />
                    <Route path="/parts-marketplace" element={<PartsMarketplace />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/ai-recommendations" element={<AIRecommendations />} />
                    <Route path="/build-threads" element={<BuildThreads />} />
                    <Route path="/ar-visualization" element={<ARVisualization />} />
                    <Route path="/supplier-verification" element={<SupplierDashboard />} />
                    <Route path="/professional-mode" element={<ProfessionalDashboard />} />
                    <Route path="/compatibility-check" element={<AICompatibilityCheck />} />
                    <Route path="/credit-economy" element={<EnhancedCreditEconomy />} />
                    <Route path="/supplier-subscription" element={<SupplierSubscription />} />
                    <Route path="/professional-subscription" element={<ProfessionalSubscription />} />
                    <Route path="/login" element={<Login />} />
                  </Routes>
                </div>
              </main>
            </div>
            
            <ChatSidebar isOpen={chatOpen} onClose={() => setChatOpen(false)} />
            <Toaster />
          </div>
        </Router>
        </CreditProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
