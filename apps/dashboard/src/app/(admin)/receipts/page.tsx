'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Printer, Plus, X, Loader2, CheckCircle2, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export default function ReceiptsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceiptForView, setSelectedReceiptForView] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['receipts'],
    queryFn: () => apiClient.get('/receipts').then(r => r.data),
  });

  const { data: membersData } = useQuery({
    queryKey: ['members-list'],
    queryFn: () => apiClient.get('/members').then(r => r.data),
  });

  const receipts = data?.data || [];
  const members = membersData?.data || [];

  const [customTypeActive, setCustomTypeActive] = useState(false);

  const { register, handleSubmit, reset, watch, getValues, setValue, control, formState: { errors } } = useForm({
    defaultValues: { type: 'donation', amount: '', paidById: '', description: '', gateway: 'cash' }
  });

  const watchType = watch('type');

  const addMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/receipts/manual', data),
    onSuccess: () => {
      toast.success('Receipt created successfully');
      setIsModalOpen(false);
      setCustomTypeActive(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['finance-kpis'] }); // if affected
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create receipt')
  });

  const handlePrint = (receipt: any) => {
    const payment = receipt.paymentId;
    const memberName = payment?.paidForId?.name || 
                       payment?.paidById?.name || 
                       members.find((m: any) => m._id === (payment?.paidForId || payment?.paidById))?.name || 
                       'Member';
    const amount = formatCurrency(payment?.amount || 0);
    const date = formatDate(receipt.createdAt);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${receipt.receiptNo}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #059669; margin: 0 0 10px 0; }
            .subtitle { color: #666; font-size: 14px; margin: 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px; }
            .label { font-weight: bold; color: #555; width: 150px; }
            .value { flex: 1; }
            .amount-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0; }
            .amount { font-size: 32px; font-weight: bold; color: #166534; margin: 0; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">MAHALLU ERP SYSTEM</h1>
            <p class="subtitle">Official Payment Receipt</p>
          </div>
          <div class="row"><div class="label">Receipt No:</div><div class="value">${receipt.receiptNo}</div></div>
          <div class="row"><div class="label">Date:</div><div class="value">${date}</div></div>
          <div class="row"><div class="label">Received From:</div><div class="value">${memberName}</div></div>
          <div class="row"><div class="label">Payment Type:</div><div class="value" style="text-transform: capitalize;">${payment?.type?.replace('_', ' ') || 'General'}</div></div>
          <div class="row"><div class="label">Payment Method:</div><div class="value" style="text-transform: capitalize;">${payment?.gateway || 'Cash'}</div></div>
          ${payment?.description ? `<div class="row"><div class="label">Description:</div><div class="value">${payment.description}</div></div>` : ''}
          
          <div class="amount-box">
            <p style="margin: 0 0 5px 0; color: #166534; font-size: 14px; text-transform: uppercase; font-weight: bold;">Total Amount Received</p>
            <p class="amount">${amount}</p>
          </div>
          
          <div class="footer">
            <p>This is a computer generated receipt and does not require a physical signature.</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('receipts_page.title')}</h1>
          <p className="page-subtitle">{t('receipts_page.subtitle')}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-brand flex items-center gap-2">
          <Plus size={16} /> {t('receipts_page.addReceipt')}
        </button>
      </div>

      {/* Receipts Table */}
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
                  <th className="pl-6">{t('receipts_page.receiptNo')}</th>
                  <th>{t('receipts_page.paymentType')}</th>
                  <th>{t('receipts_page.amount')}</th>
                  <th>{t('receipts_page.date')}</th>
                  <th>{t('receipts_page.gateway')}</th>
                  <th className="pr-6 text-right">{t('receipts_page.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <FileText size={40} className="mx-auto mb-3 opacity-30" />
                      <p>{t('receipts_page.noReceipts')}</p>
                    </td>
                  </tr>
                ) : (
                  receipts.map((receipt: any, i: number) => (
                    <motion.tr
                      key={receipt._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="group"
                    >
                      <td className="pl-6">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded-md font-bold text-foreground">{receipt.receiptNo}</code>
                      </td>
                      <td>
                        <span className="font-semibold text-sm capitalize text-foreground">
                          {receipt.paymentId?.type?.replace('_', ' ') || 'General Payment'}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm font-bold text-emerald-600">
                          {formatCurrency(receipt.paymentId?.amount || 0)}
                        </span>
                      </td>
                      <td className="text-sm text-muted-foreground">
                        {formatDate(receipt.createdAt)}
                      </td>
                      <td>
                        <span className="text-xs px-2 py-0.5 rounded font-bold capitalize tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {receipt.paymentId?.gateway === 'CASH' || receipt.paymentId?.gateway === 'cash' ? t('receipts_page.offline') : (receipt.paymentId?.gateway || 'Online')}
                        </span>
                      </td>
                      <td className="pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedReceiptForView(receipt)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Eye size={14} /> View
                          </button>
                          <button 
                            onClick={() => handlePrint(receipt)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Printer size={14} /> {t('receipts_page.print')}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Receipt Modal */}
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
                <h2 className="font-bold text-lg">Create Manual Receipt</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto">
                <form id="receipt-form" onSubmit={handleSubmit(d => addMutation.mutate(d))} className="space-y-4">
                  
                  <div>
                     <label className="block text-sm font-medium mb-1.5">Member *</label>
                     <Controller
                       control={control}
                       name="paidById"
                       rules={{ required: true }}
                       render={({ field }) => (
                         <SearchableSelect
                           options={members.map((m: any) => ({ value: m._id, label: `${m.name} (${m.memberId})` }))}
                           value={field.value}
                           onChange={field.onChange}
                           placeholder="Select Member..."
                         />
                       )}
                     />
                   </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Payment Type *</label>
                    {!customTypeActive ? (
                      <select 
                        {...register('type', { required: true })}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setCustomTypeActive(true);
                            setValue('type', '');
                          }
                        }}
                        className="w-full p-2.5 rounded-xl border text-sm bg-background"
                      >
                        <option value="donation">Donation</option>
                        <option value="subscription">Subscription Fee</option>
                        <option value="zakat">Zakat</option>
                        <option value="rental">Property Rental</option>
                        <option value="event">Event Registration</option>
                        <option value="custom">Custom Type (Write-in)...</option>
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          {...register('type', { required: true })} 
                          className="flex-1 p-2.5 rounded-xl border text-sm bg-background" 
                          placeholder="Type custom payment type..."
                          autoFocus
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            setCustomTypeActive(false);
                            setValue('type', 'donation');
                          }}
                          className="px-3 rounded-xl border text-xs font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors"
                        >
                          Choose List
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Amount (INR) *</label>
                    <input type="number" {...register('amount', { required: true, valueAsNumber: true })} className="w-full p-2.5 rounded-xl border text-sm" placeholder="e.g. 5000" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Description / Custom Detail</label>
                    <input type="text" {...register('description')} className="w-full p-2.5 rounded-xl border text-sm" placeholder="e.g. November Subscription (Cash)" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Payment Method *</label>
                    <select {...register('gateway', { required: true })} className="w-full p-2.5 rounded-xl border text-sm bg-background">
                      <option value="cash">Collected By Hand (Cash)</option>
                      <option value="upi">Google Pay / PhonePe / UPI</option>
                      <option value="bank_transfer">Direct Bank Transfer</option>
                    </select>
                  </div>
                </form>
              </div>
              <div className="p-4 border-t sticky bottom-0 bg-card z-10 flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border font-bold text-sm">Cancel</button>
                <button type="submit" form="receipt-form" disabled={addMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm flex justify-center items-center">
                  {addMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Generate Receipt'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {/* View Receipt Modal */}
        {selectedReceiptForView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-card rounded-2xl border shadow-xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-foreground">Receipt Details</h2>
                <button
                  onClick={() => setSelectedReceiptForView(null)}
                  className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Receipt Number</p>
                    <p className="text-lg font-mono font-bold text-foreground">{selectedReceiptForView.receiptNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</p>
                    <p className="text-sm font-semibold text-foreground">{formatDate(selectedReceiptForView.createdAt)}</p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-muted-foreground">Received From:</span>
                    <span className="font-bold text-foreground">
                      {selectedReceiptForView.paymentId?.paidForId?.name || 
                       selectedReceiptForView.paymentId?.paidById?.name || 
                       members.find((m: any) => m._id === (selectedReceiptForView.paymentId?.paidForId || selectedReceiptForView.paymentId?.paidById))?.name || 
                       'Member'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-muted-foreground">Payment Type:</span>
                    <span className="font-bold text-foreground capitalize">
                      {selectedReceiptForView.paymentId?.type?.replace('_', ' ') || 'General Payment'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-muted-foreground">Payment Method:</span>
                    <span className="font-bold text-foreground capitalize">
                      {selectedReceiptForView.paymentId?.gateway || 'Cash'}
                    </span>
                  </div>
                  {selectedReceiptForView.paymentId?.description && (
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-muted-foreground">Description:</span>
                      <span className="font-medium text-foreground max-w-[250px] text-right">
                        {selectedReceiptForView.paymentId.description}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4 text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 mb-1">Amount Paid</p>
                  <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedReceiptForView.paymentId?.amount || 0)}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 p-6 border-t bg-muted/50">
                <button
                  onClick={() => setSelectedReceiptForView(null)}
                  className="btn-secondary"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handlePrint(selectedReceiptForView);
                    setSelectedReceiptForView(null);
                  }}
                  className="btn-brand flex items-center gap-2"
                >
                  <Printer size={16} /> Print Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
