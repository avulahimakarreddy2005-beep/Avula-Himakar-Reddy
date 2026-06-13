import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  MapPin, 
  Filter, 
  Search, 
  Inbox, 
  Trash2,
  RefreshCcw,
  Bell,
  MessageSquare,
  Send,
  User as UserIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Issue, Comment } from '../types';
import { User } from '../lib/firebase';


const statusStyles = {
  'pending': 'bg-amber-100 text-amber-700 ring-amber-500/20',
  'in-progress': 'bg-blue-100 text-blue-700 ring-blue-500/20',
  'resolved': 'bg-emerald-100 text-emerald-700 ring-emerald-500/20'
};

const severityStyles = {
  'high': 'text-rose-500 bg-rose-50',
  'medium': 'text-amber-500 bg-amber-50',
  'low': 'text-emerald-500 bg-emerald-50'
};


interface ReportsListProps {
  issues: Issue[];
  initialReportId?: string | null;
  onClearActiveId?: () => void;
  onUpdateIssue?: (issue: Issue) => void;
  user: User | null;
}

export default function ReportsList({ issues, initialReportId, onClearActiveId, onUpdateIssue, user }: ReportsListProps) {
  const [notification, setNotification] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(() => {
    if (initialReportId) {
      return issues.find(i => i.id === initialReportId) || null;
    }
    return null;
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialReportId) {
      const issue = issues.find(i => i.id === initialReportId);
      if (issue) {
        setSelectedIssue(issue);
        setHighlightedId(issue.id);
        
        // Auto-scroll logic
        setTimeout(() => {
          const element = document.getElementById(`report-${issue.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);

        // Clear highlight after 5 seconds
        setTimeout(() => setHighlightedId(null), 5000);
      } else {
        showNotification(`Report #${initialReportId} not found in database`);
      }
      onClearActiveId?.();
    }
  }, [initialReportId]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };


  const handleReportClick = (issue: Issue) => {
    setSelectedIssue(issue);
  };

  const handleAddComment = () => {
    if (!selectedIssue || !newComment.trim() || !onUpdateIssue) return;

    const comment: Comment = {
      id: `c-${Math.random().toString(36).substring(2, 9)}`,
      userId: user?.uid || 'guest-user',
      userName: user?.displayName || 'Guest User',
      text: newComment.trim(),
      timestamp: Date.now()
    };

    const updatedIssue: Issue = {
      ...selectedIssue,
      comments: [...(selectedIssue.comments || []), comment],
      updatedAt: Date.now()
    };

    onUpdateIssue(updatedIssue);
    setSelectedIssue(updatedIssue);
    setNewComment('');
    showNotification('Comment added successfully');
  };

  const filteredIssues = issues.filter(i => {
    const matchesSearch = i.type.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          i.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || i.type === filterType;
    const matchesStatus = filterStatus === 'all' || i.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const types = ['pothole', 'drainage', 'waste', 'hazard'];
  const statuses = ['pending', 'in-progress', 'resolved'];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Detail Modal */}
      <AnimatePresence>
        {selectedIssue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedIssue(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative h-64 sm:h-80 overflow-hidden">
                <img 
                  src={selectedIssue.imageUrl} 
                  className="w-full h-full object-cover"
                  alt={selectedIssue.type}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <button 
                  onClick={() => setSelectedIssue(null)}
                  className="absolute top-6 right-6 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-colors"
                >
                  <RefreshCcw className="w-5 h-5 rotate-45" />
                </button>
                <div className="absolute bottom-6 left-8 right-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset bg-white/20 text-white backdrop-blur-md"
                    )}>
                      {selectedIssue.status}
                    </span>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset bg-white/20 text-white backdrop-blur-md"
                    )}>
                      {selectedIssue.severity} Priority
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-white capitalize">{selectedIssue.type} Report</h2>
                </div>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Report ID</p>
                      <p className="text-sm font-mono font-bold text-slate-800">#{selectedIssue.id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date Reported</p>
                      <p className="text-sm font-bold text-slate-800">{new Date(selectedIssue.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
                      <div className="flex items-start gap-1 text-slate-800">
                        <MapPin className="w-4 h-4 mt-0.5 text-emerald-500" />
                        <p className="text-sm font-bold leading-tight">{selectedIssue.location.address}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       {selectedIssue.tags.map(tag => (
                         <span key={tag} className="px-2 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-lg">
                           #{tag}
                         </span>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description</p>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {selectedIssue.description}
                  </p>
                </div>

                {/* Comments Section */}
                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Community Comments</p>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {(selectedIssue.comments?.length || 0)} Comments
                    </span>
                  </div>

                  <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar mb-6">
                    {selectedIssue.comments && selectedIssue.comments.length > 0 ? (
                      selectedIssue.comments.map((comment) => (
                        <div key={comment.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center">
                                <UserIcon className="w-2.5 h-2.5 text-slate-500" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-800">{comment.userName}</span>
                            </div>
                            <span className="text-[9px] text-slate-400">{new Date(comment.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-tight">{comment.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <MessageSquare className="w-6 h-6 text-slate-100 mx-auto mb-2" />
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No comments yet</p>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <textarea 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..." 
                      className="w-full p-3 pr-12 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs min-h-[60px] custom-scrollbar"
                    />
                    <button 
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="absolute bottom-3 right-3 p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-30"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <button 
                    onClick={() => {
                      showNotification(`Updating status for #${selectedIssue.id}`);
                      setSelectedIssue(null);
                    }}
                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors"
                  >
                    Update Progress
                  </button>
                  <button 
                    onClick={() => setSelectedIssue(null)}
                    className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-4 left-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/50 backdrop-blur-md"
          >
            <Bell className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Recorded Reports</h2>
          <p className="text-slate-500 text-sm">Track and manage community reported issues.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search reports..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all w-48 md:w-64"
            />
          </div>
        </div>
      </div>

      {/* Filters UI */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Issue Type</span>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setFilterType('all')}
              className={cn(
                "px-4 py-1.5 rounded-xl text-xs font-bold transition-all border",
                filterType === 'all' 
                  ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10" 
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              )}
            >
              All Types
            </button>
            {types.map(type => (
              <button 
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border",
                  filterType === type 
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/10" 
                    : "bg-white text-slate-600 border-slate-200 hover:border-emerald-200"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Status</span>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setFilterStatus('all')}
              className={cn(
                "px-4 py-1.5 rounded-xl text-xs font-bold transition-all border",
                filterStatus === 'all' 
                  ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10" 
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              )}
            >
              All Status
            </button>
            {statuses.map(status => (
              <button 
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border",
                  filterStatus === status 
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/10" 
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-200"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue, index) => (
              <motion.div
                key={issue.id}
                id={`report-${issue.id}`}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  borderColor: highlightedId === issue.id ? '#10b981' : '#e2e8f0',
                  boxShadow: highlightedId === issue.id ? '0 0 0 4px rgba(16, 185, 129, 0.1)' : 'none'
                }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleReportClick(issue)}
                className={cn(
                  "group bg-white p-5 rounded-[24px] border hover:shadow-xl hover:shadow-slate-200/50 hover:border-emerald-200 transition-all cursor-pointer relative overflow-hidden",
                  highlightedId === issue.id && "ring-2 ring-emerald-500 ring-offset-2 animate-pulse"
                )}
              >
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="w-full sm:w-32 h-48 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-100">
                    <img 
                      src={issue.imageUrl} 
                      alt={issue.type}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800";
                      }}
                    />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset",
                            statusStyles[issue.status]
                          )}>
                            {issue.status}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset",
                            severityStyles[issue.severity]
                          )}>
                            {issue.severity} Priority
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold tracking-widest">#{issue.id}</span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-800 capitalize group-hover:text-emerald-600 transition-colors">
                        {issue.type} Report
                      </h3>
                      <div className="flex items-center gap-1 text-slate-400 mt-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="text-xs font-medium line-clamp-1">{issue.location.address}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-xs">{new Date(issue.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {issue.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-lg">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-emerald-500 font-bold text-sm sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-20 flex flex-col items-center text-center space-y-4"
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                <Inbox className="w-8 h-8 text-slate-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">No reports are recorded</h3>
                <p className="text-slate-500 max-w-xs mt-2">
                  {searchQuery 
                    ? "We couldn't find any reports matching your search." 
                    : "There are currently no active reports in this area. Start by reporting an issue."}
                </p>
              </div>

              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Refresh Page
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {issues.length > 0 && issues.length < 10 && (
        <div className="flex items-center justify-center pt-8">
          <button className="px-6 py-2 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors">
            Load More Reports
          </button>
        </div>
      )}
    </div>
  );
}
