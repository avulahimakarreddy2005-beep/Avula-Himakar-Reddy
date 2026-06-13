import React from 'react';
import { Shield, Sparkles, User, Settings, AlertTriangle, CheckSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole } from '../lib/auth';

interface NavbarProps {
  currentRole: UserRole;
  userName: string;
  onSwitchRole: (role: UserRole) => void;
  pendingReportsCount: number;
  solvedReportsCount: number;
}

export default function Navbar({ 
  currentRole, 
  userName, 
  onSwitchRole, 
  pendingReportsCount, 
  solvedReportsCount 
}: NavbarProps) {
  return (
    <div className="w-full bg-white dark:bg-[#FAF9F5] border border-slate-200 dark:border-slate-100 rounded-3xl p-4 md:p-6 mb-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="w-12 h-12 rounded-2xl bg-saffron-light dark:bg-saffron/10 border border-saffron/20 flex items-center justify-center">
          {currentRole === 'admin' ? (
            <Shield className="w-6 h-6 text-saffron" />
          ) : (
            <Sparkles className="w-6 h-6 text-saffron" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              CURRENT CONTEXT
            </span>
            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
              currentRole === 'admin' 
                ? 'bg-saffron text-white dark:bg-saffron' 
                : 'bg-indian-green text-white'
            }`}>
              {currentRole === 'admin' ? 'Administrative Official' : 'Swachh Bharat Citizen'}
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-800 leading-tight">
            Greetings, {userName}
          </h2>
        </div>
      </div>

      {/* Metrics & Role Switcher */}
      <div className="flex flex-wrap items-center gap-4 md:gap-6 w-full md:w-auto justify-end">
        <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-500">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-saffron" />
            <span>{pendingReportsCount} Active Risks</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-300" />
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-indian-green" />
            <span>{solvedReportsCount} Patched</span>
          </div>
        </div>

        {/* Dynamic switcher pill */}
        <div className="bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-slate-100 flex">
          <button
            onClick={() => onSwitchRole('citizen')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              currentRole === 'citizen'
                ? 'bg-indian-green text-white shadow-md shadow-indian-green-glow'
                : 'text-slate-500 dark:text-slate-500 hover:text-slate-800'
            }`}
          >
            Citizen Space
          </button>
          <button
            onClick={() => onSwitchRole('admin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              currentRole === 'admin'
                ? 'bg-saffron text-white shadow-md shadow-saffron-glow'
                : 'text-slate-500 dark:text-slate-500 hover:text-slate-800'
            }`}
          >
            Municipal Panel
          </button>
        </div>
      </div>
    </div>
  );
}
