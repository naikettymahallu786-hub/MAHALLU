'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Calendar,
  Search,
  DollarSign,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

const MONTH_NAMES = [
  { value: 'all', label: 'All Months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export default function RecurringDonationReportsPage() {
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [recurringType, setRecurringType] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const queryParams: Record<string, any> = {
    search: search || undefined,
    paymentStatus,
    recurringType,
  };

  if (startDate) queryParams.startDate = startDate;
  if (endDate) queryParams.endDate = endDate;
  if (!startDate && !endDate) {
    if (selectedYear) queryParams.year = selectedYear;
    if (selectedMonth && selectedMonth !== 'all') queryParams.month = selectedMonth;
  }

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['recurring-reports', queryParams],
    queryFn: () =>
      apiClient.get('/families/reports/recurring', { params: queryParams }).then((r) => r.data.data),
  });

  const summary = reportData?.summary || {
    totalCount: 0,
    totalExpected: 0,
    totalOutstanding: 0,
    paidCount: 0,
    unpaidCount: 0,
    overdueCount: 0,
  };

  const items = reportData?.items || [];

  const handleResetFilters = () => {
    setSearch('');
    setPaymentStatus('all');
    setRecurringType('all');
    setSelectedMonth('all');
    setSelectedYear(String(CURRENT_YEAR));
    setStartDate('');
    setEndDate('');
  };

  const handleDownloadCSV = async () => {
    try {
      setIsDownloading(true);
      const downloadParams = { ...queryParams, format: 'csv' };

      const response = await apiClient.get('/families/reports/recurring', {
        params: downloadParams,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recurring_donations_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully');
    } catch (err) {
      toast.error('Failed to download report');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-3xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Calendar className="h-4 w-4" />
            Financial Intelligence & Reports
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Recurring Donation Reports</h1>
          <p className="text-emerald-100/80 text-sm mt-1">
            Filter, analyze, and export family recurring donation records by month, year, or date range.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadCSV}
            disabled={isDownloading || items.length === 0}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-md transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Downloading...' : 'Export Filtered CSV'}
          </button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Expected</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 rounded-xl">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-2">{formatCurrency(summary.totalExpected)}</div>
          <p className="text-xs text-muted-foreground mt-1">{summary.totalCount} active families</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Dues</span>
            <div className="p-2.5 bg-red-50 text-red-600 dark:bg-red-950/40 rounded-xl">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-2">{formatCurrency(summary.totalOutstanding)}</div>
          <p className="text-xs text-muted-foreground mt-1">{summary.unpaidCount + summary.overdueCount} families pending</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fully Paid</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{summary.paidCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Families up to date</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overdue Dues</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 dark:bg-amber-950/40 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">{summary.overdueCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Passed due date</p>
        </motion.div>
      </div>

      {/* Filter Control Section */}
      <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Filter className="h-4 w-4 text-emerald-600" />
            Filter & Custom Distance
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Search */}
          <div className="relative">
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Family Code, Name, Phone, Ward..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid (Up to date)</option>
              <option value="unpaid">Unpaid / Dues</option>
              <option value="overdue">Overdue Only</option>
            </select>
          </div>

          {/* Frequency Type */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Frequency</label>
            <select
              value={recurringType}
              onChange={(e) => setRecurringType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Frequencies</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setStartDate('');
                setEndDate('');
              }}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {YEAR_OPTIONS.map((yr) => (
                <option key={yr} value={yr}>
                  Year {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Range & Month Distance Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border/50">
          {/* Month Distance Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Month Distance</label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setStartDate('');
                setEndDate('');
              }}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {MONTH_NAMES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Custom Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Custom End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-foreground">Filtered Recurring Report Records</h2>
            <p className="text-xs text-muted-foreground">Showing {items.length} records matching your filter selections</p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 text-muted-foreground hover:text-foreground rounded-xl border border-border"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-emerald-600" />
            Generating report data...
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold text-foreground text-base">No recurring donation records found</h3>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your date range or filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-bold">
                <tr>
                  <th className="px-6 py-4">Family Code</th>
                  <th className="px-6 py-4">Head of Family</th>
                  <th className="px-6 py-4">Ward</th>
                  <th className="px-6 py-4">Frequency</th>
                  <th className="px-6 py-4 text-right">Recurring Rate</th>
                  <th className="px-6 py-4 text-right">Pending Dues</th>
                  <th className="px-6 py-4">Next Due Date</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item: any) => (
                  <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-extrabold text-foreground">{item.familyCode}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{item.headName}</div>
                      <div className="text-xs text-muted-foreground">{item.headPhone}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-muted-foreground">Ward {item.wardNo}</td>
                    <td className="px-6 py-4">
                      <span className="capitalize px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {item.recurringType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-foreground">
                      {formatCurrency(item.recurringAmount)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold">
                      <span className={item.outstandingBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {formatCurrency(item.outstandingBalance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-muted-foreground">
                      {item.nextPaymentDueDate ? formatDate(item.nextPaymentDueDate) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.status === 'PAID' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                        </span>
                      )}
                      {item.status === 'UNPAID' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                          <Clock className="h-3.5 w-3.5" /> Unpaid
                        </span>
                      )}
                      {item.status === 'OVERDUE' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300">
                          <AlertTriangle className="h-3.5 w-3.5" /> Overdue
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
