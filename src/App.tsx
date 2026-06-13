import { useState, useEffect, useMemo } from 'react';
import AppLayout from './components/AppLayout';
import Dashboard from './components/Dashboard';
import NotificationCenter from './components/NotificationCenter';
import ReportIssue from './components/ReportIssue';
import ReportsList from './components/ReportsList';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import MapView from './components/MapView';
import Navbar from './components/Navbar';
import AdminPanel from './components/AdminPanel';
import AuthGuard from './components/AuthGuard';
import { Notification, Issue } from './types';
import { auth as firebaseAuth, onAuthStateChanged, User, firebaseSignOut, isConfigured } from './lib/firebase';
import { subscribeToReports, submitReport, updateReport } from './lib/reportService';
import { getSessionUser, logout, AppUser, UserRole } from './lib/auth';
import { logoutAdmin } from './lib/authUtils';

// Shared initial mock issues
const INITIAL_ISSUES: Issue[] = [
  {
    id: '1',
    type: 'pothole',
    severity: 'high',
    status: 'pending',
    location: {
      lat: 51.5237,
      lng: -0.1585,
      address: '221B Baker St, London'
    },
    reporterId: 'user1',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    updatedAt: Date.now() - 1000 * 60 * 60 * 1,
    description: 'Extremely deep and hazardous pothole right in the middle of Baker Street. It is causing significant traffic issues and has already damaged several vehicles tires today. Immediate repair is strongly recommended before nighttime.',
    tags: ['Traffic', 'Safety', 'Urgent'],
    imageUrl: 'https://images.unsplash.com/photo-1599423958933-2a12f5a2cc9a?auto=format&fit=crop&q=80&w=600',
    comments: [
      {
        id: 'c1',
        userId: 'admin',
        userName: 'Maintenance Team',
        text: 'Assigned to Sector 4 repair crew.',
        timestamp: Date.now() - 1000 * 60 * 30
      }
    ]
  },
  {
    id: 'RS-501',
    type: 'drainage',
    severity: 'medium',
    status: 'resolved',
    location: {
      lat: 51.5250,
      lng: -0.1550,
      address: 'Regent\'s Park Rd, London'
    },
    reporterId: 'user2',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    updatedAt: Date.now() - 1000 * 60 * 60 * 5,
    description: 'Debris blockage in the main drainage inlet after the heavy rain.',
    tags: ['Flooding', 'Maintenance'],
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb1930060?auto=format&fit=crop&q=80&w=400',
    comments: []
  }
];

// Mock data for initial professional appearance
const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'Report Verified',
    message: 'Your report #RS-429 (Pothole at Main St) has been verified. 50 RoadSense Coins added.',
    type: 'update',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
    read: false,
    relatedId: '1'
  },
  {
    id: '2',
    title: 'Emergency Drainage Alert',
    message: 'Pre-emptive maintenance scheduled for Sector 4 due to debris buildup detections.',
    type: 'alert',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    read: false,
    relatedId: 'RS-501'
  },
  {
    id: '3',
    title: 'Roadwork Completed',
    message: 'The pothole correction on Baker Street is finished. View the after photo now.',
    type: 'update',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    read: true,
    relatedId: '1'
  }
];

export default function App() {
  const [sessionUser, setSessionUser] = useState<AppUser | null>(() => getSessionUser());
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    const saved = getSessionUser();
    return saved ? saved.role : 'citizen';
  });
  const [isSignup, setIsSignup] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [coins, setCoins] = useState(0);
  const [issues, setIssues] = useState<Issue[]>(INITIAL_ISSUES);
  const [draftLocation, setDraftLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

  // Synchronize custom session user with standard User state
  useEffect(() => {
    if (sessionUser) {
      setUser({
        displayName: sessionUser.displayName,
        email: sessionUser.email,
        uid: sessionUser.uid,
        photoURL: sessionUser.photoURL,
        isAnonymous: false
      } as User);
      setCoins(sessionUser.coins);
      setActiveRole(sessionUser.role);
    }
  }, [sessionUser]);
  
  // Subscribe to real-time reports if Firebase is configured
  useEffect(() => {
    if (!isConfigured) return;

    const unsubscribe = subscribeToReports((updatedIssues) => {
      if (updatedIssues.length > 0) {
        setIssues(prev => {
          const mocks = INITIAL_ISSUES.filter(m => !updatedIssues.some(u => u.id === m.id));
          return [...updatedIssues, ...mocks];
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time authentication state handling
  useEffect(() => {
    if (sessionUser) {
      setIsAuthReady(true);
      return;
    }

    if (!isConfigured || !firebaseAuth) {
      if (localStorage.getItem('rs_guest_user')) {
        setUser({ 
          displayName: 'Guest User', 
          email: 'guest@roadsense.ai',
          uid: 'guest-123',
          isAnonymous: true,
          photoURL: null
        } as User);
        setCoins(50);
      }
      setIsAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Load role of authenticated user
        const localSaved = getSessionUser();
        if (localSaved && localSaved.uid === currentUser.uid) {
          setSessionUser(localSaved);
        } else {
          setSessionUser({
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            role: 'citizen',
            coins: 100
          });
        }
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const timer = setTimeout(() => {
      const newNotif: Notification = {
        id: Math.random().toString(36).substring(2, 9),
        title: 'Community Alert',
        message: 'A new report was filed in your area. Use Caution near Sector 4.',
        type: 'alert',
        timestamp: Date.now(),
        read: false,
      };
      setNotifications(prev => [newNotif, ...prev]);
    }, 15000);

    return () => clearTimeout(timer);
  }, [user]);

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleEarnCoins = (amount: number) => {
    setCoins(prev => {
      const next = prev + amount;
      if (sessionUser) {
        const updated = { ...sessionUser, coins: next };
        setSessionUser(updated);
        localStorage.setItem('roadsense_current_session', JSON.stringify(updated));
      }
      return next;
    });
    
    // Add success notification
    const newNotif: Notification = {
      id: Math.random().toString(36).substring(2, 9),
      title: 'Coins Earned!',
      message: `You earned ${amount} RoadSense coins for your Swachh action.`,
      type: 'update',
      timestamp: Date.now(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleNewIssue = async (newIssue: Issue) => {
    setIssues(prev => [newIssue, ...prev]);
    handleEarnCoins(50);

    if (isConfigured) {
      const { id, createdAt, updatedAt, ...issueData } = newIssue;
      await submitReport(issueData);
    }
  };

  const handleSignOut = async () => {
    try {
      if (isConfigured && firebaseAuth) {
        await firebaseSignOut(firebaseAuth);
      }
      localStorage.removeItem('rs_guest_user');
      logout();
      logoutAdmin();
      setSessionUser(null);
      setUser(null);
      setActiveRole('citizen');
    } catch (error) {
      console.error('Sign-out error:', error);
      logout();
      logoutAdmin();
      setSessionUser(null);
      setUser(null);
      setActiveRole('citizen');
      window.location.reload();
    }
  };

  const handleNavigateToRecord = (id: string) => {
    setSelectedRecordId(id);
    setActiveTab('records');
  };

  const handleUpdateIssue = async (updatedIssue: Issue) => {
    setIssues(prev => prev.map(i => i.id === updatedIssue.id ? updatedIssue : i));

    if (isConfigured) {
      await updateReport(updatedIssue.id, updatedIssue);
    }
  };

  const handleSwitchActiveRole = (targetRole: UserRole) => {
    setActiveRole(targetRole);
  };

  const renderContent = () => {
    if (activeRole === 'admin') {
      return (
        <AuthGuard
          userRole={sessionUser?.role || 'citizen'}
          allowedRoles={['admin']}
          onSwitchRole={handleSwitchActiveRole}
        >
          <AdminPanel 
            issues={issues}
            onUpdateIssue={handleUpdateIssue}
            currentUser={sessionUser}
            onAwardCoins={handleEarnCoins}
          />
        </AuthGuard>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            coins={coins} 
            userName={user?.displayName || undefined} 
            onViewDetail={handleNavigateToRecord} 
          />
        );
      case 'notifications':
        return (
          <NotificationCenter 
            notifications={notifications} 
            onMarkRead={handleMarkRead}
            onClearAll={handleClearAll}
            onNavigateToRecord={handleNavigateToRecord}
          />
        );
      case 'report':
        return (
          <ReportIssue 
            onReportSubmitted={handleNewIssue} 
            user={user} 
            draftLocation={draftLocation}
            onClearDraft={() => setDraftLocation(null)}
          />
        );
      case 'records':
        return (
          <ReportsList 
            issues={issues}
            initialReportId={selectedRecordId} 
            onClearActiveId={() => setSelectedRecordId(null)} 
            onUpdateIssue={handleUpdateIssue}
            user={user}
          />
        );
      case 'map':
        return (
          <MapView 
            issues={issues} 
            onViewDetail={handleNavigateToRecord} 
            onInitiateReport={(draft) => {
              setDraftLocation(draft);
              setActiveTab('report');
            }}
          />
        );
      case 'rewards':
        return (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-gradient-to-br from-saffron to-indian-green rounded-[32px] p-10 text-white shadow-xl shadow-saffron-glow">
              <h2 className="text-3xl font-bold mb-2 font-serif">Swachh Rewards Portal</h2>
              <p className="text-white/80 mb-8 max-w-md">Redeem your hard-earned coins for local civic discounts & national transport credits.</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black">{coins.toLocaleString()}</span>
                <span className="text-sm font-bold uppercase tracking-widest text-[#eff1fc]">Available Coins</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Metro SMART Pass', cost: 500, detail: '₹100 DMRC Metro Travel Voucher', img: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?auto=format&fit=crop&q=80&w=400' },
                { title: 'Chai & Snacks Combo', cost: 250, detail: 'Complimentary tea at verified local vendors', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400' },
                { title: 'Municipal Parking Toll', cost: 1000, detail: 'Free 24h civic garage pass', img: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=400' },
              ].map((reward, i) => (
                <div key={i} className="data-card overflow-hidden group">
                  <div className="h-40 overflow-hidden">
                    <img src={reward.img} alt={reward.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800 dark:text-white">{reward.title}</h3>
                      <span className="text-xs font-black text-indian-green bg-indian-green/10 px-2 py-1 rounded-lg">{reward.cost} pts</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">{reward.detail}</p>
                    <button 
                      disabled={coins < reward.cost}
                      className="w-full py-3 bg-slate-900 dark:bg-white/5 dark:hover:bg-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-30 disabled:grayscale cursor-pointer"
                    >
                      Redeem Reward
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center py-40">
            <h2 className="text-2xl font-bold text-slate-800">Coming Soon</h2>
            <p className="text-slate-500">We're working on this feature.</p>
          </div>
        );
    }
  };

  if (!isAuthReady) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-saffron border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && !localStorage.getItem('rs_guest_user')) {
    if (isSignup) {
      return (
        <SignupPage 
          onSignupSuccess={() => {
            setSessionUser(getSessionUser());
            setIsSignup(false);
          }}
          onToggleLogin={() => setIsSignup(false)}
        />
      );
    }
    return (
      <LoginPage 
        onLoginSuccess={() => {
          setSessionUser(getSessionUser());
          window.location.reload();
        }} 
        onToggleSignup={() => setIsSignup(true)} 
      />
    );
  }

  return (
    <AppLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      notifications={notifications}
      coins={coins}
      user={user}
      onSignOut={handleSignOut}
    >
      <Navbar 
        currentRole={activeRole}
        userName={user?.displayName || 'Swachh Citizen'}
        onSwitchRole={handleSwitchActiveRole}
        pendingReportsCount={issues.filter(i => i.status === 'pending').length}
        solvedReportsCount={issues.filter(i => i.status === 'resolved').length}
      />
      {renderContent()}
    </AppLayout>
  );
}

