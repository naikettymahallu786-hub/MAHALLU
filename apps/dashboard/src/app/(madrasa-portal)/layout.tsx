'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import {
  GraduationCap, BookOpen, Users, UserCheck, Calendar,
  FileText, Award, LogOut, ArrowRight, Home, ChevronRight
} from 'lucide-react';

const MADRASA_NAV_ITEMS = [
  { id: 'overview', label: 'Madrasa Overview', href: '/madrasa-portal', icon: GraduationCap },
  { id: 'classes', label: 'Classes & Sections', href: '/madrasa-portal/classes', icon: BookOpen },
  { id: 'students', label: 'Students & Admissions', href: '/madrasa-portal/students', icon: Users },
  { id: 'teachers', label: 'Ustadhs & Staff', href: '/madrasa-portal/teachers', icon: UserCheck },
  { id: 'attendance', label: 'Daily Attendance', href: '/madrasa-portal/attendance', icon: Calendar },
];

export default function MadrasaPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const isActive = (href: string) => pathname === href || (href !== '/madrasa-portal' && pathname.startsWith(href));

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Dedicated Madrasa Sidebar */}
      <aside className="w-64 border-r border-border bg-slate-950/90 flex flex-col justify-between shrink-0 relative">
        <div className="p-4 space-y-6">
          {/* Header Branding */}
          <div className="flex items-center gap-3 px-2 py-3 border-b border-white/10">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <GraduationCap size={22} />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Madrasa Portal</p>
              <p className="text-teal-400 text-xs arabic">بوابة المدرسة</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-white/40 px-3 mb-2">
              Madrasa Management
            </p>
            {MADRASA_NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.id} href={item.href}>
                  <div
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer',
                      active
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold shadow-md shadow-teal-500/20'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {/* User badge */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-xs">
              {user?.name?.[0]?.toUpperCase() || 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.name || 'Sadar Mualim'}</p>
              <p className="text-teal-300 text-[10px] truncate capitalize">{user?.role?.replace('_', ' ') || 'Madrasa Staff'}</p>
            </div>
          </div>

          {/* Switch to Admin Panel Link */}
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium transition-colors"
          >
            <span>Switch to Admin Panel</span>
            <ArrowRight size={14} />
          </Link>

          {/* Logout Button */}
          <button
            onClick={() => {
              logout();
              router.push('/madrasa-login');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
