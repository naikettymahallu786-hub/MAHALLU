'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, Home, GraduationCap, UserCheck, TrendingUp, TrendingDown,
  Heart, Zap, DollarSign, Clock, Plus, FileText, MessageCircle,
  ChevronRight, ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { apiClient } from '@/lib/api';

// ---- KPI Card Component ----
interface KpiCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: string;
  href?: string;
  delay?: number;
}

function KpiCard({ title, value, change, trend, icon: Icon, color, href, delay = 0 }: KpiCardProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="kpi-card group cursor-pointer"
    >
      {/* Gradient blob */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300"
        style={{ background: color }}
      />

      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground animate-count">
            {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          </p>
          {change && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium',
              trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground')}>
              {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : null}
              {change}
            </div>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{ background: `${color}20` }}
        >
          <Icon size={22} style={{ color }} />
        </div>
      </div>

      {href && (
        <div className="flex items-center gap-1 mt-4 text-xs text-muted-foreground group-hover:text-emerald-600 transition-colors">
          View details <ChevronRight size={12} />
        </div>
      )}
    </motion.div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

// ---- Quick Action Button ----
function QuickAction({ label, icon: Icon, href, color }: { label: string; icon: React.ElementType; href: string; color: string }) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-3 p-4 rounded-2xl border border-border hover:border-emerald-500/40 bg-card hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all duration-200 cursor-pointer group"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}15` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        <span className="text-sm font-medium text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{label}</span>
        <ArrowUpRight size={14} className="ml-auto text-muted-foreground group-hover:text-emerald-500 transition-colors" />
      </motion.div>
    </Link>
  );
}

const CHART_COLORS = {
  emerald: '#059669',
  teal: '#0d9488',
  blue: '#3b82f6',
  amber: '#f59e0b',
  rose: '#f43f5e',
};

const CustomTooltip = ({ active, payload, label, prefix = '₹' }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string; prefix?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-xl p-3 shadow-lg text-sm">
        <p className="font-medium text-foreground mb-2">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="flex items-center gap-2" style={{ color: p.color }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            {p.name}: {prefix}{p.value.toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DashboardPage() {
  const { t } = useTranslation();
  
  // KPIs
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => apiClient.get('/dashboard/kpis').then(r => r.data.data),
  });

  // Income Expense Chart
  const { data: incomeExpenseRaw, isLoading: incomeLoading } = useQuery({
    queryKey: ['dashboard-income-expense'],
    queryFn: () => apiClient.get('/dashboard/charts/income-expense').then(r => r.data.data),
  });

  // Attendance Chart
  const { data: attendanceRaw, isLoading: attendanceLoading } = useQuery({
    queryKey: ['dashboard-attendance'],
    queryFn: () => apiClient.get('/dashboard/charts/attendance').then(r => r.data.data),
  });

  // Member Growth Chart
  const { data: memberGrowthRaw, isLoading: memberLoading } = useQuery({
    queryKey: ['dashboard-member-growth'],
    queryFn: () => apiClient.get('/dashboard/charts/member-growth').then(r => r.data.data),
  });

  // Process data for Recharts
  const incomeExpenseData = useMemo(() => {
    if (!incomeExpenseRaw) return [];
    const map = new Map();
    incomeExpenseRaw.forEach((item: any) => {
      const key = `${MONTH_NAMES[item._id.month - 1]}`;
      if (!map.has(key)) map.set(key, { month: key, income: 0, expense: 0 });
      if (item._id.isExpense) map.get(key).expense += item.total;
      else map.get(key).income += item.total;
    });
    return Array.from(map.values());
  }, [incomeExpenseRaw]);

  const attendanceData = useMemo(() => {
    if (!attendanceRaw) return [];
    const map = new Map();
    attendanceRaw.forEach((item: any) => {
      const day = new Date(item._id.date).toLocaleDateString('en-US', { weekday: 'short' });
      if (!map.has(day)) map.set(day, { day, present: 0, absent: 0 });
      if (item._id.status === 'present') map.get(day).present += item.count;
      else map.get(day).absent += item.count;
    });
    return Array.from(map.values());
  }, [attendanceRaw]);

  const memberGrowthData = useMemo(() => {
    if (!memberGrowthRaw) return [];
    return memberGrowthRaw.map((item: any) => ({
      month: MONTH_NAMES[item._id.month - 1],
      amount: item.count
    }));
  }, [memberGrowthRaw]);

  const feeCollectionData = useMemo(() => {
    if (!kpis) return [];
    const total = (kpis.monthlyIncome || 0) + (kpis.pendingFees || 0);
    if (total === 0) return [{ name: 'No Data', value: 100, color: '#e2e8f0' }];
    return [
      { name: 'Collected', value: Math.round(((kpis.monthlyIncome || 0) / total) * 100), color: CHART_COLORS.emerald },
      { name: 'Pending', value: Math.round(((kpis.pendingFees || 0) / total) * 100), color: CHART_COLORS.amber },
    ];
  }, [kpis]);

  const kpiCards = [
    { title: t('dashboard.totalFamilies'), value: kpis?.totalFamilies || 0, icon: Home, color: '#059669', trend: 'up' as const, change: 'Active', href: '/families' },
    { title: t('dashboard.totalMembers'), value: kpis?.totalMembers || 0, icon: Users, color: '#3b82f6', trend: 'up' as const, change: 'Registered', href: '/members' },
    { title: t('sidebar.students'), value: kpis?.activeStudents || 0, icon: GraduationCap, color: '#8b5cf6', trend: 'neutral' as const, change: 'Enrolled', href: '/students' },
    { title: t('sidebar.teachers'), value: kpis?.activeTeachers || 0, icon: UserCheck, color: '#f59e0b', change: 'Active', href: '/teachers' },
    { title: t('dashboard.monthlyCollection'), value: `₹${((kpis?.monthlyIncome || 0) / 1000).toFixed(1)}K`, icon: TrendingUp, color: '#059669', trend: 'up' as const, change: 'Income' },
    { title: t('finance.expense'), value: `₹${((kpis?.monthlyExpenses || 0) / 1000).toFixed(1)}K`, icon: TrendingDown, color: '#f43f5e', trend: 'down' as const, change: 'Expenses' },
    { title: t('dashboard.pendingDues'), value: `₹${((kpis?.pendingFees || 0) / 1000).toFixed(1)}K`, icon: Clock, color: '#f59e0b', change: 'Outstanding dues', href: '/receipts' },
    { title: t('sidebar.donations'), value: `₹${((kpis?.monthlyDonations || 0) / 1000).toFixed(1)}K`, icon: Heart, color: '#ec4899', trend: 'up' as const, change: 'This month', href: '/donations' },
    { title: t('sidebar.zakat'), value: `₹${((kpis?.zakatCollected || 0) / 1000).toFixed(1)}K`, icon: Zap, color: '#14b8a6', change: 'This year', href: '/zakat' },
  ];

  const quickActions = [
    { label: t('dashboard.addMember'), icon: Plus, href: '/members/new', color: '#059669' },
    { label: t('dashboard.addStudent'), icon: GraduationCap, href: '/students/new', color: '#8b5cf6' },
    { label: t('dashboard.generateReceipt'), icon: FileText, href: '/receipts/new', color: '#3b82f6' },
    { label: t('dashboard.registerNikah'), icon: Heart, href: '/nikah/new', color: '#ec4899' },
    { label: t('dashboard.burialEntry'), icon: Users, href: '/death/new', color: '#64748b' },
    { label: t('dashboard.sendWhatsapp'), icon: MessageCircle, href: '/whatsapp', color: '#25d366' },
    { label: t('dashboard.collectDonation'), icon: DollarSign, href: '/donations/new', color: '#f59e0b' },
  ];

  if (kpisLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('sidebar.dashboard')}</h1>
          <p className="page-subtitle">
            {t('dashboard.welcome')}! Here's what's happening in your Mahallu.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p className="text-xs text-muted-foreground arabic text-right">بسم الله الرحمن الرحيم</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {kpiCards.map((card, i) => (
          <KpiCard key={card.title} {...card} delay={i * 0.05} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Income vs Expense - Large chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="section-card xl:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold">{t('dashboard.incomeVsExpense')}</h2>
              <p className="text-sm text-muted-foreground">{t('dashboard.historicalData')}</p>
            </div>
            <span className="badge-active text-xs px-3 py-1 rounded-full font-medium">{t('dashboard.live')}</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            {incomeExpenseData.length > 0 ? (
              <AreaChart data={incomeExpenseData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.emerald} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.emerald} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.rose} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.rose} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="income" name="Income" stroke={CHART_COLORS.emerald} strokeWidth={2.5} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="expense" name="Expenses" stroke={CHART_COLORS.rose} strokeWidth={2.5} fill="url(#expenseGrad)" />
              </AreaChart>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">Not enough data to display</div>
            )}
          </ResponsiveContainer>
        </motion.div>

        {/* Fee Collection Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="section-card"
        >
          <h2 className="text-base font-semibold mb-1">{t('dashboard.feeCollection')}</h2>
          <p className="text-sm text-muted-foreground mb-6">{t('dashboard.currentBreakdown')}</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={feeCollectionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {feeCollectionData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {feeCollectionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-semibold">{item.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Second charts row + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Member Growth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="section-card"
        >
          <h2 className="text-base font-semibold mb-1">{t('dashboard.memberGrowth')}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t('dashboard.registrationsOverTime')}</p>
          <ResponsiveContainer width="100%" height={180}>
            {memberGrowthData.length > 0 ? (
              <BarChart data={memberGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v) => [`${Number(v).toLocaleString('en-IN')}`, 'New Members']} />
                <Bar dataKey="amount" fill={CHART_COLORS.blue} radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">Not enough data</div>
            )}
          </ResponsiveContainer>
        </motion.div>

        {/* Student Attendance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="section-card"
        >
          <h2 className="text-base font-semibold mb-1">{t('dashboard.studentAttendance')}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t('dashboard.recentRecords')}</p>
          <ResponsiveContainer width="100%" height={180}>
            {attendanceData.length > 0 ? (
              <BarChart data={attendanceData} stackOffset="expand">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="present" name="Present" stackId="a" fill={CHART_COLORS.emerald} radius={[0, 0, 0, 0]} />
                <Bar dataKey="absent" name="Absent" stackId="a" fill={CHART_COLORS.rose} radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">Not enough data</div>
            )}
          </ResponsiveContainer>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="section-card"
        >
          <h2 className="text-base font-semibold mb-4">{t('dashboard.quickActions')}</h2>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <QuickAction key={action.label} {...action} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
