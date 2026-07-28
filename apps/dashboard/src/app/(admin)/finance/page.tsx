'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, ArrowUpRight, ArrowDownRight, TrendingUp, FileText, Heart, Wallet, Plus, Download, X, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function FinanceOverviewPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ['finance-kpis'],
    queryFn: () => apiClient.get('/dashboard/kpis').then(r => r.data.data),
  });

  const { data: transactionsData, isLoading: txLoading } = useQuery({
    queryKey: ['transactions', selectedYear],
    queryFn: () => apiClient.get(`/finance/transactions?year=${selectedYear}`).then(r => r.data.data),
  });

  const transactions = transactionsData || [];
  const netBalance = (kpis?.monthlyIncome || 0) - (kpis?.monthlyExpenses || 0);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { type: 'INCOME', amount: '', category: '', date: new Date().toISOString().split('T')[0], description: '', referenceNo: '' }
  });

  const watchType = watch('type');

  const addMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/finance/transactions', data),
    onSuccess: () => {
      toast.success('Transaction added successfully');
      setIsModalOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-kpis'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to add transaction')
  });

  const exportCSV = () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export for this year');
      return;
    }
    
    const headers = ['Date', 'Type', 'Category', 'Description', 'Reference No', 'Amount (INR)'];
    const csvContent = [
      headers.join(','),
      ...transactions.map((tx: any) => {
        return [
          new Date(tx.date).toLocaleDateString(),
          tx.type,
          `"${tx.category}"`,
          `"${tx.description}"`,
          `"${tx.referenceNo || ''}"`,
          tx.amount
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Mahallu_Finance_Report_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('finance_page.title')}</h1>
          <p className="page-subtitle">{t('finance_page.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsModalOpen(true)} className="btn-brand flex items-center gap-2">
            <Plus size={16} />
            {t('finance_page.recordTx')}
          </button>
        </div>
      </div>

      {/* Cashflow cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: t('finance_page.monthlyIncome'), value: formatCurrency(kpis?.monthlyIncome || 0), icon: ArrowUpRight, color: '#059669' },
          { label: t('finance_page.monthlyExpenses'), value: formatCurrency(kpis?.monthlyExpenses || 0), icon: ArrowDownRight, color: '#f43f5e' },
          { label: t('finance_page.netCashflow'), value: formatCurrency(netBalance), icon: Wallet, color: netBalance >= 0 ? '#059669' : '#f43f5e' },
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

      {/* Ledger Section */}
      <div className="section-card p-0 overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{t('finance_page.ledger')}</h2>
            <p className="text-sm text-muted-foreground">{t('finance_page.ledgerSubtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 rounded-lg border bg-background text-sm font-semibold"
            >
              {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                <option key={y} value={y}>{y} {t('attendance_page.date') === 'തിയ്യതി' ? 'വർഷം' : 'Year'}</option>
              ))}
            </select>
            <button onClick={exportCSV} className="px-4 py-2 rounded-lg border bg-background hover:bg-muted text-sm font-semibold flex items-center gap-2 transition-colors">
              <Download size={16} />
              {t('finance_page.exportCsv')}
            </button>
          </div>
        </div>
        
        {txLoading ? (
          <div className="p-12 flex justify-center"><Loader2 size={32} className="animate-spin text-muted-foreground" /></div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <FileText size={32} className="mx-auto mb-3 opacity-30" />
            <p>No transactions recorded for {selectedYear}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="bg-muted/30">
                  <th className="pl-6 py-3 text-left font-semibold text-muted-foreground">{t('finance_page.date')}</th>
                  <th className="py-3 text-left font-semibold text-muted-foreground">{t('finance_page.type')}</th>
                  <th className="py-3 text-left font-semibold text-muted-foreground">{t('finance_page.category')}</th>
                  <th className="py-3 text-left font-semibold text-muted-foreground">{t('finance_page.description')}</th>
                  <th className="py-3 text-right font-semibold text-muted-foreground pr-6">{t('finance_page.amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx: any, i: number) => (
                  <tr key={tx._id} className="hover:bg-muted/20">
                    <td className="pl-6 py-4">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="py-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                        tx.type === 'INCOME' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      )}>
                        {tx.type === 'INCOME' ? t('finance_page.income') : t('finance_page.expense')}
                      </span>
                    </td>
                    <td className="py-4 font-medium">{tx.category}</td>
                    <td className="py-4 text-muted-foreground max-w-[200px] truncate">{tx.description}</td>
                    <td className={cn(
                      "py-4 pr-6 text-right font-bold",
                      tx.type === 'INCOME' ? "text-emerald-600" : "text-red-600"
                    )}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-2xl shadow-xl border overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-card z-10">
                <h2 className="font-bold text-lg">Record Transaction</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto">
                <form id="tx-form" onSubmit={handleSubmit(d => addMutation.mutate(d))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => reset({ ...watch(), type: 'INCOME' })}
                      className={cn("p-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-1", watchType === 'INCOME' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-muted text-muted-foreground")}
                    >
                      <ArrowUpRight size={18} /> Income
                    </button>
                    <button
                      type="button"
                      onClick={() => reset({ ...watch(), type: 'EXPENSE' })}
                      className={cn("p-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-1", watchType === 'EXPENSE' ? "bg-red-50 border-red-200 text-red-700" : "bg-muted text-muted-foreground")}
                    >
                      <ArrowDownRight size={18} /> Expense
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Amount (INR) *</label>
                    <input type="number" {...register('amount', { required: true, valueAsNumber: true })} className="w-full p-2.5 rounded-xl border text-sm" placeholder="e.g. 5000" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Category *</label>
                    <select {...register('category', { required: true })} className="w-full p-2.5 rounded-xl border text-sm">
                      <option value="">Select Category...</option>
                      {watchType === 'INCOME' ? (
                        <>
                          <option value="Friday Collection">Friday Collection</option>
                          <option value="Rental Income">Rental Income</option>
                          <option value="General Donation">General Donation</option>
                          <option value="Other Income">Other Income</option>
                        </>
                      ) : (
                        <>
                          <option value="Salary">Staff Salary</option>
                          <option value="Electricity Bill">Electricity Bill</option>
                          <option value="Maintenance">Maintenance & Repairs</option>
                          <option value="Event Expenses">Event Expenses</option>
                          <option value="Other Expense">Other Expense</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Date *</label>
                    <input type="date" {...register('date', { required: true })} className="w-full p-2.5 rounded-xl border text-sm" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Description *</label>
                    <input type="text" {...register('description', { required: true })} className="w-full p-2.5 rounded-xl border text-sm" placeholder="e.g. November Electricity Bill" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Reference / Voucher No</label>
                    <input type="text" {...register('referenceNo')} className="w-full p-2.5 rounded-xl border text-sm" placeholder="Optional" />
                  </div>
                </form>
              </div>
              <div className="p-4 border-t sticky bottom-0 bg-card z-10 flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border font-bold text-sm">Cancel</button>
                <button type="submit" form="tx-form" disabled={addMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm flex justify-center items-center">
                  {addMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Save Transaction'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
