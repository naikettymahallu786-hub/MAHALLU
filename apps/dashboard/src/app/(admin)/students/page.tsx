'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Download, GraduationCap, DollarSign, Clock, Eye } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function StudentsPage() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isMadrasaPortal = pathname.startsWith('/madrasa-portal');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search, classId, status],
    queryFn: () => apiClient.get('/students', {
      params: { page, limit: 20, search, classId, status },
    }).then(r => r.data),
  });

  const students = data?.data || [];
  const pagination = data?.pagination;

  // Calculate sum of fee balances
  const totalOutstandingFees = students.reduce((sum: number, s: any) => sum + (s.feeBalance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('students.title')}</h1>
          <p className="page-subtitle">{t('students.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
            <Download size={16} />
            Export
          </button>
          <Link href={isMadrasaPortal ? '/madrasa-portal/students/new' : '/students/new'}>
            <button id="add-student-btn" className="btn-brand flex items-center gap-2">
              <Plus size={16} />
              New Admission
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: t('students.totalEnrolled'), value: pagination?.total || students.length, icon: GraduationCap, color: '#059669' },
          { label: t('students.pendingFeeBalances'), value: students.filter((s: any) => s.feeBalance > 0).length, icon: Clock, color: '#f59e0b' },
          { label: 'Total Outstanding Fees', value: formatCurrency(totalOutstandingFees), icon: DollarSign, color: '#f43f5e' },
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

      {/* Filters */}
      <div className="section-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('students.search')}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="promoted">Promoted</option>
            <option value="transferred">Transferred</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="section-card overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-xl shimmer" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="pl-6">{t('students.admissionNo')}</th>
                  <th>{t('students.studentName')}</th>
                  <th>{t('students.class')}</th>
                  <th>{t('students.guardian')}</th>
                  <th>Fee Paid</th>
                  <th>Fee Balance</th>
                  <th>Status</th>
                  <th className="pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
                      <p>No students found</p>
                    </td>
                  </tr>
                ) : (
                  students.map((student: any, i: number) => (
                    <motion.tr
                      key={student._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="group"
                    >
                      <td className="pl-6">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded-md font-bold">{student.admissionNo}</code>
                      </td>
                      <td>
                        <span className="font-medium text-foreground">
                          {student.memberId?.name || 'Unknown Student'}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm text-foreground font-medium">
                          {student.classId?.name || 'Class 1'}
                        </span>
                      </td>
                      <td className="text-muted-foreground text-sm">
                        {student.guardianId?.name || '—'}
                      </td>
                      <td className="text-sm text-emerald-600 font-medium">
                        {formatCurrency(student.feePaid || 0)}
                      </td>
                      <td>
                        <span className={cn('text-sm font-semibold',
                          student.feeBalance > 0 ? 'text-red-500' : 'text-emerald-600'
                        )}>
                          {formatCurrency(student.feeBalance || 0)}
                        </span>
                      </td>
                      <td>
                        <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold capitalize',
                          student.status === 'active' ? 'badge-active' : 'badge-inactive'
                        )}>
                          {student.status}
                        </span>
                      </td>
                      <td className="pr-6">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={isMadrasaPortal ? `/madrasa-portal/students/${student._id}` : `/students/${student._id}`}>
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

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total} students
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
