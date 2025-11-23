
import React, { useState, useEffect } from 'react';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { MemberProfile } from './pages/MemberProfile';
import { Transactions } from './pages/Transactions';
import { Meetings } from './pages/Meetings';
import { Analytics } from './pages/Analytics';
import { Loans } from './pages/Loans';
import { Settings } from './pages/Settings';
import { Reports } from './pages/Reports';
import { TransactPage } from './pages/TransactPage';
import { AppLock } from './components/AppLock';
import { LoginScreen } from './components/LoginScreen';
import { Onboarding } from './components/Onboarding';
import { PinSetup } from './components/PinSetup';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { DataProvider } from './context/DataContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { View } from './types';
import { AIChatBot } from './components/AIChatBot';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  
  const { 
    isAuthenticated, 
    isLocked, 
    showOnboarding, 
    showPinSetup,
    user,
    currentUserRole
  } = useAuth();

  // Simulate app initialization/loading
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleMemberSelect = (id: string) => {
    setSelectedMemberId(id);
    setCurrentView('profile');
  };

  // --- ROUTING LOGIC ---

  if (showSplash) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-background z-0" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="z-10 flex flex-col items-center"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-900/50 mb-8">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">SHG Connect</h1>
          <p className="text-blue-200/70 text-sm font-medium tracking-wide uppercase">Empowering SHGs</p>
        </motion.div>
      </div>
    );
  }

  // 1. Not logged in -> Login Screen
  if (!isAuthenticated) {
    return (
       <>
         <Toaster position="top-center" />
         <LoginScreen />
       </>
    );
  }

  // 2. New User -> Onboarding
  if (showOnboarding) {
      return <Onboarding />;
  }

  // 3. Setup Security -> PIN
  if (showPinSetup) {
      return (
          <>
            <Toaster position="top-center" />
            <PinSetup />
          </>
      );
  }

  // 4. Returning User Locked -> App Lock
  if (isLocked) {
      return (
          <>
            <Toaster position="top-center" />
            <AppLock />
          </>
      );
  }

  // 5. Main App Dashboard
  return (
    <div className="min-h-screen bg-background text-white pb-24 relative selection:bg-purple-500/30 font-sans">
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#1C1C1E',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
        },
      }}/>

      <main className="w-full max-w-md md:max-w-4xl lg:max-w-7xl mx-auto min-h-screen relative">
        {/* Header Gradient Orb */}
        <div className="fixed top-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="fixed top-[20%] right-[-10%] w-[350px] h-[350px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none z-0" />

        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && <Dashboard key="dashboard" onChangeView={setCurrentView} />}
          
          {currentView === 'members' && <Members key="members" onSelectMember={handleMemberSelect} />}
          
          {currentView === 'profile' && selectedMemberId && (
            <MemberProfile 
              key="profile" 
              memberId={selectedMemberId} 
              onBack={() => setCurrentView('members')} 
            />
          )}
          
          {currentView === 'transactions' && <Transactions key="transactions" />}
          {currentView === 'transact' && <TransactPage key="transact" />}
          {currentView === 'reports' && <Reports key="reports" />}
          {currentView === 'meetings' && <Meetings key="meetings" />}
          {currentView === 'analytics' && <Analytics key="analytics" />}
          {currentView === 'loans' && <Loans key="loans" />}
          {currentView === 'settings' && <Settings key="settings" onBack={() => setCurrentView('dashboard')} />}
        </AnimatePresence>
      </main>

      {currentView !== 'settings' && (
        <BottomNav currentView={currentView === 'profile' ? 'members' : currentView} onChangeView={setCurrentView} />
      )}

      {/* AI Chat Bot */}
      <AIChatBot />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
