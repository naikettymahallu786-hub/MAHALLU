'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import {
  LayoutDashboard, Users, Home, GraduationCap, UserCheck, DollarSign,
  FileText, Building2, Zap, Heart, Skull, MapPin, Calendar, Bell, MessageCircle,
  BarChart3, Settings, ChevronLeft, ChevronRight, LogOut, Star, ChevronDown, UserPlus, BookOpen, Inbox
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon: React.ElementType;
  badge?: number;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { id: 'inbox', label: 'Inbox', href: '/inbox', icon: Inbox },
  { id: 'registrations', label: 'Registrations', href: '/registrations', icon: UserPlus },
  {
    id: 'family_members', label: 'Family & Members', icon: Users,
    children: [
      { id: 'families', label: 'Families', href: '/families', icon: Home },
      { id: 'members', label: 'Members', href: '/members', icon: Users },
      { id: 'import_export', label: 'Import & Export', href: '/members/import-export', icon: FileText },
    ],
  },
  { id: 'mosque', label: 'Mosque', href: '/mosque', icon: Building2 },
  {
    id: 'finance', label: 'Finance', icon: DollarSign,
    children: [
      { id: 'overview', label: 'Overview', href: '/finance', icon: DollarSign },
      { id: 'receipts', label: 'Receipts', href: '/receipts', icon: FileText },
      { id: 'donations', label: 'Donations', href: '/donations', icon: Heart },
      { id: 'recurring_donations', label: 'Recurring Donations', href: '/recurring-donations', icon: Calendar },
    ],
  },
  { id: 'properties', label: 'Properties', href: '/properties', icon: Building2 },
  { id: 'certificates', label: 'Certificates', href: '/certificates', icon: FileText },
  { id: 'zakat', label: 'Zakat', href: '/zakat', icon: Zap },
  { id: 'nikah', label: 'Nikah', href: '/nikah', icon: Heart },
  { id: 'death', label: 'Death & Burial', href: '/death', icon: Skull },
  { id: 'cemetery', label: 'Cemetery', href: '/cemetery', icon: MapPin },
  { id: 'events', label: 'Events', href: '/events', icon: Calendar },
  { id: 'notices', label: 'Notices', href: '/notices', icon: Bell },
  { id: 'whatsapp', label: 'WhatsApp', href: '/whatsapp', icon: MessageCircle },
  { id: 'reports', label: 'Reports', href: '/reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Madrasa', 'Finance']);
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();

  const handlePrefetch = (id: string) => {
    if (id === 'dashboard') {
      queryClient.prefetchQuery({
        queryKey: ['dashboard-kpis'],
        queryFn: () => apiClient.get('/dashboard/kpis').then(r => r.data.data),
      });
      queryClient.prefetchQuery({
        queryKey: ['dashboard-income-expense'],
        queryFn: () => apiClient.get('/dashboard/charts/income-expense').then(r => r.data.data),
      });
    } else if (id === 'teachers') {
      queryClient.prefetchQuery({
        queryKey: ['teachers'],
        queryFn: () => apiClient.get('/teachers').then(r => r.data),
      });
    } else if (id === 'attendance') {
      queryClient.prefetchQuery({
        queryKey: ['madrasa'],
        queryFn: () => apiClient.get('/madrasa').then(r => r.data.data),
      });
    } else if (id === 'finance') {
      queryClient.prefetchQuery({
        queryKey: ['finance-kpis'],
        queryFn: () => apiClient.get('/dashboard/kpis').then(r => r.data.data),
      });
      queryClient.prefetchQuery({
        queryKey: ['transactions', new Date().getFullYear().toString()],
        queryFn: () => apiClient.get(`/finance/transactions?year=${new Date().getFullYear()}`).then(r => r.data.data),
      });
    } else if (id === 'receipts') {
      queryClient.prefetchQuery({
        queryKey: ['receipts'],
        queryFn: () => apiClient.get('/receipts').then(r => r.data),
      });
      queryClient.prefetchQuery({
        queryKey: ['members-list'],
        queryFn: () => apiClient.get('/members').then(r => r.data),
      });
    } else if (id === 'donations') {
      queryClient.prefetchQuery({
        queryKey: ['donations', 1, ''],
        queryFn: () => apiClient.get('/donations', { params: { page: 1, limit: 20, campaign: '' } }).then(r => r.data),
      });
    } else if (id === 'recurring_donations') {
      queryClient.prefetchQuery({
        queryKey: ['families', ''],
        queryFn: () => apiClient.get('/families', { params: { search: '' } }).then(r => r.data.data || []),
      });
    }
  };

  const { data: pendingRegistrations } = useQuery({
    queryKey: ['pending-registrations-count'],
    queryFn: () => apiClient.get('/registrations/pending').then(r => r.data.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const pendingCount = pendingRegistrations?.length || 0;

  const getBadge = (item: NavItem) => {
    if (item.id === 'registrations' && pendingCount > 0) return pendingCount;
    return item.badge;
  };

  const getLabel = (item: NavItem) => {
    const translated = t(`sidebar.${item.id}`);
    return translated && translated !== `sidebar.${item.id}` ? translated : item.label;
  };

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  const isActive = (href?: string) => href && pathname.startsWith(href) && href !== '/';

  const renderNavItem = (item: NavItem, depth = 0) => {
    const active = isActive(item.href);
    const expanded = expandedItems.includes(item.label);
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleExpand(item.label)}
            className={cn(
              'nav-item w-full',
              expanded && 'text-emerald-400',
            )}
          >
            <item.icon size={18} className="shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">{getLabel(item)}</span>
                <ChevronDown
                  size={14}
                  className={cn('transition-transform duration-200', expanded && 'rotate-180')}
                />
              </>
            )}
          </button>
          <AnimatePresence>
            {expanded && !collapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden ml-4 pl-3 border-l border-border mt-0.5 space-y-0.5"
              >
                {item.children!.map(child => renderNavItem(child, depth + 1))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <Link key={item.href} href={item.href!}>
        <div 
          className={cn('nav-item', active && 'active')}
          onMouseEnter={() => handlePrefetch(item.id)}
        >
          <item.icon size={18} className="shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{getLabel(item)}</span>
              {getBadge(item) !== undefined && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                  {getBadge(item)}
                </span>
              )}
            </>
          )}
        </div>
      </Link>
    );
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 70 : 260 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative h-screen flex flex-col border-r border-border overflow-hidden bg-background"
    >
      {/* Islamic pattern decoration */}
      <div className="islamic-pattern absolute inset-0 w-full h-full" />

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border relative">
        <div
          className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shrink-0"
          style={{ boxShadow: '0 0 20px rgba(5,150,105,0.4)' }}
        >
          <span className="text-white text-lg font-bold arabic">م</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-foreground font-bold text-sm leading-none">Mahallu ERP</p>
              <p className="text-emerald-600 dark:text-emerald-400/70 text-xs mt-0.5 arabic">محلة</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5 relative">
        {NAV_ITEMS.map(item => renderNavItem(item))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-border p-3 relative">
        <div className={cn('flex items-center gap-3 px-2 py-2 rounded-xl', 'hover:bg-muted cursor-pointer transition-colors')}>
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-foreground text-sm font-medium truncate">{user?.name || 'Admin'}</p>
              <p className="text-muted-foreground text-xs truncate capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className={cn(
            'nav-item w-full mt-1 text-red-400/70 hover:text-red-400 hover:bg-red-500/10',
          )}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>{t('sidebar.signOut')}</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-600 border-2 border-background flex items-center justify-center text-white hover:bg-emerald-500 transition-colors z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
