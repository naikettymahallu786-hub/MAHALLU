'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Heart, DollarSign, UserCheck, Calendar, Download, Search, Filter, RefreshCw, HandHeart } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

const CURRENT_YEAR = new Date().getFullYear();

export default function SadaqahPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);

  // New Sadaqah Form State
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [sadaqahCategory, setSadaqahCategory] = useState('General Sadaqah');
  const [description, setDescription] = useState('');
  const [paymentGateway, setPaymentGateway] = useState('cash');

  // Fetch all members for select dropdown
  const { data: membersData } = useQuery({
    queryKey: ['all-members-list'],
    queryFn: () => apiClient.get('/members', { params: { limit: 5000 } }).then((r) => r.data.data || []),
  });
  const members = Array.isArray(membersData) ? membersData : (membersData as any)?.items || [];

  // Fetch payments for Sadaqah category
  const { data: paymentsData, isLoading, refetch } = useQuery({
    queryKey: ['sadaqah-payments', search, selectedType, startDate, endDate],
    queryFn: () =>
      apiClient.get('/payments/reports/finance', {
        params: {
          category: 'donation',
          search: search || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      }).then((r) => r.data.data?.items || []),
  });

  const sadaqahList = Array.isArray(paymentsData) ? paymentsData : [];

  // Analytics
  const totalCollected = sadaqahList.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const totalContributors = new Set(sadaqahList.map((p: any) => p.headId || p.paidById?._id || p.headName)).size;

  // Record Sadaqah Receipt Mutation
  const recordMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/receipts/manual', data),
    onSuccess: () => {
      toast.success('Sadaqah receipt recorded successfully!');
      setIsCollectModalOpen(false);
      setSelectedMemberId('');
      setAmount('');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['sadaqah-payments'] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to record Sadaqah receipt');
    },
  });

  const handleRecordSadaqah = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    recordMutation.mutate({
      type: 'donation',
      amount: Number(amount),
      paidById: selectedMemberId || undefined,
      paidForId: selectedMemberId || undefined,
      description: `[${sadaqahCategory}] ${description}`.trim(),
      gateway: paymentGateway,
    });
  };

  const handleExportCSV = async () => {
    try {
      const response = await apiClient.get('/payments/reports/finance', {
        params: { category: 'donation', format: 'csv' },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sadaqah_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Sadaqah report CSV downloaded');
    } catch (err) {
      toast.error('Failed to export CSV');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <HandHeart className="h-4 w-4" />
            Voluntary Charity & Relief Fund
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Sadaqah (സ്വദഖ) Ledger</h1>
          <p className="text-emerald-100/80 text-sm mt-1">
            Record, track, and manage voluntary Sadaqah contributions from community members.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCollectModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-md transition-all shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Record Sadaqah Receipt
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Sadaqah Collected', value: formatCurrency(totalCollected), icon: DollarSign, color: '#059669' },
          { label: 'Total Unique Contributors', value: `${totalContributors} Members`, icon: UserCheck, color: '#3b82f6' },
          { label: 'Active Sadaqah Fund', value: formatCurrency(totalCollected), icon: Heart, color: '#e11d48' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border p-5 rounded-3xl flex items-center gap-4 shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${stat.color}15` }}>
              <stat.icon size={22} style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">{stat.label}</p>
              <h3 className="text-xl font-extrabold text-foreground mt-0.5">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter Control Bar */}
      <div className="bg-card border border-border p-5 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Filter className="h-4 w-4 text-emerald-600" />
            Filter Sadaqah Records
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Donor Name, Phone, Receipt #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Sadaqah Transactions Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-foreground">Sadaqah Collections Ledger</h2>
            <p className="text-xs text-muted-foreground">Showing {sadaqahList.length} verified Sadaqah contributions</p>
          </div>
          <button onClick={() => refetch()} className="p-2 text-muted-foreground hover:text-foreground rounded-xl border border-border">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-emerald-600" />
            Loading Sadaqah records...
          </div>
        ) : sadaqahList.length === 0 ? (
          <div className="p-12 text-center">
            <HandHeart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold text-foreground text-base">No Sadaqah records found</h3>
            <p className="text-xs text-muted-foreground mt-1">Record a new Sadaqah payment to see it here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b text-xs uppercase tracking-wider text-muted-foreground font-bold">
                <tr>
                  <th className="px-6 py-4">Receipt #</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Donor Name</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Notes / Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sadaqahList.map((item: any, idx: number) => (
                  <tr key={item._id || idx} className="hover:bg-muted/30">
                    <td className="px-6 py-4 font-bold text-emerald-600">{item.receiptNo || `RCP-${idx + 1}`}</td>
                    <td className="px-6 py-4 font-semibold">{formatDate(item.createdAt || item.date)}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold">{item.headName || 'Anonymous Donor'}</div>
                      <div className="text-xs text-muted-foreground">{item.phone}</div>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-emerald-600">{formatCurrency(item.amount)}</td>
                    <td className="px-6 py-4 capitalize text-xs font-bold">{item.gateway || 'cash'}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{item.description || 'General Sadaqah'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Sadaqah Modal */}
      {isCollectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                <HandHeart className="h-5 w-5 text-emerald-600" />
                Record Sadaqah Receipt
              </h2>
              <button onClick={() => setIsCollectModalOpen(false)} className="text-muted-foreground hover:text-foreground font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordSadaqah} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Select Donor Member (Optional)</label>
                <SearchableSelect
                  options={members.map((m: any) => ({
                    value: m._id,
                    label: `${m.name} ${m.memberId ? `(${m.memberId})` : ''} ${m.phone ? `- 📞 ${m.phone}` : ''}`,
                  }))}
                  value={selectedMemberId}
                  onChange={setSelectedMemberId}
                  placeholder="-- Choose Member or Leave Blank for Anonymous --"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Sadaqah Category / Purpose</label>
                <select
                  value={sadaqahCategory}
                  onChange={(e) => setSadaqahCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm"
                >
                  <option value="General Sadaqah">General Sadaqah (സ്വദഖ)</option>
                  <option value="Mosque Maintenance">Mosque Maintenance & Water (പള്ളി ഫണ്ട്)</option>
                  <option value="Orphan & Relief">Orphan & Relief Support (അനാഥ ഫണ്ട്)</option>
                  <option value="Food & Medical Aid">Food & Medical Aid (മെഡിക്കൽ ഫണ്ട്)</option>
                  <option value="Education Fund">Education & Madrasa Fund (വിദ്യാഭ്യാസ ഫണ്ട്)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Sadaqah Amount (INR) *</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Payment Method</label>
                <select
                  value={paymentGateway}
                  onChange={(e) => setPaymentGateway(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm"
                >
                  <option value="cash">Cash Received in Hand</option>
                  <option value="upi">UPI / GPay / PhonePe</option>
                  <option value="bank_transfer">Direct Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. For family wellbeing / Esaal-e-Sawab"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
                >
                  {recordMutation.isPending ? 'Recording...' : 'Record Receipt'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
