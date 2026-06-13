import React from 'react';
import { ShieldAlert, RefreshCw, Key } from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole } from '../lib/auth';
import { getAdminSession } from '../lib/authUtils';

interface AuthGuardProps {
  userRole: UserRole;
  allowedRoles: UserRole[];
  children: React.ReactNode;
  onSwitchRole?: (role: UserRole) => void;
}

export default function AuthGuard({ userRole, allowedRoles, children, onSwitchRole }: AuthGuardProps) {
  // Try to read from both the standard prop and stored admin session token for maximum resilience
  const session = getAdminSession();
  const effectiveRole = session?.isAuthenticated && session.role === 'admin' ? 'admin' : userRole;
  const isAuthorized = allowedRoles.includes(effectiveRole);

  if (!isAuthorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#FAF9F5] min-h-[70vh] font-sans">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center max-w-md p-8 bg-white border border-emerald-600/15 rounded-[32px] shadow-xl shadow-saffron-glow/5 relative overflow-hidden"
        >
          {/* Subtle Tricolor bar */}
          <div className="absolute top-0 left-0 right-0 h-1 flex">
            <div className="flex-1 bg-saffron" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-indian-green" />
          </div>

          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100">
            <ShieldAlert className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-800 mb-3 font-sans">Administrative Access Only</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Official staff credentials required. Your active profile role is currently identified as <span className="font-bold text-saffron uppercase">{effectiveRole}</span>. 
            Only verified administrative stakeholders possess clearance to audit complaints or update state records.
          </p>

          <div className="flex flex-col gap-3">
            {onSwitchRole && (
              <button
                onClick={() => onSwitchRole('admin')}
                className="w-full h-12 bg-saffron hover:bg-saffron-dark text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs cursor-pointer shadow-md shadow-saffron-glow border-b-2 border-orange-700"
              >
                <RefreshCw className="w-4 h-4 text-white" />
                <span>Switch to Administrative Official</span>
              </button>
            )}
            <div className="pt-2 flex items-center justify-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <Key className="w-3.5 h-3.5 text-indian-green" />
              <span>RoadSense Govt Credentials</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
