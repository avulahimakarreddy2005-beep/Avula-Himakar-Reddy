import React, { useState } from 'react';
import { Mail, Shield, ArrowRight, Chrome, Lock, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, googleProvider, signInWithPopup, signInAnonymously, isConfigured } from '../lib/firebase';
import { signIn } from '../lib/auth';
import AdminLogin from './AdminLogin';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onToggleSignup?: () => void;
}

export default function LoginPage({ onLoginSuccess, onToggleSignup }: LoginPageProps) {
  const [showAdminGate, setShowAdminGate] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in email and password.');
      return;
    }

    setLoading('credentials');
    try {
      await signIn(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials.');
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    if (!isConfigured || !auth) {
      alert("Google Sign-In requires a valid Firebase configuration. Switching to guest mode for demo.");
      handleGuestLogin();
      return;
    }
    setLoading('google');
    try {
      await signInWithPopup(auth, googleProvider);
      onLoginSuccess();
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      handleGuestLogin();
    } finally {
      setLoading(null);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading('guest');
    try {
      if (isConfigured && auth) {
        await signInAnonymously(auth);
      } else {
        localStorage.setItem('rs_guest_user', 'true');
      }
      onLoginSuccess();
    } catch (error) {
      console.error('Guest Sign-In Error:', error);
      localStorage.setItem('rs_guest_user', 'true');
      onLoginSuccess();
    } finally {
      setLoading(null);
    }
  };

  if (showAdminGate) {
    return (
      <AdminLogin 
        onLoginSuccess={onLoginSuccess}
        onBackToCitizen={() => setShowAdminGate(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs: Saffron (Top Left) & Indian Green (Bottom Right) */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-saffron/10 rounded-full blur-[130px] -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indian-green/10 rounded-full blur-[130px] translate-x-1/3 translate-y-1/3" />

      {/* Decorative Top Bar representing the Tricolor */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex">
        <div className="flex-1 bg-saffron" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-indian-green" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] z-10"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-xl shadow-saffron/20 border-2 border-saffron relative">
            <Shield className="w-8 h-8 text-saffron" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-indian-green rounded-full border border-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight mb-1 italic font-serif">
            Road<span className="text-saffron">Sense</span> <span className="text-indian-green">AI</span>
          </h1>
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF9933] bg-[#FF9933]/10 px-2 py-0.5 rounded">Saffron</span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded">White</span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#138808] bg-[#138808]/10 px-2 py-0.5 rounded">Indian Green</span>
          </div>
          
          <p className="text-slate-500 text-xs max-w-[280px] mx-auto leading-relaxed">
            AI-powered community infrastructure & civic monitoring for a cleaner, safer, smarter India.
          </p>
        </div>

        <div className="bg-white border border-[#138808]/15 p-6 md:p-8 rounded-[32px] space-y-4 shadow-xl shadow-saffron-glow/10">
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-500/10 border border-red-500/20 text-red-700 rounded-xl text-xs font-semibold text-center"
            >
              {error}
            </motion.div>
          )}

          {/* Native login form */}
          <form onSubmit={handleEmailLogin} className="space-y-3.5 text-left">
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                Citizen / Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@roadsense.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 bg-slate-50/50 border border-slate-200 focus:border-saffron focus:ring-1 focus:ring-saffron rounded-xl text-slate-800 outline-none text-xs font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Enter your security pass..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 bg-slate-50/50 border border-slate-200 focus:border-saffron focus:ring-1 focus:ring-saffron rounded-xl text-slate-800 outline-none text-xs font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={loading === 'credentials'}
                className="w-full h-11 bg-saffron hover:bg-saffron-dark text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-xs shadow-md shadow-saffron-glow cursor-pointer"
              >
                {loading === 'credentials' ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify Credentials</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('admin@roadsense.in');
                  setPassword('123456');
                }}
                className="w-full py-1.5 px-3 bg-saffron-light/30 border border-saffron/25 text-saffron hover:bg-[#FF9933]/20 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer text-saffron"
              >
                Quick Autofill: Demo Admin Space
              </button>
            </div>
          </form>

          {/* Separator line style */}
          <div className="py-2 flex items-center justify-center gap-2">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">or sign in via</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleGoogleLogin}
              disabled={!!loading}
              className="h-12 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 text-[11px] border border-slate-200 cursor-pointer shadow-sm"
            >
              {loading === 'google' ? (
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Chrome className="w-4 h-4 text-blue-600" />
                  <span>Google</span>
                </>
              )}
            </button>

            <button
              onClick={handleGuestLogin}
              disabled={!!loading}
              className="h-12 bg-indian-green hover:bg-indian-green-dark text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 text-[11px] shadow-md shadow-indian-green-glow cursor-pointer"
            >
              {loading === 'guest' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserIcon className="w-4 h-4 text-white" />
                  <span>Guest</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-3 text-center border-t border-slate-100 flex flex-col gap-2">
            {onToggleSignup && (
              <button
                onClick={onToggleSignup}
                className="text-xs text-saffron hover:underline font-bold bg-transparent border-none cursor-pointer"
              >
                New to RoadSense? Create Account
              </button>
            )}
            <button
              onClick={() => setShowAdminGate(true)}
              className="text-xs text-emerald-700 hover:underline font-bold bg-transparent border-none cursor-pointer flex items-center justify-center gap-1.5 mx-auto animate-pulse"
            >
              <Shield className="w-3.5 h-3.5 text-indian-green" />
              <span>Public Official? Switch to Admin Gate</span>
            </button>
          </div>

          <div className="pt-2 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center justify-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-saffron animate-ping" />
              <span>Dedicated to Swachh Bharat & Safe Roads</span>
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-8 text-slate-500">
           <div className="flex flex-col items-center gap-0.5">
             <span className="text-slate-800 font-extrabold text-base leading-none">2.4k+</span>
             <span className="text-[10px] uppercase font-bold tracking-widest text-saffron">Active Citizens</span>
           </div>
           <div className="w-px h-8 bg-slate-200" />
           <div className="flex flex-col items-center gap-0.5">
             <span className="text-slate-800 font-extrabold text-base leading-none">100%</span>
             <span className="text-[10px] uppercase font-bold tracking-widest text-[#138808]">AI Monitored</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
