import React, { useState } from 'react';
import { Shield, Key, Mail, ArrowRight, UserCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { signIn } from '../lib/auth';
import { saveAdminSession } from '../lib/authUtils';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToCitizen?: () => void;
}

export default function AdminLogin({ onLoginSuccess, onBackToCitizen }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Field touch states for interactive visual validation
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Administrative Email is required to query credentials.');
      return;
    }
    if (!password) {
      setError('Security Passcode/Certificate is required to verify clearance.');
      return;
    }

    setLoading(true);
    try {
      // Handle both demo passwords seamlessly (original '123456' & specific prompt requested 'Admin1947')
      const targetPassword = password.trim() === 'Admin1947' ? '123456' : password;
      const appUser = await signIn(email.trim(), targetPassword);
      
      if (appUser.role !== 'admin') {
        throw new Error('Authorized Access Revoked: This profile does not possess Municipal Administrative clearance. Citizen access denied.');
      }

      // Success phase
      saveAdminSession(appUser);
      setSuccess(true);
      
      // Simulate real verification check lag for cinematic experience
      setTimeout(() => {
        onLoginSuccess();
      }, 800);
      
    } catch (err: any) {
      setError(err?.message || 'Access Denied: Invalid security credentials or municipal block.');
    } finally {
      if (!success) {
        setLoading(false);
      }
    }
  };

  const triggerAutofill = () => {
    setError('');
    setEmail('admin@roadsense.in');
    setPassword('Admin1947');
    setEmailTouched(true);
    setPasswordTouched(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Dynamic Saffron Glassmorphic Orb */}
      <div className="absolute top-[-100px] left-[-100px] w-[450px] h-[450px] bg-[#FF9933]/8 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Dynamic Green Glassmorphic Orb */}
      <div className="absolute bottom-[-100px] right-[-100px] w-[450px] h-[450px] bg-[#138808]/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Decorative Top Tricolor Band */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex z-35">
        <div className="flex-1 bg-saffron" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-indian-green" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[440px] z-20"
        id="admin_portal_container"
      >
        {/* Portal Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl mb-5 shadow-lg shadow-saffron/10 border border-saffron/20 relative">
            <div className="absolute top-0 bottom-0 left-1.5 w-1 flex flex-col py-1 rounded">
              <div className="bg-saffron h-1/3" />
              <div className="bg-slate-200 h-1/3" />
              <div className="bg-indian-green h-1/3" />
            </div>
            <Shield className="w-10 h-10 text-saffron" />
            <div className="absolute -bottom-1 -right-1 bg-indian-green text-white p-1 rounded-full border border-white shadow">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-slate-800 tracking-tight font-sans leading-none">
            Road<span className="text-saffron">Sense</span> <span className="text-indian-green">Govt</span>
          </h2>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2 bg-saffron-light/50 px-3.5 py-1.5 rounded-full inline-block border border-saffron/15">
            Institutional Security Portal
          </p>
          <p className="text-xs text-slate-500 mt-3 max-w-[320px] mx-auto leading-relaxed">
            Restricted zone for State Road Authorities, PWD Engineers, and Municipal Inspectors of Swachh Bharat.
          </p>
        </div>

        {/* Credentials Card */}
        <div className="bg-white border border-emerald-600/15 rounded-[32px] p-8 space-y-6 shadow-[0_12px_40px_rgba(0,0,0,0.03)] shadow-saffron-glow/10 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-saffron via-white to-indian-green" />

          {/* Validation Errors & Success Flags */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-200/60 rounded-2xl flex items-start gap-2.5"
            >
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-red-800">Clearance Verification Failed</h4>
                <p className="text-[11px] text-red-700 font-medium leading-relaxed">{error}</p>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-50 border border-emerald-200/60 rounded-2xl flex items-start gap-2.5"
            >
              <div className="w-5 h-5 bg-emerald-500 rounded-full text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">✓</div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-emerald-800">Verification Cleared</h4>
                <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">Cryptographic token initialized. Redirecting to administrative space...</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleAdminSignIn} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block ml-1">
                Administrative Email
              </label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors duration-250 ${
                  emailTouched ? (email ? 'text-saffron' : 'text-red-400') : 'text-slate-400'
                }`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  required
                  placeholder="admin@roadsense.in"
                  className={`w-full h-12 pl-12 pr-4 bg-slate-50/50 border rounded-xl text-slate-800 outline-none text-xs font-medium transition-all ${
                    emailTouched 
                      ? (email ? 'border-saffron focus:ring-1 focus:ring-saffron' : 'border-red-300 focus:ring-1 focus:ring-red-400') 
                      : 'border-slate-200 focus:border-saffron focus:ring-1 focus:ring-saffron'
                  }`}
                />
              </div>
            </div>

            {/* Passcode Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block ml-1">
                Security Passcode
              </label>
              <div className="relative">
                <Key className={`absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors duration-250 ${
                  passwordTouched ? (password ? 'text-indian-green' : 'text-red-400') : 'text-slate-400'
                }`} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  required
                  placeholder="••••••••••••"
                  className={`w-full h-12 pl-12 pr-4 bg-slate-50/50 border rounded-xl text-slate-800 outline-none text-xs font-semibold tracking-wide transition-all ${
                    passwordTouched 
                      ? (password ? 'border-indian-green focus:ring-1 focus:ring-indian-green' : 'border-red-300 focus:ring-1 focus:ring-red-400') 
                      : 'border-slate-200 focus:border-indian-green focus:ring-1 focus:ring-indian-green'
                  }`}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-13 bg-indian-green hover:bg-indian-green-dark text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 text-xs shadow-lg shadow-indian-green-glow disabled:opacity-50 cursor-pointer border-b-4 border-emerald-800"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Decrypt Administrative Access</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={triggerAutofill}
                className="w-full h-11 bg-saffron/10 border border-saffron/25 text-saffron hover:bg-saffron/15 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all text-center cursor-pointer shadow-sm shadow-saffron-glow/5"
              >
                Demo Admin Quick-Access
              </button>
            </div>
          </form>

          {onBackToCitizen && (
            <div className="pt-4 text-center border-t border-slate-100 flex justify-center">
              <button
                onClick={onBackToCitizen}
                className="text-xs text-slate-500 hover:text-slate-800 transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1 font-bold"
              >
                ← Return to Swachh Citizen Login
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-slate-400 text-[10px] font-medium flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indian-green" />
          <span>Government of India – Ministry of Housing and Urban Affairs</span>
        </div>
      </motion.div>
    </div>
  );
}
