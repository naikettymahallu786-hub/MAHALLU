'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Bell, Calendar, User, Send, Download } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function NoticesPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: () => apiClient.get('/notices').then(r => r.data),
  });

  const notices = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('notices.title')}</h1>
          <p className="page-subtitle">{t('notices.subtitle')}</p>
        </div>
        <Link href="/notices/new">
          <button id="add-notice-btn" className="btn-brand flex items-center gap-2">
            <Plus size={16} />
            {t('notices.newNotice')}
          </button>
        </Link>
      </div>

      {/* Notice List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}
          </div>
        ) : notices.length === 0 ? (
          <div className="section-card flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
            <Bell size={48} className="mb-4 text-emerald-600 opacity-40 animate-pulse" />
            <h2 className="text-lg font-semibold mb-1">No announcements published</h2>
            <p className="text-sm max-w-sm mb-4">Click "New Notice" to publish notices or send messages to members.</p>
          </div>
        ) : (
          notices.map((notice: any, i: number) => (
            <motion.div
              key={notice._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="section-card p-5 border border-border/80 hover:border-emerald-500/20 transition-all duration-200 flex flex-col sm:flex-row justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 shrink-0 mt-0.5">
                  <Bell size={18} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground leading-snug">{notice.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{notice.body}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-emerald-600" />
                      {formatDate(notice.createdAt)}
                    </span>
                    <span className="flex items-center gap-1 capitalize">
                      <Send size={12} className="text-emerald-600" />
                      {t('notices.channel')}: {notice.channel}
                    </span>
                  </div>
                </div>
              </div>
              <div className="shrink-0 flex sm:flex-col items-end justify-between sm:justify-start gap-2">
                <span className={cn('text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider',
                  notice.status === 'sent' || notice.status === 'delivered' ? 'badge-active' : 'badge-pending'
                )}>
                  {notice.status}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
