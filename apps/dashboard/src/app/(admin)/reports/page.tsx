'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, Download, FileText, Users, GraduationCap, DollarSign, ArrowRight, Heart, Award, Calendar, Skull, Zap } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ReportsPage() {
  const { data: financeReport } = useQuery({
    queryKey: ['financial-report'],
    queryFn: () => apiClient.get('/reports/financial').then(r => r.data.data),
  });

  const exportReport = async (type: string) => {
    const loadingToast = toast.loading(`Exporting ${type} report...`);
    try {
      let endpoint = '';
      if (type === 'Financial') endpoint = '/payments/reports/finance?format=csv';
      else if (type === 'Member') endpoint = '/reports/export/members';
      else if (type === 'Academic') endpoint = '/reports/export/academic';
      else if (type === 'IncomeExpense') endpoint = '/reports/export/income-expense';
      else if (type === 'Payments') endpoint = '/reports/export/payments';
      else if (type === 'Nikah') endpoint = '/reports/export/nikah';
      else if (type === 'Certificates') endpoint = '/reports/export/certificates';
      else if (type === 'Events') endpoint = '/reports/export/events';
      else if (type === 'Death') endpoint = '/reports/export/death';
      else if (type === 'Zakat') endpoint = '/reports/export/zakat';
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

  const reportCards = [
    {
      title: 'Full Finance & Revenue Report',
      desc: 'Complete report of all receipts, donations, recurring contributions, rents, zakat, and dues with date distance & status filters.',
      icon: DollarSign,
      color: '#059669',
      type: 'Financial',
      href: '/finance/reports',
      badge: 'Interactive Hub',
    },
    {
      title: 'Nikah Marriage Registrations',
      desc: 'Complete registry of all registered Nikah marriages, bride & groom details, mahar, and Khazi officiator logs.',
      icon: Heart,
      color: '#e11d48',
      type: 'Nikah',
      badge: 'CSV Export',
    },
    {
      title: 'Certificates Issued Ledger',
      desc: 'Log of all residence, membership, nikah, and death certificates issued with dates and status.',
      icon: Award,
      color: '#0284c7',
      type: 'Certificates',
      badge: 'CSV Export',
    },
    {
      title: 'Mahallu Events & Programs',
      desc: 'Detailed log of upcoming and past events, attendee counts, fees, and venues.',
      icon: Calendar,
      color: '#7c3aed',
      type: 'Events',
      badge: 'CSV Export',
    },
    {
      title: 'Death & Burial Register',
      desc: 'Record of deaths, janazah dates, burial locations, and cemetery grave plot assignments.',
      icon: Skull,
      color: '#64748b',
      type: 'Death',
      badge: 'CSV Export',
    },
    {
      title: 'Zakat Distribution Report',
      desc: 'Overview of annual Zakat collections, applicant requests, approved amounts, and distribution status.',
      icon: Zap,
      color: '#d97706',
      type: 'Zakat',
      badge: 'CSV Export',
    },
    {
      title: 'Member & Family Census',
      desc: 'Census of all Mahallu families, members, wards, phone numbers, and status records.',
      icon: Users,
      color: '#3b82f6',
      type: 'Member',
      badge: 'CSV Export',
    },
    {
      title: 'Madrasa Academic Progress',
      desc: 'Student enrollments, admission records, class logs, and guardian contacts.',
      icon: GraduationCap,
      color: '#8b5cf6',
      type: 'Academic',
      badge: 'CSV Export',
    },
    {
      title: 'Income & Expense Statement',
      desc: 'Categorized overview of all incoming revenues and outgoing expenses.',
      icon: BarChart3,
      color: '#f59e0b',
      type: 'IncomeExpense',
      badge: 'CSV Export',
    },
    {
      title: 'Payment History Ledger',
      desc: 'Detailed history of completed, pending, and failed payment transactions.',
      icon: FileText,
      color: '#ec4899',
      type: 'Payments',
      badge: 'CSV Export',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="h-4 w-4" />
            Central Reporting Center
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Reports & Analytics Hub</h1>
          <p className="text-emerald-100/80 text-sm mt-1">
            Generate, filter, view, and download analytical reports for Finance, Census, Madrasa, and Operations.
          </p>
        </div>

        <Link
          href="/finance/reports"
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-md transition-all shrink-0"
        >
          Open Full Finance Reports
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCards.map((rep, i) => (
          <motion.div
            key={rep.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${rep.color}15` }}>
                  <rep.icon size={24} style={{ color: rep.color }} />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                  {rep.badge}
                </span>
              </div>

              <h3 className="font-bold text-lg text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                {rep.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                {rep.desc}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border/60 flex items-center gap-2">
              {rep.href && (
                <Link
                  href={rep.href}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
                >
                  View Interactive Report
                  <ArrowRight size={14} />
                </Link>
              )}
              <button
                onClick={() => exportReport(rep.type)}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-bold transition-all ${rep.href ? '' : 'w-full'}`}
              >
                <Download size={14} />
                Export CSV
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
