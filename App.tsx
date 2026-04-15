
import React, { useState, useEffect, useCallback } from 'react';
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
import { WelcomeScreens } from './components/WelcomeScreens';
import { LanguageSelector } from './components/LanguageSelector';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { DataProvider } from './context/DataContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { View } from './types';
import { AIChatBot } from './components/AIChatBot';
import { useNativeInit, useHaptics, useBackButton, useNetworkStatus } from './hooks/useNative';
import { Language } from './translations';

// New Feature Pages
import { CalculatorPage } from './pages/Calculator';
import { SavingsGoals } from './pages/SavingsGoals';
import { Announcements } from './pages/Announcements';
import { Voting } from './pages/Voting';
import { Chat } from './pages/Chat';
import { AuditLog } from './pages/AuditLog';

// Additional Feature Pages
import { Birthdays } from './pages/Birthdays';
import { Performance } from './pages/Performance';
import { Backup } from './pages/Backup';
import { BankVerification } from './pages/BankVerification';
import { MeetingMinutesPage } from './pages/MeetingMinutesPage';
import { GPSAttendance } from './pages/GPSAttendance';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [showLanguageSelector, setShowLanguageSelector] = useState(() => {
    // Check if user has selected a language before
    return !localStorage.getItem('shg_language');
  });
  const [showWelcome, setShowWelcome] = useState(() => {
    // Check if user has seen welcome screens before
    return !localStorage.getItem('shg_welcome_seen');
  });
  
  const { setLanguage } = useLanguage();
  
  const { 
    isAuthenticated, 
    isLocked, 
    showOnboarding,
    user,
    currentUserRole
  } = useAuth();

  // Native mobile initialization
  const { isReady: isNativeReady, isNative } = useNativeInit();
  const { tap } = useHaptics();
  const { isOnline } = useNetworkStatus();

  // Handle Android back button
  const handleBackButton = useCallback(() => {
    if (showLanguageSelector || showWelcome) {
      return true; // Don't exit during onboarding
    }
    if (currentView !== 'dashboard') {
      setCurrentView('dashboard');
      tap('light');
      return true; // Handled
    }
    return false; // Let system handle (exit app)
  }, [currentView, tap, showLanguageSelector, showWelcome]);

  useBackButton(handleBackButton);

  // Load saved language on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('shg_language') as Language;
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, [setLanguage]);

  // Handle language selection
  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setShowLanguageSelector(false);
  };

  // Simulate app initialization/loading
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), isNative ? 1500 : 2000);
    return () => clearTimeout(timer);
  }, [isNative]);

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

  // 0. First time user -> Language Selection (before anything else)
  if (showLanguageSelector) {
    return (
      <LanguageSelector onSelect={handleLanguageSelect} />
    );
  }

  // 1. First time user -> Welcome/Introduction screens
  if (showWelcome) {
    return (
      <WelcomeScreens onComplete={() => setShowWelcome(false)} />
    );
  }

  // 2. Not logged in -> Login Screen
  if (!isAuthenticated) {
    return (
       <>
         <Toaster position="top-center" />
         <LoginScreen />
       </>
    );
  }

  // 3. New User -> Onboarding (includes security setup)
  if (showOnboarding) {
      return (
        <>
          <Toaster position="top-center" />
          <Onboarding />
        </>
      );
  }

  // 4. Returning User Locked -> App Lock (uses device biometric/PIN)
  if (isLocked) {
      return (
          <>
            <Toaster position="top-center" />
            <AppLock />
          </>
      );
  }

  // 4. Main App Dashboard
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
          
          {/* New Feature Pages */}
          {currentView === 'calculator' && <CalculatorPage key="calculator" onBack={() => setCurrentView('dashboard')} />}
          {currentView === 'savings-goals' && <SavingsGoals key="savings-goals" onBack={() => setCurrentView('dashboard')} />}
          {currentView === 'announcements' && <Announcements key="announcements" onBack={() => setCurrentView('dashboard')} />}
          {currentView === 'voting' && <Voting key="voting" onBack={() => setCurrentView('dashboard')} />}
          {currentView === 'chat' && <Chat key="chat" onBack={() => setCurrentView('dashboard')} />}
          {currentView === 'audit-log' && <AuditLog key="audit-log" onBack={() => setCurrentView('settings')} />}
          
          {/* Additional Feature Pages */}
          {currentView === 'birthdays' && <Birthdays key="birthdays" />}
          {currentView === 'performance' && <Performance key="performance" />}
          {currentView === 'backup' && <Backup key="backup" />}
          {currentView === 'bank-verification' && <BankVerification key="bank-verification" />}
          {currentView === 'meeting-minutes' && <MeetingMinutesPage key="meeting-minutes" />}
          {currentView === 'gps-attendance' && <GPSAttendance key="gps-attendance" />}
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
