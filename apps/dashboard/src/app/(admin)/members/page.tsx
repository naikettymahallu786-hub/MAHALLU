'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Download, QrCode, Users, UserCheck, UserX, Eye, Edit, Trash2, CheckSquare, Square, RefreshCw, X } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { toast } from 'sonner';

const STATUS_COLORS = {
  active: 'badge-active',
  inactive: 'badge-inactive',
  deceased: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  migrated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function MembersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [gender, setGender] = useState('');

  // Bulk Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingMember, setDeletingMember] = useState<any | null>(null);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  // Bulk Edit Form State
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkGender, setBulkGender] = useState('');
  const [bulkBloodGroup, setBulkBloodGroup] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['members', page, limit, search, status, gender],
    queryFn: () =>
      apiClient
        .get('/members', {
          params: { page, limit, search, status, gender },
        })
        .then((r) => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['member-stats'],
    queryFn: () => apiClient.get('/members/stats').then((r) => r.data.data),
  });

  const members = data?.data || [];
  const pagination = data?.pagination;

  // Single Member Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/members/${id}`),
    onSuccess: () => {
      toast.success('Member record deleted successfully.');
      setDeletingMember(null);
      queryClient.invalidateQueries({ queryKey: ['members'] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete member');
    },
  });

  // Bulk Selection Handlers
  const isAllSelected = members.length > 0 && members.every((m: any) => selectedIds.includes(m._id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(members.map((m: any) => m._id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk Edit Submit
  const handleBulkEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    const toastId = toast.loading(`Updating ${selectedIds.length} members...`);
    try {
      const updateData: Record<string, any> = {};
      if (bulkStatus) updateData.status = bulkStatus;
      if (bulkGender) updateData.gender = bulkGender;
      if (bulkBloodGroup) updateData.bloodGroup = bulkBloodGroup;

      await Promise.all(
        selectedIds.map((id) => apiClient.put(`/members/${id}`, updateData))
      );

      toast.dismiss(toastId);
      toast.success(`Successfully updated ${selectedIds.length} members.`);
      setIsBulkEditOpen(false);
      setSelectedIds([]);
      setBulkStatus('');
      setBulkGender('');
      setBulkBloodGroup('');
      queryClient.invalidateQueries({ queryKey: ['members'] });
      refetch();
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('Failed to perform bulk update.');
    }
  };

  // Bulk Delete Submit
  const handleBulkDeleteSubmit = async () => {
    if (selectedIds.length === 0) return;

    const toastId = toast.loading(`Deleting ${selectedIds.length} members...`);
    try {
      await Promise.all(selectedIds.map((id) => apiClient.delete(`/members/${id}`)));

      toast.dismiss(toastId);
      toast.success(`Successfully deleted ${selectedIds.length} members.`);
      setIsBulkDeleteConfirmOpen(false);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['members'] });
      refetch();
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('Failed to delete selected members.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('members.title')}</h1>
          <p className="page-subtitle">{t('members.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const csvContent = [
                ['Name', 'Member ID', 'Phone', 'Gender', 'Status'].join(','),
                ...members.map((m: any) =>
                  [
                    m.name || '',
                    m.memberId || '',
                    m.phone || '',
                    m.gender || '',
                    m.status || '',
                  ].join(',')
                ),
              ].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `members_export_${Date.now()}.csv`;
              a.click();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
          >
            <Download size={16} />
            {t('members.export')}
          </button>
          <Link href="/members/new">
            <button id="add-member-btn" className="btn-brand flex items-center gap-2">
              <Plus size={16} />
              {t('members.addMember')}
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('members.totalMembers'), value: stats?.total || 0, icon: Users, color: '#3b82f6' },
          { label: t('members.active'), value: stats?.active || 0, icon: UserCheck, color: '#059669' },
          { label: t('members.male'), value: stats?.male || 0, icon: Users, color: '#6366f1' },
          { label: t('members.female'), value: stats?.female || 0, icon: Users, color: '#ec4899' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="section-card flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15` }}>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters & Bulk Actions */}
      <div className="space-y-4">
        <div className="section-card">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('members.search')}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-medium"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="deceased">Deceased</option>
              <option value="migrated">Migrated</option>
            </select>
            <select
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-medium"
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
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
              <p className="text-xs text-slate-300">Choose a bulk action for selected members</p>
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

              <button onClick={() => setSelectedIds([])} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Members Table */}
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
                  <th>{t('members.name')}</th>
                  <th>{t('members.id')}</th>
                  <th>{t('members.phone')}</th>
                  <th>{t('members.gender')}</th>
                  <th>{t('members.occupation')}</th>
                  <th>{t('members.status')}</th>
                  <th className="pr-6 text-right">{t('members.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Users size={40} className="mx-auto mb-3 opacity-30" />
                      <p>{t('members.noMembers')}</p>
                    </td>
                  </tr>
                ) : (
                  members.map((member: any, i: number) => {
                    const isSelected = selectedIds.includes(member._id);
                    return (
                      <motion.tr
                        key={member._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className={cn('group', isSelected && 'bg-emerald-50/50 dark:bg-emerald-950/20')}
                      >
                        <td className="pl-6">
                          <button onClick={() => toggleSelectRow(member._id)} className="p-1 cursor-pointer">
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                              {member.photoUrl ? (
                                <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                <div>{member.name[0].toUpperCase()}</div>
                              )}
                            </div>
                            <span className="font-medium text-foreground">{member.name}</span>
                          </div>
                        </td>
                        <td>
                          <code className="text-xs bg-muted px-2 py-0.5 rounded-md font-bold">{member.memberId}</code>
                        </td>
                        <td className="text-muted-foreground text-sm">{member.phone}</td>
                        <td>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full capitalize font-medium',
                              member.gender === 'male'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                            )}
                          >
                            {member.gender === 'male'
                              ? t('members.male')
                              : member.gender === 'female'
                              ? t('members.female')
                              : member.gender}
                          </span>
                        </td>
                        <td className="text-sm text-muted-foreground">{member.occupation || '—'}</td>
                        <td>
                          <span
                            className={cn(
                              'text-xs px-2.5 py-1 rounded-full font-medium capitalize',
                              STATUS_COLORS[member.status as keyof typeof STATUS_COLORS] || 'badge-inactive'
                            )}
                          >
                            {member.status === 'active' ? t('members.active') : member.status}
                          </span>
                        </td>
                        <td className="pr-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                            <Link href={`/members/${member._id}`}>
                              <button className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 transition-colors" title="View Member">
                                <Eye size={15} />
                              </button>
                            </Link>
                            <Link href={`/members/${member._id}/edit`}>
                              <button className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 transition-colors" title="Edit Member">
                                <Edit size={15} />
                              </button>
                            </Link>

                            <button
                              onClick={() => setDeletingMember(member)}
                              className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 transition-colors cursor-pointer"
                              title="Delete Member"
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
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, pagination.total)} of {pagination.total} members
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

      {/* Delete Single Member Confirmation Modal */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-bold text-lg text-rose-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Confirm Member Deletion
              </h2>
              <button onClick={() => setDeletingMember(null)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <p className="text-sm text-foreground leading-relaxed">
              Are you sure you want to delete member <strong className="text-rose-600">{deletingMember.name}</strong> ({deletingMember.memberId || 'N/A'})?
            </p>
            <p className="text-xs text-muted-foreground bg-muted p-3 rounded-xl">
              ⚠️ Warning: Deleting this member record cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deletingMember._id)}
                disabled={deleteMutation.isPending}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Member'}
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
                Bulk Edit {selectedIds.length} Members
              </h2>
              <button onClick={() => setIsBulkEditOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Status</label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm"
                >
                  <option value="">Keep Unchanged</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="migrated">Migrated</option>
                  <option value="deceased">Deceased</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Gender</label>
                <select
                  value={bulkGender}
                  onChange={(e) => setBulkGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm"
                >
                  <option value="">Keep Unchanged</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
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
              Are you sure you want to delete <strong className="text-rose-600">{selectedIds.length} selected members</strong>?
            </p>
            <p className="text-xs text-muted-foreground bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl text-rose-700 dark:text-rose-400 font-semibold">
              ⚠️ Permanent Action: All {selectedIds.length} member records will be removed immediately.
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
