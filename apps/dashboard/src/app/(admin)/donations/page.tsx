'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Search, Plus, DollarSign, Download, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { toast } from 'sonner';

export default function DonationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [campaign, setCampaign] = useState('');

  // Payment states
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectGateway, setCollectGateway] = useState('cash');
  const [collectDescription, setCollectDescription] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['donations', page, campaign],
    queryFn: () => apiClient.get('/donations', {
      params: { page, limit: 20, campaign },
    }).then(r => r.data),
  });

  const collectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.post(`/donations/${id}/collect`, data),
    onSuccess: () => {
      toast.success('Donation collected and receipt generated successfully');
      setIsCollectModalOpen(false);
      setSelectedDonation(null);
      setCollectAmount('');
      setCollectDescription('');
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['finance-kpis'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to collect donation')
  });

  const donations = data?.data || [];
  const pagination = data?.pagination;

  // Calculate sum of donations
  const totalDonated = donations.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('donations_page.title')}</h1>
          <p className="page-subtitle">{t('donations_page.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
            <Download size={16} />
            {t('teachers_page.export')}
          </button>
          <Link href="/donations/new">
            <button id="add-donation-btn" className="btn-brand flex items-center gap-2">
              <Plus size={16} />
              {t('donations_page.collect')}
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-card flex items-center gap-4 animate-count"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-pink-100 dark:bg-pink-950/30">
            <Heart size={18} className="text-pink-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{pagination?.total || donations.length}</p>
            <p className="text-xs text-muted-foreground">{t('donations_page.totalDonations')}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="section-card flex items-center gap-4 animate-count"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/30">
            <DollarSign size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{formatCurrency(totalDonated)}</p>
            <p className="text-xs text-muted-foreground">{t('donations_page.totalReceived')}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="section-card flex items-center gap-4 animate-count"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-100 dark:bg-red-950/30">
            <DollarSign size={18} className="text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{t('donations_page.pendingDues')}</p>
            <p className="text-xs text-muted-foreground">{t('donations_page.pendingDuesDesc')}</p>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="section-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={campaign}
            onChange={e => { setCampaign(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">{t('donations_page.allCampaigns')}</option>
            <option value="General Sadaqah">General Sadaqah</option>
            <option value="Mosque Renovation">Mosque Renovation</option>
            <option value="Orphan Support">Orphan Support</option>
            <option value="Madrasa Fund">Madrasa Fund</option>
          </select>
        </div>
      </div>

      {/* Donations Table */}
      <div className="section-card overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl shimmer" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="pl-6">{t('donations_page.donorName')}</th>
                  <th>{t('donations_page.campaign')}</th>
                  <th>{t('donations_page.amount')}</th>
                  <th>{t('donations_page.isAnonymous')}</th>
                  <th>{t('donations_page.date')}</th>
                  <th>{t('teachers_page.status')}</th>
                  <th className="pr-6 text-right">{t('teachers_page.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {donations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Heart size={40} className="mx-auto mb-3 opacity-30" />
                      <p>No donations recorded yet</p>
                    </td>
                  </tr>
                ) : (
                  donations.map((donation: any, i: number) => (
                    <motion.tr
                      key={donation._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="group"
                    >
                      <td className="pl-6">
                        <span className="font-semibold text-sm text-foreground">
                          {donation.isAnonymous ? 'Anonymous' : (donation.familyId ? `Family: ${donation.familyId.headMemberId?.name || donation.familyId.familyCode}` : (donation.donorId?.name || donation.donorName || 'General Donor'))}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-foreground capitalize">
                          {donation.campaign || donation.purpose || 'General Sadaqah'}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm font-bold text-emerald-600">
                          {formatCurrency(donation.amount || 0)}
                        </span>
                      </td>
                      <td>
                        <span className={cn('text-xs px-2 py-0.5 rounded font-semibold',
                          donation.isAnonymous ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        )}>
                          {donation.isAnonymous ? t('donations_page.yes') : t('donations_page.no')}
                        </span>
                      </td>
                      <td className="text-sm text-muted-foreground">
                        {formatDate(donation.createdAt)}
                      </td>
                      <td>
                        <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold capitalize',
                          donation.status === 'paid' || !donation.status ? 'badge-active' : 'badge-overdue'
                        )}>
                          {donation.status === 'paid' || !donation.status ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="pr-6 text-right">
                        {donation.status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedDonation(donation);
                              setCollectAmount(String(donation.amount));
                              setIsCollectModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1 hover:bg-emerald-700 transition-colors"
                          >
                            <DollarSign size={13} />
                            Collect
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collect Donation Modal */}
      <AnimatePresence>
        {isCollectModalOpen && selectedDonation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-2xl shadow-xl border overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b flex items-center justify-between bg-card">
                <h2 className="font-bold text-lg">Collect Pending Donation</h2>
                <button onClick={() => { setIsCollectModalOpen(false); setSelectedDonation(null); }} className="p-2 hover:bg-muted rounded-full">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Donor</label>
                  <p className="text-sm font-bold bg-muted p-2.5 rounded-xl">
                    {selectedDonation.isAnonymous ? 'Anonymous' : (selectedDonation.familyId ? `Family Head: ${selectedDonation.familyId.headMemberId?.name || selectedDonation.familyId.familyCode}` : (selectedDonation.donorId?.name || selectedDonation.donorName || 'General Donor'))}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Campaign</label>
                  <p className="text-sm font-bold bg-muted p-2.5 rounded-xl">{selectedDonation.campaign || 'General Sadaqah'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Amount (INR) *</label>
                  <input 
                    type="number" 
                    value={collectAmount} 
                    onChange={e => setCollectAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border text-sm" 
                    placeholder="Enter amount..." 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Payment Method *</label>
                  <select 
                    value={collectGateway} 
                    onChange={e => setCollectGateway(e.target.value)}
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
                    value={collectDescription} 
                    onChange={e => setCollectDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl border text-sm" 
                    placeholder="e.g. Received via cash" 
                  />
                </div>
              </div>
              <div className="p-4 border-t bg-card flex gap-3">
                <button onClick={() => { setIsCollectModalOpen(false); setSelectedDonation(null); }} className="flex-1 py-2.5 rounded-xl border font-bold text-sm">Cancel</button>
                <button 
                  onClick={() => collectMutation.mutate({
                    id: selectedDonation._id,
                    data: {
                      amount: Number(collectAmount),
                      gateway: collectGateway,
                      description: collectDescription || `Collected ${selectedDonation.campaign || 'Donation'}`
                    }
                  })}
                  disabled={collectMutation.isPending || !collectAmount} 
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
