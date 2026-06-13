import React from 'react';
import { 
  Bell, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Settings,
  MoreVertical,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Notification } from '../types';
import { formatTimestamp, cn } from '../lib/utils';

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  onNavigateToRecord?: (id: string) => void;
}

export default function NotificationCenter({ 
  notifications, 
  onMarkRead, 
  onClearAll,
  onNavigateToRecord 
}: NotificationCenterProps) {
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'unread'>('all');
  
  const filtered = notifications.filter(n => 
    activeFilter === 'all' ? true : !n.read
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Notification Center</h2>
          <p className="text-sm text-slate-400">Updates on your reports and local civic alerts</p>
        </div>
        <button 
          onClick={onClearAll}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest text-left sm:text-right"
        >
          Clear All
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <FilterTab active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} label="All" count={notifications.length} />
        <FilterTab active={activeFilter === 'unread'} onClick={() => setActiveFilter('unread')} label="Unread" count={notifications.filter(n => !n.read).length} />
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {filtered.length > 0 ? (
            filtered.sort((a,b) => b.timestamp - a.timestamp).map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "data-card p-4 md:p-5 flex gap-4 transition-all group relative",
                  !n.read && "bg-emerald-50/20 border-emerald-100"
                )}
              >
                {!n.read && (
                  <div className="absolute top-4 right-4 md:top-5 md:right-5 w-2 h-2 rounded-full bg-emerald-500" />
                )}
                
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                  n.type === 'alert' ? "bg-amber-100 text-amber-600" :
                  n.type === 'update' ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                )}>
                  {n.type === 'alert' && <AlertCircle className="w-5 h-5" />}
                  {n.type === 'update' && <CheckCircle className="w-5 h-5" />}
                  {n.type === 'message' && <MessageSquare className="w-5 h-5" />}
                </div>

                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => n.relatedId && onNavigateToRecord?.(n.relatedId)}
                >
                  <div className="flex items-center justify-between mb-1 gap-4">
                    <h3 className={cn("text-sm font-bold truncate", n.read ? "text-slate-600" : "text-slate-900")}>
                      {n.title}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-300 uppercase shrink-0">
                      {formatTimestamp(n.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-2xl">
                    {n.message}
                  </p>
                  
                  {!n.read && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkRead(n.id);
                      }}
                      className="mt-3 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-24 bg-white rounded-[24px] md:rounded-[32px] border-2 border-dashed border-slate-100">
               <Bell className="w-12 h-12 text-slate-100 mx-auto mb-4" />
               <p className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">No notifications to show</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Preferences Section */}
      <div className="data-card overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800 tracking-tight">Notification Settings</h3>
           </div>
        </div>
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
           <PreferenceToggle label="Report Updates" description="Progress tracking and verification alerts" defaultChecked />
           <PreferenceToggle label="Safety Alerts" description="Emergency warnings for hazards in your precinct" defaultChecked />
           <PreferenceToggle label="Reward Alerts" description="Coin updates and badge milestones" />
        </div>
      </div>
    </div>
  );
}

function FilterTab({ active, onClick, label, count }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2",
        active 
          ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20" 
          : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
      )}
    >
      {label}
      <span className={cn(
        "text-[10px] px-1.5 py-0.5 rounded-full",
        active ? "bg-white/20" : "bg-slate-100"
      )}>{count}</span>
    </button>
  );
}

function PreferenceToggle({ label, description, defaultChecked }: any) {
  const [checked, setChecked] = React.useState(defaultChecked || false);
  return (
    <div className="flex items-start justify-between group">
      <div className="flex-1 pr-6">
        <h4 className="text-sm font-bold text-slate-800 mb-1">{label}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>
      <button 
        onClick={() => setChecked(!checked)}
        className={cn(
          "w-12 h-6 rounded-full transition-colors duration-200 shrink-0 relative",
          checked ? "bg-emerald-500" : "bg-slate-200"
        )}
      >
        <div className={cn(
          "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm",
          checked ? "translate-x-6" : "translate-x-0"
        )} />
      </button>
    </div>
  )
}
