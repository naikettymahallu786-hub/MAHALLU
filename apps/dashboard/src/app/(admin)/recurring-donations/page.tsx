'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Search,
  DollarSign,
  Bell,
  Loader2,
  X,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Users,
  Sparkles,
  CheckSquare,
  Square,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n/useTranslation';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function RecurringDonationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [search, setSearch] = useState('');

  // Collect Payment Modal States
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentGateway, setPaymentGateway] = useState('cash');
  const [paymentDescription, setPaymentDescription] = useState('');

  // Configure Single Family Schedule Modal States
  const [editScheduleFamily, setEditScheduleFamily] = useState<any>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState<'monthly' | 'yearly' | 'none'>('monthly');
  const [scheduleAmount, setScheduleAmount] = useState('');
  const [scheduleDay, setScheduleDay] = useState(1);
  const [scheduleMonth, setScheduleMonth] = useState(1);
  const [markPending, setMarkPending] = useState(false);

  // Bulk Assign Recurring Donation Modal States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignType, setAssignType] = useState<'monthly' | 'yearly'>('monthly');
  const [assignAmount, setAssignAmount] = useState('100');
  const [assignDay, setAssignDay] = useState(1);
  const [assignMonth, setAssignMonth] = useState(1);
  const [assignMarkPending, setAssignMarkPending] = useState(true);
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]);
  const [isAllFamiliesSelected, setIsAllFamiliesSelected] = useState(false);
  const [familySearchFilter, setFamilySearchFilter] = useState('');

  const { data: familiesData, isLoading } = useQuery({
    queryKey: ['recurring-families', search],
    queryFn: () =>
      apiClient
        .get('/families', {
          params: { search, limit: 1000 },
        })
        .then((r) => r.data.data || []),
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const families = familiesData || [];

  // Filtered family list for modal selection
  const modalFamilies = families.filter((f: any) => {
    if (!familySearchFilter) return true;
    const q = familySearchFilter.toLowerCase();
    return (
      f.familyCode?.toLowerCase().includes(q) ||
      f.headMemberId?.name?.toLowerCase().includes(q) ||
      f.headMemberId?.phone?.includes(q)
    );
  });

  const remindMutation = useMutation({
    mutationFn: (familyId: string) => apiClient.post(`/families/${familyId}/remind-recurring`),
    onSuccess: (data) => toast.success(data?.data?.message || 'Reminder sent successfully'),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to send reminder'),
  });

  const updateScheduleMutation = useMutation({
    mutationFn: (data: any) => apiClient.put(`/families/${editScheduleFamily._id}`, data),
    onSuccess: () => {
      toast.success('Recurring donation schedule updated successfully');
      setIsScheduleModalOpen(false);
      setEditScheduleFamily(null);
      queryClient.invalidateQueries({ queryKey: ['recurring-families'] });
      queryClient.invalidateQueries({ queryKey: ['families'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update schedule'),
  });

  const bulkAssignMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/families/bulk-assign-recurring', data),
    onSuccess: (data) => {
      toast.success(data?.data?.message || 'Recurring donation assigned successfully!');
      setIsAssignModalOpen(false);
      setSelectedFamilyIds([]);
      setIsAllFamiliesSelected(false);
      queryClient.invalidateQueries({ queryKey: ['recurring-families'] });
      queryClient.invalidateQueries({ queryKey: ['families'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to assign recurring donation'),
  });

  const collectMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/receipts/manual', data),
    onSuccess: () => {
      toast.success('Payment logged & receipt generated successfully');
      setIsPaymentModalOpen(false);
      setSelectedFamily(null);
      setPaymentAmount('');
      setPaymentDescription('');
      queryClient.invalidateQueries({ queryKey: ['recurring-families'] });
      queryClient.invalidateQueries({ queryKey: ['families'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['finance-kpis'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to log payment'),
  });

  // Helper to calculate due status
  const getDueStatus = (nextDueDateStr?: string) => {
    if (!nextDueDateStr)
      return {
        status: 'NORMAL',
        label: 'Upcoming',
        badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
      };
    const dueDate = new Date(nextDueDateStr);
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return {
        status: 'OVERDUE',
        label: `Overdue (${Math.abs(diffDays)}d)`,
        badge: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
      };
    }
    if (diffDays <= 7) {
      return {
        status: 'DUE_SOON',
        label: `Due in ${diffDays}d`,
        badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
      };
    }
    return {
      status: 'NORMAL',
      label: 'Upcoming',
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    };
  };

  const filteredFamilies = families.filter((f: any) => {
    if (!f.recurringDonationType || f.recurringDonationType === 'none') return false;
    if (filterType && f.recurringDonationType !== filterType) return false;

    const dueInfo = getDueStatus(f.nextPaymentDueDate);

    if (paymentStatus === 'paid') return (f.outstandingBalance || 0) <= 0;
    if (paymentStatus === 'unpaid') return (f.outstandingBalance || 0) > 0;
    if (paymentStatus === 'overdue') return dueInfo.status === 'OVERDUE';

    return true;
  });

  // Analytics
  const monthlyTotal = families
    .filter((f: any) => f.recurringDonationType === 'monthly')
    .reduce((sum: number, f: any) => sum + (f.recurringDonationAmount || 0), 0);

  const yearlyTotal = families
    .filter((f: any) => f.recurringDonationType === 'yearly')
    .reduce((sum: number, f: any) => sum + (f.recurringDonationAmount || 0), 0);

  const totalPending = families
    .filter((f: any) => f.recurringDonationType && f.recurringDonationType !== 'none')
    .reduce((sum: number, f: any) => sum + (f.outstandingBalance || 0), 0);

  const openScheduleModal = (family: any) => {
    setEditScheduleFamily(family);
    setScheduleType(family.recurringDonationType || 'monthly');
    setScheduleAmount(String(family.recurringDonationAmount || 0));
    setScheduleDay(family.recurringPaymentDay || 1);
    setScheduleMonth(family.recurringPaymentMonth || 1);
    setMarkPending((family.outstandingBalance || 0) > 0);
    setIsScheduleModalOpen(true);
  };

  const toggleSelectFamily = (id: string) => {
    if (selectedFamilyIds.includes(id)) {
      setSelectedFamilyIds(selectedFamilyIds.filter((item) => item !== id));
      setIsAllFamiliesSelected(false);
    } else {
      setSelectedFamilyIds([...selectedFamilyIds, id]);
    }
  };

  const toggleSelectAllFamilies = () => {
    if (isAllFamiliesSelected) {
      setIsAllFamiliesSelected(false);
      setSelectedFamilyIds([]);
    } else {
      setIsAllFamiliesSelected(true);
      setSelectedFamilyIds(families.map((f: any) => f._id));
    }
  };

  const handleExecuteAssign = () => {
    if (!isAllFamiliesSelected && selectedFamilyIds.length === 0) {
      return toast.error('Please select at least one family or choose ALL Families');
    }

    bulkAssignMutation.mutate({
      familyIds: isAllFamiliesSelected ? [] : selectedFamilyIds,
      isAllFamilies: isAllFamiliesSelected,
      recurringDonationType: assignType,
      recurringDonationAmount: Number(assignAmount || 0),
      recurringPaymentDay: assignDay,
      recurringPaymentMonth: assignMonth,
      markPending: assignMarkPending,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{t('recurring_donations_page.title')}</h1>
          <p className="page-subtitle">{t('recurring_donations_page.subtitle')}</p>
        </div>

        <button
          onClick={() => {
            setSelectedFamilyIds([]);
            setIsAllFamiliesSelected(false);
            setIsAssignModalOpen(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm px-5 py-3 rounded-2xl shadow-lg transition-all cursor-pointer"
        >
          <Plus size={18} />
          Assign Recurring Donation (ആവർത്തന സംഭാവന)
        </button>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-card flex items-center gap-4 animate-count"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/30">
            <DollarSign size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{formatCurrency(monthlyTotal)}</p>
            <p className="text-xs text-muted-foreground">{t('recurring_donations_page.expectedMonthly')}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="section-card flex items-center gap-4 animate-count"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 dark:bg-blue-950/30">
            <Calendar size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{formatCurrency(yearlyTotal)}</p>
            <p className="text-xs text-muted-foreground">{t('recurring_donations_page.expectedYearly')}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="section-card flex items-center gap-4 animate-count"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-100 dark:bg-red-950/30">
            <Bell size={18} className="text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalPending)}</p>
            <p className="text-xs text-muted-foreground">{t('recurring_donations_page.totalPending')}</p>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="section-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('recurring_donations_page.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">{t('recurring_donations_page.allFrequencies')}</option>
            <option value="monthly">{t('recurring_donations_page.monthlySubscriptions')}</option>
            <option value="yearly">{t('recurring_donations_page.yearlyDonations')}</option>
          </select>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
          >
            <option value="all">All Payment Statuses</option>
            <option value="unpaid">Unpaid Dues</option>
            <option value="overdue">Overdue Payments</option>
            <option value="paid">Paid & Settled</option>
          </select>
        </div>
      </div>

      {/* Recurring Donations Table */}
      <div className="section-card overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl shimmer" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="pl-6">{t('recurring_donations_page.familyCode')}</th>
                  <th>{t('recurring_donations_page.familyHead')}</th>
                  <th>Payment Schedule</th>
                  <th>Next Due Date</th>
                  <th>{t('recurring_donations_page.configuredAmount')}</th>
                  <th>{t('recurring_donations_page.outstandingBalance')}</th>
                  <th className="pr-6">{t('recurring_donations_page.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredFamilies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                      <p>No families found matching current filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredFamilies.map((family: any, i: number) => {
                    const dueInfo = getDueStatus(family.nextPaymentDueDate);
                    const isMonthly = family.recurringDonationType === 'monthly';
                    const scheduleText = isMonthly
                      ? `${family.recurringPaymentDay || 1}${getOrdinal(family.recurringPaymentDay || 1)} of every month`
                      : `${family.recurringPaymentDay || 1} ${MONTH_NAMES[(family.recurringPaymentMonth || 1) - 1]} (Yearly)`;

                    return (
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
                          <div>
                            <span className="font-semibold text-foreground block">
                              {family.headMemberId?.name || 'Unknown Head'}
                            </span>
                            <span className="text-xs text-muted-foreground">{family.headMemberId?.phone || '—'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="space-y-0.5">
                            <span
                              className={cn(
                                'text-xs px-2 py-0.5 rounded-full font-semibold capitalize inline-block',
                                isMonthly
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                              )}
                            >
                              {family.recurringDonationType}
                            </span>
                            <p className="text-xs font-medium text-muted-foreground">{scheduleText}</p>
                          </div>
                        </td>
                        <td>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-foreground">
                              {family.nextPaymentDueDate ? formatDate(family.nextPaymentDueDate) : 'N/A'}
                            </p>
                            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold inline-block', dueInfo.badge)}>
                              {dueInfo.label}
                            </span>
                          </div>
                        </td>
                        <td className="text-sm font-semibold text-foreground">
                          {formatCurrency(family.recurringDonationAmount || 0)}
                        </td>
                        <td>
                          <span
                            className={cn(
                              'text-sm font-bold',
                              (family.outstandingBalance || 0) > 0 ? 'text-red-500' : 'text-emerald-600'
                            )}
                          >
                            {formatCurrency(family.outstandingBalance || 0)}
                          </span>
                        </td>
                        <td className="pr-6">
                          <div className="flex items-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openScheduleModal(family)}
                              title="Configure Due Schedule"
                              className="p-1.5 rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
                            >
                              <Edit3 size={14} />
                            </button>
                            {(family.outstandingBalance || 0) > 0 && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedFamily(family);
                                    setPaymentAmount(
                                      String(family.outstandingBalance || family.recurringDonationAmount || 0)
                                    );
                                    setIsPaymentModalOpen(true);
                                  }}
                                  className="flex items-center gap-1 text-xs text-emerald-600 hover:underline font-bold"
                                >
                                  <DollarSign size={13} />
                                  Collect
                                </button>
                                <button
                                  onClick={() => remindMutation.mutate(family._id)}
                                  disabled={remindMutation.isPending && remindMutation.variables === family._id}
                                  className="flex items-center gap-1 text-xs text-amber-600 hover:underline font-bold disabled:opacity-50"
                                >
                                  {remindMutation.isPending && remindMutation.variables === family._id ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <Bell size={13} />
                                  )}
                                  Remind
                                </button>
                              </>
                            )}
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
      </div>

      {/* Assign Recurring Donation Modal (Bulk / Multiple Selection) */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border overflow-hidden flex flex-col my-8"
            >
              {/* Modal Header */}
              <div className="p-5 border-b bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="h-4 w-4" />
                    Assign Recurring Donation Schedule
                  </div>
                  <h2 className="font-extrabold text-xl text-white mt-0.5">
                    Assign Recurring Donation (ആവർത്തന സംഭാവന)
                  </h2>
                </div>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full text-white cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* 1. Frequency Picker */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-2">
                    1. Select Donation Frequency (ആവൃത്തി / കാലയളവ്) *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAssignType('monthly')}
                      className={cn(
                        'p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer',
                        assignType === 'monthly'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-extrabold shadow-md'
                          : 'border-border bg-background hover:bg-muted text-muted-foreground'
                      )}
                    >
                      <Calendar className="h-6 w-6 mb-1 text-emerald-600" />
                      <span>Monthly (മാസാന്തം)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignType('yearly')}
                      className={cn(
                        'p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer',
                        assignType === 'yearly'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-extrabold shadow-md'
                          : 'border-border bg-background hover:bg-muted text-muted-foreground'
                      )}
                    >
                      <Clock className="h-6 w-6 mb-1 text-blue-600" />
                      <span>Yearly (വാർഷികം)</span>
                    </button>
                  </div>
                </div>

                {/* 2. Donation Amount / Price */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-2">
                    2. Donation Price / Amount (സംഭാവന തുക - ₹) *
                  </label>

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['50', '100', '250', '500', '1000', '2500'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAssignAmount(preset)}
                        className={cn(
                          'px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer',
                          assignAmount === preset
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                            : 'bg-muted border-border text-foreground hover:bg-muted/80'
                        )}
                      >
                        ₹{preset}
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    value={assignAmount}
                    onChange={(e) => setAssignAmount(e.target.value)}
                    placeholder="Enter donation amount (e.g. 500)"
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-base font-extrabold"
                  />
                </div>

                {/* 3. Payment Billing Schedule Day / Month */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-2">
                      3. Day of the Month *
                    </label>
                    <select
                      value={assignDay}
                      onChange={(e) => setAssignDay(Number(e.target.value))}
                      className="w-full px-3.5 py-3 rounded-2xl border border-border bg-background text-sm font-bold"
                    >
                      {Array.from({ length: 31 }, (_, idx) => idx + 1).map((day) => (
                        <option key={day} value={day}>
                          {day}
                          {getOrdinal(day)} of the month
                        </option>
                      ))}
                    </select>
                  </div>

                  {assignType === 'yearly' && (
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-2">
                        Payment Month of Year *
                      </label>
                      <select
                        value={assignMonth}
                        onChange={(e) => setAssignMonth(Number(e.target.value))}
                        className="w-full px-3.5 py-3 rounded-2xl border border-border bg-background text-sm font-bold"
                      >
                        {MONTH_NAMES.map((mName, idx) => (
                          <option key={idx + 1} value={idx + 1}>
                            {mName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 4. Multiple Selection of Families */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      4. Select Families (കുടുംബങ്ങൾ തിരഞ്ഞെടുക്കുക) *
                    </label>

                    {/* ALL FAMILIES Toggle Button */}
                    <button
                      type="button"
                      onClick={toggleSelectAllFamilies}
                      className={cn(
                        'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer',
                        isAllFamiliesSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                      )}
                    >
                      <Users size={14} />
                      {isAllFamiliesSelected
                        ? '👥 ALL FAMILIES Selected'
                        : '👥 Select ALL Families (Entire Mahallu)'}
                    </button>
                  </div>

                  {/* Family Filter Input */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search family by code, head name, or phone..."
                      value={familySearchFilter}
                      onChange={(e) => setFamilySearchFilter(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-xs font-medium"
                    />
                  </div>

                  {/* Family Selection Counter Badge */}
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between bg-emerald-50/70 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
                    <span>
                      {isAllFamiliesSelected
                        ? `Selected ALL ${families.length} Families in Mahallu`
                        : `Selected ${selectedFamilyIds.length} of ${families.length} Families`}
                    </span>
                    {selectedFamilyIds.length > 0 && !isAllFamiliesSelected && (
                      <button
                        type="button"
                        onClick={() => setSelectedFamilyIds([])}
                        className="text-[10px] text-rose-600 hover:underline"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>

                  {/* Families List Checkbox Box */}
                  <div className="border border-border rounded-2xl max-h-48 overflow-y-auto divide-y divide-border bg-background">
                    {modalFamilies.map((f: any) => {
                      const isChecked = isAllFamiliesSelected || selectedFamilyIds.includes(f._id);
                      return (
                        <div
                          key={f._id}
                          onClick={() => {
                            if (isAllFamiliesSelected) setIsAllFamiliesSelected(false);
                            toggleSelectFamily(f._id);
                          }}
                          className={cn(
                            'flex items-center justify-between p-3 cursor-pointer transition-colors hover:bg-muted/50',
                            isChecked && 'bg-emerald-50/60 dark:bg-emerald-950/30'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {isChecked ? (
                              <CheckSquare size={18} className="text-emerald-600" />
                            ) : (
                              <Square size={18} className="text-muted-foreground" />
                            )}
                            <div>
                              <p className="text-xs font-bold text-foreground">
                                {f.familyCode} — {f.headMemberId?.name || 'Head Member'}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{f.headMemberId?.phone || 'No Phone'}</p>
                            </div>
                          </div>
                          {f.recurringDonationAmount > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              Curr: ₹{f.recurringDonationAmount}/{f.recurringDonationType || 'm'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mark Dues as Pending Option */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer p-3.5 border rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                    <input
                      type="checkbox"
                      checked={assignMarkPending}
                      onChange={(e) => setAssignMarkPending(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-amber-600 rounded focus:ring-amber-500 accent-amber-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        Mark Current Cycle Dues as Pending Immediately (ബാക്കി കുടിശ്ശിക ആക്കുക)
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Will generate an active pending due balance for selected families so they can pay online or via receipt.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-4 border-t bg-card flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAssign}
                  disabled={bulkAssignMutation.isPending}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  {bulkAssignMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  Assign Recurring Donation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Configure Single Family Schedule Modal */}
      <AnimatePresence>
        {isScheduleModalOpen && editScheduleFamily && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-2xl shadow-xl border overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b flex items-center justify-between bg-card">
                <h2 className="font-bold text-lg">Configure Recurring Schedule</h2>
                <button
                  onClick={() => {
                    setIsScheduleModalOpen(false);
                    setEditScheduleFamily(null);
                  }}
                  className="p-2 hover:bg-muted rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Family</label>
                  <p className="text-sm font-bold bg-muted p-2.5 rounded-xl text-foreground">
                    {editScheduleFamily.familyCode} ({editScheduleFamily.headMemberId?.name || 'Head'})
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Donation Frequency *</label>
                  <select
                    value={scheduleType}
                    onChange={(e: any) => setScheduleType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border bg-background text-sm font-medium"
                  >
                    <option value="monthly">Monthly Subscription</option>
                    <option value="yearly">Yearly Contribution</option>
                    <option value="none">No Recurring Donation</option>
                  </select>
                </div>

                {scheduleType !== 'none' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Configured Amount (INR) *</label>
                      <input
                        type="number"
                        value={scheduleAmount}
                        onChange={(e) => setScheduleAmount(e.target.value)}
                        className="w-full p-2.5 rounded-xl border bg-background text-sm font-semibold"
                        placeholder="e.g. 500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        {scheduleType === 'monthly' ? 'Day of the Month (1 to 31) *' : 'Day of the Month *'}
                      </label>
                      <select
                        value={scheduleDay}
                        onChange={(e) => setScheduleDay(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border bg-background text-sm font-medium"
                      >
                        {Array.from({ length: 31 }, (_, idx) => idx + 1).map((day) => (
                          <option key={day} value={day}>
                            {day}
                            {getOrdinal(day)} of the month
                          </option>
                        ))}
                      </select>
                    </div>

                    {scheduleType === 'yearly' && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Payment Month of Year *</label>
                        <select
                          value={scheduleMonth}
                          onChange={(e) => setScheduleMonth(Number(e.target.value))}
                          className="w-full p-2.5 rounded-xl border bg-background text-sm font-medium"
                        >
                          {MONTH_NAMES.map((mName, idx) => (
                            <option key={idx + 1} value={idx + 1}>
                              {mName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="pt-2">
                      <label className="flex items-start gap-3 cursor-pointer p-3.5 border rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                        <input
                          type="checkbox"
                          checked={markPending}
                          onChange={(e) => setMarkPending(e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-amber-600 rounded focus:ring-amber-500 accent-amber-600"
                        />
                        <div>
                          <div className="text-sm font-bold text-foreground">Mark Dues as Pending (Current Cycle)</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Check this to make this family's recurring donation status Pending / Overdue immediately for
                            this cycle.
                          </div>
                        </div>
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 border-t bg-card flex gap-3">
                <button
                  onClick={() => {
                    setIsScheduleModalOpen(false);
                    setEditScheduleFamily(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    updateScheduleMutation.mutate({
                      recurringDonationType: scheduleType,
                      recurringDonationAmount: Number(scheduleAmount || 0),
                      recurringPaymentDay: scheduleDay,
                      recurringPaymentMonth: scheduleMonth,
                      markPending,
                    })
                  }
                  disabled={updateScheduleMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex justify-center items-center gap-2"
                >
                  {updateScheduleMutation.isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    'Save Schedule'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Collect Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedFamily && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-2xl shadow-xl border overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b flex items-center justify-between bg-card">
                <h2 className="font-bold text-lg">Collect Recurring Payment</h2>
                <button
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setSelectedFamily(null);
                  }}
                  className="p-2 hover:bg-muted rounded-full"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Family Code</label>
                  <p className="text-sm font-bold bg-muted p-2.5 rounded-xl">{selectedFamily.familyCode}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Paid By (Family Head)</label>
                  <p className="text-sm font-bold bg-muted p-2.5 rounded-xl">
                    {selectedFamily.headMemberId?.name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Amount (INR) *</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border text-sm"
                    placeholder="Enter amount..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Payment Method *</label>
                  <select
                    value={paymentGateway}
                    onChange={(e) => setPaymentGateway(e.target.value)}
                    className="w-full p-2.5 rounded-xl border text-sm bg-background"
                  >
                    <option value="cash">Collected By Hand (Cash)</option>
                    <option value="upi">Google Pay / PhonePe / UPI</option>
                    <option value="bank_transfer">Direct Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Description / Note</label>
                  <input
                    type="text"
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl border text-sm"
                    placeholder="e.g. Paid cash for subscription dues"
                  />
                </div>
              </div>
              <div className="p-4 border-t bg-card flex gap-3">
                <button
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setSelectedFamily(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const headId =
                      typeof selectedFamily.headMemberId === 'object'
                        ? selectedFamily.headMemberId?._id
                        : selectedFamily.headMemberId;
                    collectMutation.mutate({
                      amount: Number(paymentAmount),
                      type: 'recurring_donation',
                      familyId: selectedFamily._id,
                      paidById: headId || undefined,
                      paidForId: headId || undefined,
                      gateway: paymentGateway,
                      description:
                        paymentDescription ||
                        `Recurring ${selectedFamily.recurringDonationType} contribution collected by hand`,
                    });
                  }}
                  disabled={collectMutation.isPending || !paymentAmount}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm flex justify-center items-center"
                >
                  {collectMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Log Payment'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getOrdinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
