'use client';

import { useTheme } from 'next-themes';
import { Bell, Search, Sun, Moon, Settings, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface TopbarProps {
  title?: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useAuthStore();
  const { language, toggleLanguage } = useUIStore();
  const { t } = useTranslation();
  const [searchFocused, setSearchFocused] = useState(false);

  const { data: inboxItems } = useQuery({
    queryKey: ['inbox', 'PENDING'],
    queryFn: () => apiClient.get('/inbox?status=PENDING').then(r => r.data.data),
  });
  
  const pendingCount = inboxItems?.length || 0;

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Page title */}
      <div className="flex-1 min-w-0">
        {title && (
          <div>
            <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 ${
            searchFocused
              ? 'border-emerald-500 bg-background w-72'
              : 'border-border bg-muted w-52'
          }`}
        >
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder={t('topbar.search')}
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="text-xs text-muted-foreground border border-border rounded px-1 hidden sm:block">⌘K</kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Link href="/inbox">
          <button
            id="notifications-btn"
            className="relative p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell size={18} />
            {pendingCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card" />
            )}
          </button>
        </Link>

        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="p-2 rounded-xl hover:bg-muted text-emerald-700 dark:text-emerald-400 font-bold text-sm bg-emerald-50 dark:bg-emerald-900/30 transition-colors flex items-center justify-center w-9 h-9"
          title="Switch Language"
        >
          {language === 'en' ? 'EN' : 'മ'}
        </button>

        {/* Theme toggle */}
        <button
          id="theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Settings */}
        <button
          id="settings-btn"
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings size={18} />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-2 ml-1 border-l border-border cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground leading-none">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <ChevronDown size={14} className="text-muted-foreground hidden sm:block" />
        </div>
      </div>
    </header>
  );
}
