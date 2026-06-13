import React, { useState } from 'react';
import { Mail, Shield, ShieldCheck, UserCheck, ArrowRight, User, Eye, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { signUp, UserRole } from '../lib/auth';

interface SignupPageProps {
  onSignupSuccess: () => void;
  onToggleLogin: () => void;
}

export default function SignupPage({ onSignupSuccess, onToggleLogin }: SignupPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('citizen');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all standard fields.');
      return;
    }

    if (role === 'admin' && adminCode !== '1947' && adminCode !== '1234') {
      setError('Invalid Admin Security Code. Hint: Use standard Indian Independence Year "1947"');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name, role);
      onSignupSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors">
      {/* Background Saffron & Green Orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-saffron/10 rounded-full blur-[130px] -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indian-green/10 rounded-full blur-[130px] translate-x-1/3 translate-y-1/3" />

      {/* Decorative Top Tricolor Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex z-20">
        <div className="flex-1 bg-saffron" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-indian-green" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] z-10 my-8"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-xl shadow-saffron/20 border-2 border-saffron relative">
            <Shield className="w-8 h-8 text-saffron" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-indian-green rounded-full border border-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-none mb-1 font-serif">
            Join Road<span className="text-saffron">Sense</span> <span className="text-indian-green">India</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">Create your citizen or administrative profile</p>
        </div>

        <div className="bg-white border border-[#138808]/15 p-6 md:p-8 rounded-[32px] space-y-4 shadow-xl shadow-saffron-glow/10">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-700 rounded-xl text-xs font-semibold"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Chetan Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-slate-50/50 border border-slate-200 focus:border-saffron focus:ring-1 focus:ring-saffron rounded-xl text-slate-800 outline-none text-sm font-medium transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. chetan@roadsense.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-slate-50/50 border border-slate-200 focus:border-saffron focus:ring-1 focus:ring-saffron rounded-xl text-slate-800 outline-none text-sm font-medium transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-slate-50/50 border border-slate-200 focus:border-saffron focus:ring-1 focus:ring-saffron rounded-xl text-slate-800 outline-none text-sm font-medium transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Role selection tab */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 ml-1">
                Primary Account Purpose
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('citizen')}
                  className={`py-3.5 px-4 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                    role === 'citizen'
                      ? 'bg-indian-green/10 border-indian-green text-slate-800 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/50'
                  }`}
                >
                  <UserCheck className={`w-5 h-5 ${role === 'citizen' ? 'text-indian-green' : 'text-slate-400'}`} />
                  <span>Citizen (Swachh Bharat)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-3.5 px-4 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                    role === 'admin'
                      ? 'bg-saffron/10 border-saffron text-slate-800 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/50'
                  }`}
                >
                  <ShieldCheck className={`w-5 h-5 ${role === 'admin' ? 'text-saffron' : 'text-slate-400'}`} />
                  <span>Govt / Municipal Admin</span>
                </button>
              </div>
            </div>

            {/* Conditional admin verification code */}
            {role === 'admin' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-2"
              >
                <label className="text-[10px] font-extrabold text-saffron uppercase tracking-widest block mb-1.5 ml-1">
                  Government Security Code REQUIRED
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter '1947' for demo authorization"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="w-full h-12 px-4 bg-saffron/5 border border-saffron/20 focus:border-saffron focus:ring-1 focus:ring-saffron rounded-xl text-slate-800 outline-none text-xs font-bold transition-all placeholder:text-[#FF9933]/40"
                />
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 mt-4 bg-saffron hover:bg-saffron-dark text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 text-sm cursor-pointer shadow-lg shadow-saffron-glow/20 border-b-4 border-saffron-dark"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              onClick={onToggleLogin}
              className="text-xs text-saffron hover:underline font-bold bg-transparent border-none cursor-pointer"
            >
              Already registered? Sign In
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
