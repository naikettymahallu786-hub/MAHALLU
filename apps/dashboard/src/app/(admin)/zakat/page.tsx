'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Zap, DollarSign, UserCheck, Calendar } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function ZakatPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['zakat'],
    queryFn: () => apiClient.get('/zakat').then(r => r.data),
  });

  const zakatList = data?.data || [];

  // Analytics calculations
  const totalCollectedAllTime = zakatList.reduce((sum: number, z: any) => sum + (z.totalCollected || 0), 0);
  const totalDistributedAllTime = zakatList.reduce((sum: number, z: any) => sum + (z.totalDistributed || 0), 0);
  const totalBalance = totalCollectedAllTime - totalDistributedAllTime;
  const totalApplicants = zakatList.reduce((sum: number, z: any) => sum + (z.applicants?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('zakat.title')}</h1>
          <p className="page-subtitle">{t('zakat.subtitle')}</p>
        </div>
        <Link href="/zakat/new">
          <button id="add-zakat-btn" className="btn-brand flex items-center gap-2">
            <Plus size={16} />
            {t('zakat.initializeYear')}
          </button>
        </Link>
      </div>

      {/* Zakat Analytics Cards */}
      {!isLoading && zakatList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Zakat Collected', value: formatCurrency(totalCollectedAllTime), icon: DollarSign, color: '#059669' },
            { label: 'Total Distributed', value: formatCurrency(totalDistributedAllTime), icon: Zap, color: '#ec4899' },
            { label: 'Available Balance', value: formatCurrency(totalBalance), icon: Calendar, color: '#3b82f6' },
            { label: 'Total Applicants', value: `${totalApplicants} supported`, icon: UserCheck, color: '#f59e0b' },
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
      )}

      {/* Latest Year Distribution Progress */}
      {!isLoading && zakatList.length > 0 && (
        (() => {
          const latestYear = zakatList[0];
          if (!latestYear) return null;
          const collected = latestYear.totalCollected || 0;
          const distributed = latestYear.totalDistributed || 0;
          const percent = collected > 0 ? Math.round((distributed / collected) * 100) : 0;
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="section-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">Year {latestYear.year} Distribution Progress</h3>
                <p className="text-sm text-muted-foreground">Showing distribution progress relative to collections.</p>
              </div>
              <div className="flex-1 max-w-md w-full space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span>{percent}% Distributed</span>
                  <span className="text-muted-foreground">{formatCurrency(distributed)} / {formatCurrency(collected)}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })()
      )}

      {/* Zakat Sessions Table */}
      <div className="section-card overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl shimmer" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="pl-6">{t('zakat.year')}</th>
                  <th>{t('zakat.collected')}</th>
                  <th>{t('zakat.distributed')}</th>
                  <th>{t('zakat.balance')}</th>
                  <th>{t('zakat.applicants')}</th>
                  <th>{t('zakat.status')}</th>
                  <th className="pr-6">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {zakatList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Zap size={40} className="mx-auto mb-3 opacity-30" />
                      <p>{t('zakat.noRecords')}</p>
                    </td>
                  </tr>
                ) : (
                  zakatList.map((zakat: any, i: number) => (
                    <motion.tr
                      key={zakat._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="group"
                    >
                      <td className="pl-6 font-bold text-sm text-foreground">
                        {zakat.year}
                      </td>
                      <td className="text-emerald-600 font-medium">
                        {formatCurrency(zakat.totalCollected || 0)}
                      </td>
                      <td className="text-pink-600 font-medium">
                        {formatCurrency(zakat.totalDistributed || 0)}
                      </td>
                      <td className="font-semibold text-sm">
                        {formatCurrency((zakat.totalCollected || 0) - (zakat.totalDistributed || 0))}
                      </td>
                      <td className="text-sm">
                        {zakat.applicants?.length || 0} applicants
                      </td>
                      <td>
                        <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold capitalize',
                          zakat.status === 'open' ? 'badge-active' : 'badge-inactive'
                        )}>
                          {zakat.status}
                        </span>
                      </td>
                      <td className="pr-6">
                        <Link href={`/zakat/${zakat._id}`}>
                          <button className="text-xs text-emerald-600 hover:underline font-bold">{t('zakat.manageApplicants')}</button>
                        </Link>
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
