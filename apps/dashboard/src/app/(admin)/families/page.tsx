'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Download, Home, Users, DollarSign, Eye, QrCode, Trash2, Edit, CheckSquare, Square, RefreshCw, X } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { toast } from 'sonner';

export default function FamiliesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');

  // Bulk Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingFamily, setDeletingFamily] = useState<any | null>(null);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  // Bulk Edit Form Inputs
  const [bulkWardNo, setBulkWardNo] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['families', page, limit, search],
    queryFn: () =>
      apiClient
        .get('/families', {
          params: { page, limit, search },
        })
        .then((r) => r.data),
  });

  const families = data?.data || [];
  const pagination = data?.pagination;

  // Derive stats
  const totalFamilies = pagination?.total || families.length;
  const totalBalance = families.reduce((sum: number, f: any) => sum + (f.outstandingBalance || 0), 0);

  // Single Family Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/families/${id}`),
    onSuccess: () => {
      toast.success('Family record deleted successfully.');
      setDeletingFamily(null);
      queryClient.invalidateQueries({ queryKey: ['families'] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete family');
    },
  });

  // Bulk Selection Handlers
  const isAllSelected = families.length > 0 && families.every((f: any) => selectedIds.includes(f._id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(families.map((f: any) => f._id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk Edit Handler
  const handleBulkEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    const toastId = toast.loading(`Updating ${selectedIds.length} families...`);
    try {
      const updateData: Record<string, any> = {};
      if (bulkWardNo) updateData.wardNo = bulkWardNo;
      if (bulkStatus) updateData.status = bulkStatus;

      await Promise.all(
        selectedIds.map((id) => apiClient.put(`/families/${id}`, updateData))
      );

      toast.dismiss(toastId);
      toast.success(`Successfully updated ${selectedIds.length} families.`);
      setIsBulkEditOpen(false);
      setSelectedIds([]);
      setBulkWardNo('');
      setBulkStatus('');
      queryClient.invalidateQueries({ queryKey: ['families'] });
      refetch();
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('Failed to perform bulk update.');
    }
  };

  // Bulk Delete Handler
  const handleBulkDeleteSubmit = async () => {
    if (selectedIds.length === 0) return;

    const toastId = toast.loading(`Deleting ${selectedIds.length} families...`);
    try {
      await Promise.all(selectedIds.map((id) => apiClient.delete(`/families/${id}`)));

      toast.dismiss(toastId);
      toast.success(`Successfully deleted ${selectedIds.length} families.`);
      setIsBulkDeleteConfirmOpen(false);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['families'] });
      refetch();
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('Failed to delete selected families.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('families.title')}</h1>
          <p className="page-subtitle">{t('families.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const csvContent = [
                ['Family Code', 'Head Name', 'Phone', 'Ward No', 'Balance'].join(','),
                ...families.map((f: any) =>
                  [
                    f.familyCode || '',
                    f.headMemberId?.name || '',
                    f.headMemberId?.phone || '',
                    f.wardNo || '',
                    f.outstandingBalance || 0,
                  ].join(',')
                ),
              ].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `families_export_${Date.now()}.csv`;
              a.click();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
          >
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

      {/* Filters & Bulk Action Banner */}
      <div className="space-y-4">
        <div className="section-card">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('families.search')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Sticky Bulk Action Banner */}
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl border border-slate-700"
          >
            <div className="flex items-center gap-3">
              <span className="bg-emerald-500 text-white text-xs font-extrabold px-3 py-1 rounded-full">
                {selectedIds.length} Selected
              </span>
              <p className="text-xs text-slate-300">Choose a bulk action for selected families</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsBulkEditOpen(true)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer border border-slate-700"
              >
                <Edit size={14} />
                Bulk Edit Selected
              </button>

              <button
                onClick={() => setIsBulkDeleteConfirmOpen(true)}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                <Trash2 size={14} />
                Bulk Delete ({selectedIds.length})
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Families Table */}
      <div className="section-card overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl shimmer" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="pl-6 w-10">
                    <button onClick={toggleSelectAll} className="p-1 cursor-pointer">
                      {isAllSelected ? (
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </th>
                  <th>{t('families.code')}</th>
                  <th>{t('families.head')}</th>
                  <th>{t('families.contact')}</th>
                  <th>{t('families.ward')}</th>
                  <th>{t('families.address')}</th>
                  <th>{t('families.balance')}</th>
                  <th className="pr-6 text-right">{t('families.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {families.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Home size={40} className="mx-auto mb-3 opacity-30" />
                      <p>{t('families.noFamilies')}</p>
                    </td>
                  </tr>
                ) : (
                  families.map((family: any, i: number) => {
                    const isSelected = selectedIds.includes(family._id);
                    return (
                      <motion.tr
                        key={family._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className={cn('group', isSelected && 'bg-emerald-50/50 dark:bg-emerald-950/20')}
                      >
                        <td className="pl-6">
                          <button onClick={() => toggleSelectRow(family._id)} className="p-1 cursor-pointer">
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </td>
                        <td>
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
                          <span
                            className={cn(
                              'text-sm font-semibold',
                              family.outstandingBalance > 0 ? 'text-red-500' : 'text-emerald-600'
                            )}
                          >
                            {formatCurrency(family.outstandingBalance || 0)}
                          </span>
                        </td>
                        <td className="pr-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                            <Link href={`/families/${family._id}`}>
                              <button className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 transition-colors" title="View Family">
                                <Eye size={15} />
                              </button>
                            </Link>

                            <button
                              onClick={() => setDeletingFamily(family)}
                              className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 transition-colors cursor-pointer"
                              title="Delete Family"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, pagination.total)} of {pagination.total} families
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-xs font-medium">Show:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
                >
                  {[10, 20, 50, 80, 100, 200].map((count) => (
                    <option key={count} value={count}>
                      {count} per page
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!(pagination.hasPrev ?? page > 1)}
                className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Previous
              </button>
              <span className="text-xs font-medium px-2.5 py-1.5 bg-muted rounded-lg text-foreground">
                Page {page} of {pagination.totalPages || 1}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!(pagination.hasNext ?? page * limit < pagination.total)}
                className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Single Family Confirmation Modal */}
      {deletingFamily && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-bold text-lg text-rose-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Confirm Family Deletion
              </h2>
              <button onClick={() => setDeletingFamily(null)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <p className="text-sm text-foreground leading-relaxed">
              Are you sure you want to delete family <strong className="text-rose-600">{deletingFamily.familyCode}</strong> (Head: {deletingFamily.headMemberId?.name || 'N/A'})?
            </p>
            <p className="text-xs text-muted-foreground bg-muted p-3 rounded-xl">
              ⚠️ Warning: Deleting this family record cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setDeletingFamily(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deletingFamily._id)}
                disabled={deleteMutation.isPending}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Family'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {isBulkEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Edit className="h-5 w-5 text-emerald-600" />
                Bulk Edit {selectedIds.length} Families
              </h2>
              <button onClick={() => setIsBulkEditOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Ward Number</label>
                <input
                  type="text"
                  placeholder="Leave blank to keep unchanged"
                  value={bulkWardNo}
                  onChange={(e) => setBulkWardNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsBulkEditOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
                >
                  Apply Bulk Updates
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-bold text-lg text-rose-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Confirm Bulk Deletion
              </h2>
              <button onClick={() => setIsBulkDeleteConfirmOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <p className="text-sm text-foreground leading-relaxed">
              Are you sure you want to delete <strong className="text-rose-600">{selectedIds.length} selected families</strong>?
            </p>
            <p className="text-xs text-muted-foreground bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl text-rose-700 dark:text-rose-400 font-semibold">
              ⚠️ Permanent Action: All {selectedIds.length} family records will be removed immediately.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsBulkDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteSubmit}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
              >
                Confirm Bulk Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
