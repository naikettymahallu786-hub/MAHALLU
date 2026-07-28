'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Download, UserCheck, DollarSign, BookOpen, Eye } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function TeachersPage() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isMadrasaPortal = pathname.startsWith('/madrasa-portal');

  const { data, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => apiClient.get('/teachers').then(r => r.data),
  });

  const teachers = data?.data || [];

  // Calculate sum of salaries
  const totalSalaries = teachers.reduce((sum: number, t: any) => sum + (t.salary || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('teachers_page.title')}</h1>
          <p className="page-subtitle">{t('teachers_page.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
            <Download size={16} />
            {t('teachers_page.export')}
          </button>
          <Link href={isMadrasaPortal ? '/madrasa-portal/teachers/new' : '/teachers/new'}>
            <button id="add-teacher-btn" className="btn-brand flex items-center gap-2">
              <Plus size={16} />
              {t('teachers_page.addUsthadh')}
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: t('teachers_page.totalStaff'), value: teachers.length, icon: UserCheck, color: '#059669' },
          { label: t('teachers_page.avgSalary'), value: formatCurrency(teachers.length ? totalSalaries / teachers.length : 0), icon: DollarSign, color: '#f59e0b' },
          { label: t('teachers_page.monthlyPayroll'), value: formatCurrency(totalSalaries), icon: DollarSign, color: '#f43f5e' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="section-card flex items-center gap-4 animate-count"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15` }}>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Teachers Table */}
      <div className="section-card overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl shimmer" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="pl-6">{t('teachers_page.empId')}</th>
                  <th>{t('teachers_page.name')}</th>
                  <th>{t('teachers_page.qualifications')}</th>
                  <th>{t('teachers_page.subjects')}</th>
                  <th>{t('teachers_page.salary')}</th>
                  <th>{t('teachers_page.status')}</th>
                  <th className="pr-6">{t('teachers_page.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <UserCheck size={40} className="mx-auto mb-3 opacity-30" />
                      <p>{t('teachers_page.noTeachers')}</p>
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher: any, i: number) => (
                    <motion.tr
                      key={teacher._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="group"
                    >
                      <td className="pl-6">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded-md font-bold">{teacher.employeeId}</code>
                      </td>
                      <td>
                        <span className="font-medium text-foreground">
                          {teacher.memberId?.name || 'Unknown Usthadh'}
                        </span>
                      </td>
                      <td className="text-muted-foreground text-sm">
                        {teacher.qualification || '—'}
                      </td>
                      <td className="text-sm text-foreground font-medium max-w-xs truncate">
                        {teacher.subjects?.join(', ') || 'General'}
                      </td>
                      <td className="text-sm text-emerald-600 font-semibold">
                        {formatCurrency(teacher.salary || 0)}
                      </td>
                      <td>
                        <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold capitalize',
                          teacher.status === 'active' ? 'badge-active' : 'badge-inactive'
                        )}>
                          {teacher.status}
                        </span>
                      </td>
                      <td className="pr-6">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={isMadrasaPortal ? `/madrasa-portal/teachers/${teacher._id}` : `/teachers/${teacher._id}`}>
                            <button className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 transition-colors">
                              <Eye size={15} />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
