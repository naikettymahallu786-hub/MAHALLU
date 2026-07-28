'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export default function NewPropertyPage() {
  const router = useRouter();
  const { register, handleSubmit, watch } = useForm<any>({ defaultValues: { status: 'vacant', type: 'building' } });
  
  const watchType = watch('type');

  const createMutation = useMutation<any, any, any>({
    mutationFn: (data) => apiClient.post('/properties', data),
    onSuccess: () => {
      toast.success('Property logged successfully');
      router.push('/properties');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to add property')
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/properties"><button className="p-2 rounded-xl border"><ArrowLeft size={16} /></button></Link>
        <div>
          <h1 className="page-title text-xl">Add Property</h1>
          <p className="page-subtitle font-medium">Record a new physical asset or rental unit</p>
        </div>
      </div>
      <div className="section-card">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Property Code *</label>
              <input type="text" {...register('propertyCode', { required: true })} placeholder="PROP-001" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Property Name *</label>
              <input type="text" {...register('name', { required: true })} placeholder="e.g. Shop A-1" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Property Type *</label>
              <select {...register('type', { required: true })} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm">
                <option value="building">Building Complex</option>
                <option value="shop">Shop Room</option>
                <option value="rental_house">Rental House</option>
                <option value="land">Land Area</option>
                <option value="equipment">Equipment (Chairs, Tables, etc.)</option>
              </select>
            </div>
            {watchType === 'equipment' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Total Quantity *</label>
                <input type="number" {...register('quantity', { valueAsNumber: true, required: true })} placeholder="100" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">Monthly Rent / Fee (INR)</label>
              <input type="number" {...register('rentAmount', { valueAsNumber: true })} placeholder="5000" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Status *</label>
              <select {...register('status', { required: true })} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm">
                <option value="vacant">Vacant / Available</option>
                <option value="occupied">Occupied / Rented Out</option>
                <option value="maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href="/properties"><button type="button" className="px-5 py-2.5 rounded-xl border text-sm font-semibold">Cancel</button></Link>
            <button type="submit" disabled={createMutation.isPending} className="btn-brand flex items-center gap-2">
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Property
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
