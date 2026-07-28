'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, Users, User, ArrowRight, Plus } from 'lucide-react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

import { usePathname } from 'next/navigation';

export default function ClassesPage() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isMadrasaPortal = pathname.startsWith('/madrasa-portal');
  
  const { data: classes, isLoading } = useQuery({
    queryKey: ['madrasa-classes'],
    queryFn: () => apiClient.get('/classes').then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-2xl shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 rounded-2xl shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('madrasa.classes') || 'Classes'}</h1>
          <p className="page-subtitle">{'Manage madrasa classes, timetables, and assignments'}</p>
        </div>
        <Link href={isMadrasaPortal ? '/madrasa-portal/classes/new' : '/madrasa/classes/new'}>
          <button className="btn-primary">
            <Plus size={18} />
            {'Add Class'}
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes?.map((cls: any, index: number) => (
          <motion.div
            key={cls._id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="section-card group relative hover:border-emerald-500/30 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{cls.name}</h3>
                  <p className="text-xs text-muted-foreground">{'Level'} {cls.level}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <User size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">{'Usthadh:'}</span>
                <span className="font-medium text-foreground">{cls.teacherId?.memberId?.name || 'Not Assigned'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">{'Capacity:'}</span>
                <span className="font-medium text-foreground">{cls.capacity || 'N/A'}</span>
              </div>
            </div>

            <Link href={isMadrasaPortal ? `/madrasa-portal/classes/${cls._id}` : `/madrasa/classes/${cls._id}`}>
              <div className="absolute bottom-4 right-4 w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <ArrowRight size={16} />
              </div>
            </Link>
          </motion.div>
        ))}
        {(!classes || classes.length === 0) && (
          <div className="col-span-full p-12 text-center border border-dashed rounded-2xl border-border bg-card">
            <BookOpen size={40} className="mx-auto mb-4 text-emerald-600/50" />
            <h3 className="text-lg font-bold mb-1">{'No Classes Found'}</h3>
            <p className="text-sm text-muted-foreground">{'Get started by creating the first class.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
