import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Camera, 
  Bell, 
  Coins, 
  Settings, 
  LogOut,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Notification } from '../types';
import { User } from '../lib/firebase';
import DarkModeToggle from './DarkModeToggle';

export default function AppLayout({ children, activeTab, onTabChange, notifications, coins, user, onSignOut }: { 
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  notifications: Notification[];
  coins: number;
  user: User | null;
  onSignOut: () => void;
}) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const menuItems = [
    { id: 'dashboard', label: 'Monitor', icon: LayoutDashboard },
    { id: 'map', label: 'Local Map', icon: MapPin },
    { id: 'report', label: 'Report Issue', icon: Camera },
    { id: 'records', label: 'Records', icon: ClipboardList },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
    { id: 'rewards', label: 'Rewards', icon: Coins },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 md:flex-row">
      {/* Sidebar - Desktop Only with Beautiful Light Indian Flag Style */}
      <aside className="w-64 bg-white text-slate-800 flex flex-col items-center py-8 hidden md:flex border-r border-[#138808]/15 relative">
        {/* Subtle Patriotic Tricolor Stripe inside Sidebar */}
        <div className="absolute top-0 bottom-0 left-0 w-1.5 flex flex-col">
          <div className="flex-1 bg-saffron" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-indian-green" />
        </div>

        <div className="flex items-center gap-2 mb-12 px-6 w-full">
           <div className="w-8 h-8 rounded-lg bg-saffron-light flex items-center justify-center border border-saffron">
              <MapPin className="w-5 h-5 text-saffron" />
           </div>
           <span className="font-bold text-xl tracking-tight text-slate-800 font-serif">
             Road<span className="text-saffron">Sense</span><span className="text-indian-green">.in</span>
           </span>
         </div>

        <nav className="flex-1 w-full px-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium relative",
                activeTab === item.id 
                  ? "bg-saffron-light text-saffron font-bold border-l-2 border-saffron" 
                  : "text-slate-600 hover:bg-[#138808]/5 hover:text-indian-green"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                activeTab === item.id ? "text-saffron" : "text-slate-400 group-hover:text-indian-green"
              )} />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto bg-saffron text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-2 ring-white">
                  {item.badge}
                </span>
              )}
              {activeTab === item.id && (
                <motion.div 
                  layoutId="active-nav-indicator"
                  className="absolute right-0 w-1 h-6 bg-indian-green rounded-l-full"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="mt-8 px-4 w-full">
          <div className="bg-saffron-light rounded-2xl p-4 border border-saffron/15 shadow-sm shadow-saffron-glow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-saffron/10 rounded-lg border border-saffron/20">
                <Coins className="w-4 h-4 text-saffron" />
              </div>
              <span className="text-[10px] font-bold text-saffron uppercase tracking-wider">Citizen Rewards</span>
            </div>
            <div className="text-xl font-black flex items-baseline gap-1 text-slate-800">
              {coins.toLocaleString()}
              <span className="text-[10px] text-indian-green uppercase font-extrabold ml-1">Coins</span>
            </div>
          </div>
        </div>

         <div className="mt-auto px-4 w-full space-y-1">
            <button 
              onClick={onSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-600 hover:bg-red-500/5 hover:text-red-500 text-sm font-medium cursor-pointer"
            >
             <LogOut className="w-5 h-5 text-saffron" />
             <span>Sign Out</span>
           </button>
         </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-3 md:hidden">
             <div className="w-8 h-8 bg-saffron-light rounded-lg flex items-center justify-center border border-saffron">
                <MapPin className="w-5 h-5 text-saffron" />
              </div>
              <span className="font-bold text-base text-slate-800">
                Road<span className="text-saffron">Sense</span><span className="text-indian-green">.in</span>
              </span>
          </div>

          <div className="hidden md:block">
            <h1 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-saffron border border-white animate-pulse" />
              {menuItems.find(m => m.id === activeTab)?.label || 'Overview'}
            </h1>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <DarkModeToggle />
            
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-indian-green-light rounded-xl border border-[#138808]/10">
               <div className="w-2 h-2 rounded-full bg-indian-green animate-pulse" />
               <span className="text-xs font-semibold text-indian-green">Live Swachh Feed</span>
            </div>
            
            <div className="flex items-center gap-3 md:gap-4">
               <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800">{user?.displayName || 'Guest Citizen'}</div>
                  <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none">
                    {user?.isAnonymous ? 'Guest User' : 'Verified Profile'}
                  </div>
               </div>
               
               <button 
                 onClick={onSignOut}
                 className="relative group flex items-center gap-2"
               >
                 <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-100 border-2 border-saffron overflow-hidden ring-2 ring-[#138808]/20 group-hover:ring-saffron/35 transition-all">
                    <img 
                      src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'guest'}`} 
                      alt="avatar" 
                      className="w-full h-full" 
                    />
                 </div>
               </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 grid-bg relative pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation with Tricolor elements */}
        <nav className="md:hidden flex h-20 bg-white border-t-2 border-saffron/20 px-4 items-center justify-around fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl shadow-[0_-10px_25px_-10px_rgba(255,153,51,0.15)]">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl relative transition-all",
                activeTab === item.id ? "text-saffron font-bold scale-105" : "text-slate-400"
              )}
            >
              <div className={cn(
                "w-6 h-6 flex items-center justify-center relative",
                activeTab === item.id && "scale-110 text-saffron"
              )}>
                <item.icon className="w-6 h-6" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-saffron text-white text-[9px] font-bold min-w-[14px] h-[14px] flex items-center justify-center rounded-full ring-2 ring-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold tracking-tight">{item.label.split(' ')[0]}</span>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="mobile-nav-indicator"
                  className="absolute -top-1 w-2.5 h-0.5 bg-indian-green rounded-full"
                />
              )}
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}
