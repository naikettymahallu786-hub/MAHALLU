'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Download, Home, Users, DollarSign, Eye, QrCode } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function FamiliesPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['families', page, search],
    queryFn: () => apiClient.get('/families', {
      params: { page, limit: 20, search },
    }).then(r => r.data),
  });

  const families = data?.data || [];
  const pagination = data?.pagination;

  // Derive stats
  const totalFamilies = pagination?.total || families.length;
  const totalBalance = families.reduce((sum: number, f: any) => sum + (f.outstandingBalance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('families.title')}</h1>
          <p className="page-subtitle">{t('families.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
            <Download size={16} />
            {t('families.export')}
          </button>
          <Link href="/families/new">
            <button id="add-family-btn" className="btn-brand flex items-center gap-2">
              <Plus size={16} />
              {t('families.addFamily')}
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: t('families.totalFamilies'), value: totalFamilies, icon: Home, color: '#059669' },
          { label: t('families.familiesInDebt'), value: families.filter((f: any) => f.outstandingBalance > 0).length, icon: Users, color: '#f59e0b' },
          { label: t('families.totalBalance'), value: formatCurrency(totalBalance), icon: DollarSign, color: '#f43f5e' },
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
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('families.search')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Families Table */}
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
                  <th className="pl-6">{t('families.code')}</th>
                  <th>{t('families.head')}</th>
                  <th>{t('families.contact')}</th>
                  <th>{t('families.ward')}</th>
                  <th>{t('families.address')}</th>
                  <th>{t('families.balance')}</th>
                  <th className="pr-6">{t('families.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {families.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Home size={40} className="mx-auto mb-3 opacity-30" />
                      <p>{t('families.noFamilies')}</p>
                    </td>
                  </tr>
                ) : (
                  families.map((family: any, i: number) => (
                    <motion.tr
                      key={family._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="group"
                    >
                      <td className="pl-6">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded-md font-bold">{family.familyCode}</code>
                      </td>
                      <td>
                        <span className="font-medium text-foreground">
                          {family.headMemberId?.name || 'Unknown head'}
                        </span>
                      </td>
                      <td className="text-muted-foreground text-sm">
                        {family.headMemberId?.phone || '—'}
                      </td>
                      <td>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium">
                          {family.wardNo || '—'}
                        </span>
                      </td>
                      <td className="text-sm text-muted-foreground truncate max-w-xs">
                        {family.address?.line1}, {family.address?.city}
                      </td>
                      <td>
                        <span className={cn('text-sm font-semibold',
                          family.outstandingBalance > 0 ? 'text-red-500' : 'text-emerald-600'
                        )}>
                          {formatCurrency(family.outstandingBalance || 0)}
                        </span>
                      </td>
                      <td className="pr-6">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/families/${family._id}`}>
                            <button className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 transition-colors">
                              <Eye size={15} />
                            </button>
                          </Link>
                          {family.qrCode && (
                            <button className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 transition-colors">
                              <QrCode size={15} />
                            </button>
                          )}
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
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total} families
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
