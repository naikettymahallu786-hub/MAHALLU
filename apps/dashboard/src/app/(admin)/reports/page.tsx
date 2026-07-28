'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, Download, FileText, Users, GraduationCap, DollarSign } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function ReportsPage() {
  const { t } = useTranslation();
  const { data: financeReport, isLoading } = useQuery({
    queryKey: ['financial-report'],
    queryFn: () => apiClient.get('/reports/financial').then(r => r.data.data),
  });

  const exportReport = async (type: string) => {
    const loadingToast = toast.loading(`Exporting ${type} report...`);
    try {
      let endpoint = '';
      if (type === 'Financial') endpoint = '/reports/export/financial';
      else if (type === 'Member') endpoint = '/reports/export/members';
      else if (type === 'Academic') endpoint = '/reports/export/academic';
      else if (type === 'IncomeExpense') endpoint = '/reports/export/income-expense';
      else if (type === 'Payments') endpoint = '/reports/export/payments';
      else {
        toast.dismiss(loadingToast);
        toast.error('Unknown report type');
        return;
      }

      const response = await apiClient.get(endpoint, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type.toLowerCase()}_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success(`${type} report exported successfully.`);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || `Failed to export ${type} report.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('reports.title')}</h1>
          <p className="page-subtitle">{t('reports.subtitle')}</p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: t('reports.financialStatement') || 'Financial Statement', desc: t('reports.financialDesc') || 'Overview of Mahallu funds and transactions', icon: DollarSign, color: '#059669', type: 'Financial' },
          { title: t('reports.memberCensus') || 'Member Census Report', desc: t('reports.memberDesc') || 'Census of Mahallu families and members', icon: Users, color: '#3b82f6', type: 'Member' },
          { title: t('reports.academicProgress') || 'Academic Progress', desc: t('reports.academicDesc') || 'Student enrollments and Madrasa logs', icon: GraduationCap, color: '#8b5cf6', type: 'Academic' },
          { title: 'Income & Expense Report', desc: 'Categorized list of incomes and expenses', icon: BarChart3, color: '#f59e0b', type: 'IncomeExpense' },
          { title: 'Payment History', desc: 'Complete history of payments and dues collection', icon: FileText, color: '#ec4899', type: 'Payments' },
        ].map((rep, i) => (
          <motion.div
            key={rep.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="section-card flex flex-col justify-between h-48 group border hover:border-emerald-500/20 transition-all duration-300"
          >
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${rep.color}15` }}>
                <rep.icon size={22} style={{ color: rep.color }} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-foreground group-hover:text-emerald-600 transition-colors leading-tight">{rep.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{rep.desc}</p>
              </div>
            </div>

            <button
              onClick={() => exportReport(rep.type)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-border hover:border-emerald-500/30 text-sm font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/15 transition-all duration-200"
            >
              <Download size={14} />
              {t('reports.exportBtn')}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
