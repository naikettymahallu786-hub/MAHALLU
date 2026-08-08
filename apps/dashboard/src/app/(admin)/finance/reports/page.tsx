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
  RefreshCw,
  FileText,
  CreditCard,
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

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'donation', label: 'General Donation' },
  { value: 'recurring_donation', label: 'Recurring Donation' },
  { value: 'property_rent', label: 'Property Rent' },
  { value: 'certificate_fee', label: 'Certificate Fee' },
  { value: 'nikah_fee', label: 'Nikah Fee' },
  { value: 'zakat', label: 'Sadaqah / Zakat' },
  { value: 'other', label: 'Other Receipt' },
];

const METHOD_OPTIONS = [
  { value: 'all', label: 'All Methods' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI / QR' },
  { value: 'razorpay', label: 'Razorpay Online' },
  { value: 'cheque', label: 'Cheque' },
];

export default function FullFinanceReportsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number | string>(20);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [gateway, setGateway] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const queryParams: Record<string, any> = {
    page,
    limit,
    search: search || undefined,
    paymentStatus,
    category,
    gateway,
  };

  if (startDate) queryParams.startDate = startDate;
  if (endDate) queryParams.endDate = endDate;
  if (!startDate && !endDate) {
    if (selectedYear) queryParams.year = selectedYear;
    if (selectedMonth && selectedMonth !== 'all') queryParams.month = selectedMonth;
  }

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['full-finance-reports', queryParams],
    queryFn: () =>
      apiClient.get('/payments/reports/finance', { params: queryParams }).then((r) => r.data.data),
  });

  const summary = reportData?.summary || {
    totalTransactions: 0,
    totalIncome: 0,
    pendingAmount: 0,
    completedCount: 0,
    pendingCount: 0,
    failedCount: 0,
    avgTransaction: 0,
  };

  const items = reportData?.items || [];
  const pagination = reportData?.pagination;

  const handleResetFilters = () => {
    setPage(1);
    setSearch('');
    setPaymentStatus('all');
    setCategory('all');
    setGateway('all');
    setSelectedMonth('all');
    setSelectedYear(String(CURRENT_YEAR));
    setStartDate('');
    setEndDate('');
  };

  const handleDownloadCSV = async () => {
    try {
      setIsDownloading(true);
      const downloadParams = { ...queryParams, format: 'csv' };

      const response = await apiClient.get('/payments/reports/finance', {
        params: downloadParams,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `full_finance_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Full finance report downloaded successfully');
    } catch (err) {
      toast.error('Failed to download report');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <DollarSign className="h-4 w-4" />
            Comprehensive Financial Ledger
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Full Finance & Income Report</h1>
          <p className="text-emerald-100/80 text-sm mt-1">
            Detailed breakdown of all receipts, donations, rents, zakat, and fee collections across your Mahallu.
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
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Collected Revenue</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 rounded-xl">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{formatCurrency(summary.totalIncome)}</div>
          <p className="text-xs text-muted-foreground mt-1">{summary.completedCount} completed transactions</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Amount</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 dark:bg-amber-950/40 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">{formatCurrency(summary.pendingAmount)}</div>
          <p className="text-xs text-muted-foreground mt-1">{summary.pendingCount} pending payments</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Transactions</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-950/40 rounded-xl">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-2">{summary.totalTransactions}</div>
          <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Transaction</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 dark:bg-purple-950/40 rounded-xl">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-2">{formatCurrency(summary.avgTransaction)}</div>
          <p className="text-xs text-muted-foreground mt-1">Per successful receipt</p>
        </motion.div>
      </div>

      {/* Filter Control Section */}
      <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Filter className="h-4 w-4 text-emerald-600" />
            Filter Financial Data
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
                placeholder="Receipt #, Payment #, Name, Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Category / Type</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Categories & Campaigns</option>
              {((reportData?.categories && reportData.categories.length > 0)
                ? reportData.categories
                : [
                    'General Sadaqah',
                    'Recurring Donation',
                    'Mosque Renovation',
                    'Orphan Support',
                    'Madrasa Fund',
                    'Property Rent',
                    'Certificate Fee',
                    'Nikah Fee',
                    'donation',
                  ]
              ).map((cat: string) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
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
              <option value="completed">Completed / Paid</option>
              <option value="unpaid">Unpaid Dues</option>
              <option value="overdue">Overdue Dues</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Method / Gateway */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Payment Method</label>
            <select
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {METHOD_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Distance & Range Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-border/50">
          {/* Year */}
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

          {/* Month */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Month</label>
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
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">End Date</label>
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
            <h2 className="font-bold text-lg text-foreground">Financial Transactions Ledger</h2>
            <p className="text-xs text-muted-foreground">Showing {items.length} records matching your filter criteria</p>
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
            Generating full financial report...
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold text-foreground text-base">No financial records found</h3>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your date range, category, or filter options.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-bold">
                <tr>
                  <th className="px-6 py-4">Receipt #</th>
                  <th className="px-6 py-4">Payment # & Date</th>
                  <th className="px-6 py-4">Payer Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item: any) => (
                  <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                      {item.receiptNo}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{item.paymentNo}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{item.payerName}</div>
                      <div className="text-xs text-muted-foreground">{item.payerPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {item.category?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-muted-foreground uppercase text-xs">
                      {item.gateway?.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-foreground">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(item.status === 'completed' || item.status === 'PAID') && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                        </span>
                      )}
                      {(item.status === 'unpaid' || item.status === 'pending') && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                          <Clock className="h-3.5 w-3.5" /> Unpaid / Pending
                        </span>
                      )}
                      {item.status === 'overdue' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300">
                          <AlertTriangle className="h-3.5 w-3.5" /> Overdue Dues
                        </span>
                      )}
                      {item.status === 'failed' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300">
                          <AlertTriangle className="h-3.5 w-3.5" /> Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination && pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border bg-card">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>
                Showing{' '}
                {limit === 'all'
                  ? `1–${pagination.total}`
                  : `${(page - 1) * Number(limit) + 1}–${Math.min(page * Number(limit), pagination.total)}`}{' '}
                of {pagination.total} financial records
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-xs font-medium">Show:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setLimit(val);
                    setPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
                >
                  {[10, 20, 50, 80, 100, 200].map((count) => (
                    <option key={count} value={count}>
                      {count} per page
                    </option>
                  ))}
                  <option value="all">Show All</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!(pagination.hasPrev ?? page > 1) || limit === 'all'}
                className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-bold disabled:opacity-40 hover:bg-muted transition-colors cursor-pointer"
              >
                Previous
              </button>

              <span className="text-xs font-bold px-3 py-1.5 bg-muted rounded-xl text-foreground">
                Page {page} of {pagination.totalPages || 1}
              </span>

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!(pagination.hasNext ?? page < pagination.totalPages) || limit === 'all'}
                className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-bold disabled:opacity-40 hover:bg-muted transition-colors cursor-pointer"
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
