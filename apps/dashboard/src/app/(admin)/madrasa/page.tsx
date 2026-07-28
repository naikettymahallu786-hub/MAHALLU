'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { GraduationCap, Award, BookOpen, Clock, User, Phone, CheckSquare } from 'lucide-react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function MadrasaPage() {
  const { t } = useTranslation();
  const { data: madrasa, isLoading } = useQuery({
    queryKey: ['madrasa'],
    queryFn: () => apiClient.get('/madrasa').then(r => r.data.data),
  });

  const { data: studentsStats } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => apiClient.get('/dashboard/kpis').then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 rounded-2xl shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl shimmer" />
          <div className="h-64 rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('madrasa.title')}</h1>
          <p className="page-subtitle">{t('madrasa.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/students">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
              {t('madrasa.viewStudents')}
            </button>
          </Link>
          <Link href="/teachers">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
              {t('madrasa.viewTeachers')}
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-card lg:col-span-2 space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl gradient-brand flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
              <GraduationCap size={30} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{madrasa?.name || 'Darul Uloom Madrasa'}</h2>
              <p className="text-xs text-muted-foreground mt-1">{t('madrasa.affiliated')}: {madrasa?.affiliatedTo || 'Samastha Kerala Islam Matha Vidyabhyasa Board'}</p>
              <p className="text-xs text-muted-foreground">{t('madrasa.academicYear')}: {madrasa?.academicYear || '2024-2025'}</p>
            </div>
          </div>

          <div className="border-t border-border pt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl border border-border bg-card flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 shrink-0">
                <User size={18} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">{t('madrasa.principal')}</p>
                <p className="font-semibold text-sm">{madrasa?.principalId?.name || 'Usthad Abdul Hameed Faizy'}</p>
                <p className="text-xs text-muted-foreground">{madrasa?.principalId?.phone || '+91 98765 43216'}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 shrink-0">
                <Award size={18} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">{t('madrasa.statistics')}</p>
                <p className="font-semibold text-sm">{studentsStats?.activeStudents || 120} {t('madrasa.activeStudents')}</p>
                <p className="text-xs text-muted-foreground">{studentsStats?.activeTeachers || 8} {t('madrasa.activeUsthadhs')}</p>
              </div>
            </div>
          </div>

          {/* Subjects */}
          <div className="border-t border-border pt-5">
            <h3 className="font-semibold mb-4 text-base flex items-center gap-2">
              <BookOpen size={18} className="text-emerald-600" />
              {t('madrasa.syllabus')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(madrasa?.subjects || ['Quran', 'Tajweed', 'Arabic', 'Fiqh', 'Hadith', 'Aqeedah', 'Akhlaq', 'Islamic History']).map((subject: string, i: number) => (
                <span key={i} className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/10 cursor-default transition-all duration-200">
                  {subject}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Classes List */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="section-card space-y-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold">{t('madrasa.classes')}</h2>
            <Link href="/madrasa/classes/new">
              <span className="text-xs text-emerald-600 font-semibold cursor-pointer hover:underline">{t('madrasa.addClass')}</span>
            </Link>
          </div>
          <div className="space-y-2">
            {(madrasa?.classes || ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10']).map((cls: string, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/30 transition-all">
                <span className="font-medium text-sm">{cls}</span>
                <span className="text-xs text-muted-foreground">Level {i + 1}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
