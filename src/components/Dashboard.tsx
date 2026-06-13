import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  Droplets,
  Trash2,
  Route
} from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const stats = [
  { label: 'Active Issues', value: '42', icon: MapPin, color: 'text-ashoka-blue', bg: 'bg-ashoka-blue-light' },
  { label: 'Resolved (24h)', value: '18', icon: CheckCircle2, color: 'text-indian-green', bg: 'bg-indian-green-light' },
  { label: 'Citizen trust score', value: '98.4%', icon: Users, color: 'text-indian-green', bg: 'bg-indian-green-light' },
  { label: 'AI Audit Pending', value: '12', icon: Clock, color: 'text-saffron', bg: 'bg-saffron-light' },
];

const chartData = [
  { name: 'Mon', reports: 12, resolved: 10 },
  { name: 'Tue', reports: 19, resolved: 15 },
  { name: 'Wed', reports: 15, resolved: 18 },
  { name: 'Thu', reports: 22, resolved: 20 },
  { name: 'Fri', reports: 30, resolved: 25 },
  { name: 'Sat', reports: 24, resolved: 22 },
  { name: 'Sun', reports: 18, resolved: 20 },
];

export default function Dashboard({ coins = 0, userName, onViewDetail }: { coins?: number; userName?: string; onViewDetail?: (id: string) => void }) {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome Header with Tricolor accent border */}
      <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border-l-8 border-saffron border-y border-r border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight mb-2">
            {coins === 0 ? "Welcome to RoadSense India" : `Jai Hind, ${userName || 'Chetan'}!`}
          </h2>
          <p className="text-sm md:text-base text-slate-500 max-w-xl leading-relaxed whitespace-pre-line md:whitespace-normal">
            {coins === 0 
              ? "Join hands to improve Indian community infrastructure. Report road damage, garbage, or blockage to earn coins and assist local municipalities."
              : `Thank you for supporting clean & safe public roads! You've contributed to ${Math.floor(coins/50)} civic actions.\nKeep driving social impact!`}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-saffron/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8">
           <div className="p-3 md:p-4 bg-indian-green-light rounded-2xl animate-bounce border border-indian-green/20">
              <TrendingDown className="w-6 h-6 md:w-8 md:h-8 text-indian-green" />
           </div>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="data-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2 rounded-xl border border-slate-100", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live</span>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</div>
            <div className="text-xs font-semibold text-slate-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart representing Reports vs Resolutions in Saffron & Green */}
        <div className="lg:col-span-2 data-card p-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Citizen Action Impact</h2>
              <p className="text-sm text-slate-400">Weekly breakdown of reported (Saffron) vs resolved (Indian Green) issues</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-saffron" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Reported</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indian-green" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Resolved</span>
              </div>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(248, 250, 252, 0.8)' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    fontWeight: 600
                  }} 
                />
                <Bar dataKey="reports" fill="#FF9933" radius={[6, 6, 0, 0]} name="Filed Reports" />
                <Bar dataKey="resolved" fill="#138808" radius={[6, 6, 0, 0]} name="Resolved Issues" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="space-y-6">
          <div className="data-card p-8">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Issue Class Breakdown</h2>
            <div className="space-y-8">
               <CategoryItem 
                  icon={Route} 
                  label="Potholes / High Risk" 
                  value={45} 
                  color="bg-saffron" 
                  trend="-12%"
                />
               <CategoryItem 
                  icon={Droplets} 
                  label="Drainage Blockages" 
                  value={28} 
                  color="bg-ashoka-blue" 
                  trend="+5%"
                />
               <CategoryItem 
                  icon={Trash2} 
                  label="Street Waste / Garbage" 
                  value={32} 
                  color="bg-indian-green" 
                  trend="-24%"
                />
            </div>
          </div>

          <div className="p-8 bg-saffron rounded-[32px] text-white shadow-xl shadow-saffron/20 relative overflow-hidden">
             {/* Subtle decorative wheel representation inside the card */}
             <div className="absolute right-0 bottom-0 w-32 h-32 border-4 border-white/10 rounded-full translate-x-1/4 translate-y-1/4 flex items-center justify-center">
                <div className="w-16 h-16 border-2 border-dashed border-white/5 rounded-full" />
             </div>
             
             <div className="flex items-center gap-2 mb-3 relative z-10">
                <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">Critical Saffron Alert</span>
             </div>
             <p className="text-lg font-bold leading-tight mb-6 relative z-10">
                Active road repair hazard logged in Sector 4. Use route caution.
             </p>
             <button 
                onClick={() => onViewDetail?.('1')}
                className="w-full py-3 bg-white text-saffron-dark rounded-xl text-xs font-bold hover:bg-slate-50 transition-all uppercase tracking-widest relative z-10 shadow-md"
              >
                Inspect Hazard
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryItem({ icon: Icon, label, value, color, trend }: any) {
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          <span className="text-sm font-bold text-slate-700">{label}</span>
        </div>
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full",
          trend.startsWith('-') ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
        )}>
          {trend}
        </span>
      </div>
      <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={cn("h-full", color)}
        />
      </div>
    </div>
  );
}

function cn(...inputs: any) {
  return inputs.filter(Boolean).join(' ');
}
