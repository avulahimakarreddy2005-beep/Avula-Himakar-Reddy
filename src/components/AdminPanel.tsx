import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  MessageSquare, 
  ChevronRight, 
  Check, 
  Coins, 
  TrendingUp, 
  User,
  ArrowRight,
  ClipboardList,
  Sparkles,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Issue, Comment } from '../types';
import { AppUser } from '../lib/auth';
import { cn } from '../lib/utils';

interface AdminPanelProps {
  issues: Issue[];
  onUpdateIssue: (updated: Issue) => Promise<void>;
  currentUser: AppUser | null;
  onAwardCoins: (amount: number) => void;
}

export default function AdminPanel({ issues, onUpdateIssue, currentUser, onAwardCoins }: AdminPanelProps) {
  const [filterType, setFilterType] = useState<'all' | 'pothole' | 'drainage' | 'waste' | 'hazard'>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in-progress' | 'resolved'>('all');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(issues[0]?.id || null);
  const [officialNote, setOfficialNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const selectedIssue = useMemo(() => {
    return issues.find(i => i.id === selectedIssueId) || issues[0] || null;
  }, [issues, selectedIssueId]);

  const filteredIssues = useMemo(() => {
    return issues.filter(i => {
      const matchType = filterType === 'all' || i.type === filterType;
      const matchSeverity = filterSeverity === 'all' || i.severity === filterSeverity;
      const matchStatus = filterStatus === 'all' || i.status === filterStatus;
      const matchSearch = !searchQuery || 
        i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchType && matchSeverity && matchStatus && matchSearch;
    });
  }, [issues, filterType, filterSeverity, filterStatus, searchQuery]);

  const handleUpdateStatus = async (issueId: string, newStatus: 'pending' | 'in-progress' | 'resolved') => {
    setLoading('status');
    const target = issues.find(i => i.id === issueId);
    if (!target) return;

    const updated: Issue = {
      ...target,
      status: newStatus,
      updatedAt: Date.now(),
      comments: [
        ...target.comments,
        {
          id: `note-${Math.random().toString(36).substring(2, 9)}`,
          userId: currentUser?.uid || 'admin-demo',
          userName: currentUser?.displayName || 'Municipal Inspector',
          text: `Status officially updated to [${newStatus.toUpperCase()}] by Municipal Control Room.`,
          timestamp: Date.now()
        }
      ]
    };

    try {
      await onUpdateIssue(updated);
      
      // If resolving, award bonus coins to the reporter
      if (newStatus === 'resolved') {
        onAwardCoins(100);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleAddOfficialComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officialNote.trim() || !selectedIssue) return;

    setLoading('comment');
    const newComment: Comment = {
      id: `govt-${Math.random().toString(36).substring(2, 9)}`,
      userId: currentUser?.uid || 'admin-1',
      userName: currentUser?.displayName || 'Municipal Inspector',
      text: `[OFFICIAL RESPONSE]: ${officialNote}`,
      timestamp: Date.now()
    };

    const updated: Issue = {
      ...selectedIssue,
      comments: [...selectedIssue.comments, newComment],
      updatedAt: Date.now()
    };

    try {
      await onUpdateIssue(updated);
      setOfficialNote('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  // Calculate admin breakdown metrics
  const stats = useMemo(() => {
    const total = issues.length;
    const pending = issues.filter(i => i.status === 'pending').length;
    const working = issues.filter(i => i.status === 'in-progress').length;
    const resolved = issues.filter(i => i.status === 'resolved').length;
    return { total, pending, working, resolved };
  }, [issues]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 transition-colors">
      
      {/* Saffron and Green Admin Header Banner */}
      <div className="bg-gradient-to-r from-ashoka-blue to-ashoka-blue-dark p-6 rounded-[24px] md:rounded-[32px] border-b-4 border-indian-green text-white shadow-xl relative overflow-hidden">
        {/* Decorative Wheel in Backdrop */}
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-white/5 rounded-l-full translate-x-12 p-12 flex items-center justify-center opacity-40">
          <div className="w-32 h-32 border-4 border-dashed border-white/20 rounded-full animate-spin" style={{ animationDuration: '30s' }} />
        </div>

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-extrabold bg-saffron text-ashoka-blue px-2.5 py-0.5 rounded-full tracking-wider shadow">
              Government Portal
            </span>
            <span className="text-[10px] uppercase font-extrabold bg-[#138808]/20 text-[#138808] border border-[#138808]/30 px-2.5 py-0.5 rounded-full tracking-wider">
              Control Center
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif">
            Municipal Infrastructure Console
          </h1>
          <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
            Verify community report streams, deploy repair works, and allocate Swachh reward coins to verified citizens instantly with AI-assisted priority auditing.
          </p>
        </div>
      </div>

      {/* Grid of Micro stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Unresolved Risks', value: stats.pending, color: 'text-saffron', bg: 'bg-saffron-light dark:bg-saffron/10 border-saffron/20' },
          { label: 'Repairing In-Progress', value: stats.working, color: 'text-ashoka-blue dark:text-saffron', bg: 'bg-ashoka-blue-light dark:bg-white/5 border-ashoka-blue/20 dark:border-white/10' },
          { label: 'Patched / Cleaned', value: stats.resolved, color: 'text-indian-green', bg: 'bg-indian-green-light dark:bg-indian-green/10 border-indian-green/10' },
          { label: 'Citizen Satisfaction', value: '98.2%', color: 'text-emerald-500', bg: 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-500/10' }
        ].map((item, idx) => (
          <div key={idx} className={cn("p-5 rounded-2xl border flex items-center justify-between", item.bg)}>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {item.label}
              </span>
              <p className={cn("text-2xl md:text-3xl font-black mt-1", item.color)}>
                {item.value}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-100 dark:border-white/5">
              <ClipboardList className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Working Grid split in master-detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Report Stream */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-white border border-slate-200 dark:border-slate-100 rounded-2xl p-4 shadow-sm">
            <h3 className="font-extrabold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">
              Active Filters
            </h3>
            
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search location or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 h-10 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl outline-none text-xs font-semibold text-slate-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1 pl-1">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-2 h-9 text-[10px] font-bold text-slate-700 dark:text-white"
                  >
                    <option value="all">All Items</option>
                    <option value="pothole">Pothole</option>
                    <option value="waste">Trash</option>
                    <option value="drainage">Drainage</option>
                    <option value="hazard">Hazard</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1 pl-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-2 h-9 text-[10px] font-bold text-slate-700 dark:text-white"
                  >
                    <option value="all">All States</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In-Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* List display */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredIssues.map((issue) => {
              const isActive = issue.id === selectedIssueId;
              return (
                <motion.div
                  key={issue.id}
                  onClick={() => setSelectedIssueId(issue.id)}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer text-left relative overflow-hidden",
                    isActive 
                      ? "bg-slate-100/80 dark:bg-white/10 border-saffron dark:border-saffron shadow-lg" 
                      : "bg-white dark:bg-white border-slate-200 dark:border-slate-100/50 hover:border-slate-300 dark:hover:border-slate-200"
                  )}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      #{issue.id.slice(0, 6)}
                    </span>
                    <span className={cn(
                      "text-[9px] uppercase font-extrabold px-2 py-0.5 rounded",
                      issue.severity === 'high' ? 'bg-red-500/10 text-red-500' :
                      issue.severity === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-slate-100 text-slate-500'
                    )}>
                      {issue.severity}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate mb-1">
                    {issue.type.charAt(0).toUpperCase() + issue.type.slice(1)}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {issue.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-400 dark:text-slate-500 truncate max-w-[120px] block">
                      {issue.location.address}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] uppercase font-black",
                      issue.status === 'resolved' ? 'bg-indian-green/10 text-indian-green' :
                      issue.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-saffron/10 text-saffron'
                    )}>
                      {issue.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}

            {filteredIssues.length === 0 && (
              <div className="py-12 text-center text-slate-400 bg-white dark:bg-white border border-dashed border-slate-200 dark:border-slate-100 rounded-2xl">
                <AlertTriangle className="w-8 h-8 text-saffron opacity-50 mx-auto mb-2" />
                <p className="text-xs font-semibold">No issues matching criteria found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Monitor / Actions */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selectedIssue ? (
              <motion.div
                key={selectedIssue.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white dark:bg-white border border-slate-200 dark:border-slate-100 rounded-2xl md:p-8 p-6 shadow-sm text-left space-y-6"
              >
                {/* Heading info */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-white/10 pb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[11px] uppercase font-black text-slate-400 dark:text-slate-500 px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded">
                        REFERENCE: #{selectedIssue.id}
                      </span>
                      <span className={cn(
                        "text-[9px] font-extrabold uppercase px-2 py-0.5 rounded",
                        selectedIssue.status === 'resolved' ? 'bg-indian-green/15 text-indian-green' :
                        selectedIssue.status === 'in-progress' ? 'bg-blue-500/15 text-blue-500' :
                        'bg-saffron-light dark:bg-saffron/20 text-saffron'
                      )}>
                        {selectedIssue.status.toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold font-serif text-slate-800 dark:text-white tracking-tight">
                      {selectedIssue.type.charAt(0).toUpperCase() + selectedIssue.type.slice(1)} Audit Pipeline
                    </h2>
                  </div>

                  {/* Actions for Inspector */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedIssue.id, 'in-progress')}
                      disabled={loading !== null || selectedIssue.status === 'in-progress'}
                      className={cn(
                        "h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                        selectedIssue.status === 'in-progress'
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white"
                      )}
                    >
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>Start Repair</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(selectedIssue.id, 'resolved')}
                      disabled={loading !== null || selectedIssue.status === 'resolved'}
                      className={cn(
                        "h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                        selectedIssue.status === 'resolved'
                          ? "bg-indian-green/10 text-indian-green border border-indian-green/20"
                          : "bg-indian-green text-white hover:bg-indian-green-dark"
                      )}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Resolve</span>
                    </button>
                  </div>
                </div>

                {/* Grid info: Image and description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100 dark:border-white/10">
                  <div className="space-y-4">
                    {selectedIssue.imageUrl && (
                      <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
                        <img 
                          src={selectedIssue.imageUrl} 
                          alt="Hazard photo" 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800";
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl text-xs space-y-2.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Reporter ID:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                          {selectedIssue.reporterId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Reported Address:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-right">
                          {selectedIssue.location.address}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Time Logged:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {new Date(selectedIssue.createdAt).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description Box & tags */}
                  <div className="space-y-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 mb-2">
                        Citizen Statement
                      </h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-white/5 p-4 rounded-xl min-h-[140px]">
                        {selectedIssue.description}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 mb-2">
                        Issue Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedIssue.tags.map((tg) => (
                          <span key={tg} className="px-2.5 py-1 bg-saffron-light dark:bg-saffron/15 text-saffron-dark dark:text-saffron text-[10px] font-black rounded-lg border border-saffron/10">
                            #{tg}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Safety Audit Results Mock integration optionally */}
                <div className="bg-indian-green/5 dark:bg-indian-green/10 border border-indian-green/10 p-5 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-indian-green/20">
                      <Sparkles className="w-5 h-5 text-indian-green" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white">AI Priority Audit Verdict</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Estimated repair timeline: less than 48 hours.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold text-indian-green bg-indian-green/10 px-2.5 py-1 rounded">
                      AUTO-AUDITED & APPROVED
                    </span>
                  </div>
                </div>

                {/* Government Response / Comments */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/10">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-saffron" />
                    <span>Control Room Response log ({selectedIssue.comments.length})</span>
                  </h3>

                  <div className="space-y-3">
                    {selectedIssue.comments.map((comment) => (
                      <div 
                        key={comment.id} 
                        className={cn(
                          "p-3 rounded-xl text-xs space-y-1 bg-slate-50 dark:bg-white/5 border",
                          comment.text.includes('[OFFICIAL RESPONSE]') 
                            ? 'border-saffron/30 bg-saffron-light/20 dark:bg-saffron/5' 
                            : 'border-slate-100 dark:border-white/5'
                        )}
                      >
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-saffron" />
                            {comment.userName}
                          </span>
                          <span>
                            {new Date(comment.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-medium">
                          {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddOfficialComment} className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add an official municipal directive or reply..."
                      value={officialNote}
                      onChange={(e) => setOfficialNote(e.target.value)}
                      className="flex-1 px-4 h-11 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl outline-none text-xs font-semibold text-slate-700 dark:text-white focus:ring-1 focus:ring-saffron"
                    />
                    <button
                      type="submit"
                      disabled={loading === 'comment' || !officialNote.trim()}
                      className="h-11 px-5 bg-ashoka-blue hover:bg-ashoka-blue-dark text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Post Reply</span>
                      <ArrowRight className="w-3.5 h-3.5 text-saffron" />
                    </button>
                  </form>
                </div>

              </motion.div>
            ) : (
              <div className="bg-white dark:bg-white border border-slate-200 dark:border-slate-100 rounded-2xl py-20 text-center">
                <Shield className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">No Active Issues Selected</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select a logged citizen report from the sidebar panel to audit.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
