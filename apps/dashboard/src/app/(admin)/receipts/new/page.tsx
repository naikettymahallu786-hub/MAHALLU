'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export default function NewReceiptPage() {
  const router = useRouter();
  const { register, handleSubmit } = useForm<any>({ defaultValues: { gateway: 'cash', type: 'donation', status: 'success' } });
  const { data: members } = useQuery({ queryKey: ['members'], queryFn: () => apiClient.get('/members').then(r => r.data.data || []) });

  const createMutation = useMutation<any, any, any>({
    mutationFn: (data) => apiClient.post('/receipts/manual', data),
    onSuccess: () => {
      toast.success('Manual receipt generated successfully');
      router.push('/receipts');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to generate receipt')
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/receipts"><button className="p-2 rounded-xl border"><ArrowLeft size={16} /></button></Link>
        <div>
          <h1 className="page-title text-xl">Generate Receipt</h1>
          <p className="page-subtitle font-medium">Log manual transaction or create online bill</p>
        </div>
      </div>
      <div className="section-card">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Payment Type *</label>
              <select {...register('type', { required: true })} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm">
                <option value="donation">Donation</option>
                <option value="subscription">Monthly Subscription</option>
                <option value="madrasa_fee">Madrasa Student Fee</option>
                <option value="rental">Property Rental</option>
                <option value="zakat">Zakat Collection</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Amount (INR) *</label>
              <input type="number" {...register('amount', { required: true, valueAsNumber: true })} placeholder="500" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Paid By (Member) *</label>
              <select {...register('paidById', { required: true })} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm">
                <option value="">Select Payer</option>
                {members?.map((m: any) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Payment Method *</label>
              <select {...register('gateway', { required: true })} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm">
                <option value="cash">Cash In Hand</option>
                <option value="upi">Direct UPI Payment</option>
                <option value="bank_transfer">Direct Bank Transfer</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Remarks / Details</label>
              <input type="text" {...register('description')} placeholder="e.g. Receipt for subscription June 2024" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href="/receipts"><button type="button" className="px-5 py-2.5 rounded-xl border text-sm font-semibold">Cancel</button></Link>
            <button type="submit" disabled={createMutation.isPending} className="btn-brand flex items-center gap-2">
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
