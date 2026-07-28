'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export default function NewZakatPage() {
  const router = useRouter();
  const { register, handleSubmit } = useForm<any>({ defaultValues: { status: 'open' } });

  const createMutation = useMutation<any, any, any>({
    mutationFn: (data) => apiClient.post('/zakat', data),
    onSuccess: () => {
      toast.success('Zakat session initialized!');
      router.push('/zakat');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to initialize Zakat year')
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/zakat"><button className="p-2 rounded-xl border"><ArrowLeft size={16} /></button></Link>
        <div>
          <h1 className="page-title text-xl">Initialize Zakat Year</h1>
          <p className="page-subtitle font-medium">Create a new Zakat tracking session for this year</p>
        </div>
      </div>
      <div className="section-card">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Zakat Year (Hijri / Gregorian) *</label>
              <input type="number" {...register('year', { required: true, valueAsNumber: true })} placeholder="2024" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Initial Collection target (INR)</label>
              <input type="number" {...register('totalCollected', { valueAsNumber: true })} placeholder="0" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href="/zakat"><button type="button" className="px-5 py-2.5 rounded-xl border text-sm font-semibold">Cancel</button></Link>
            <button type="submit" disabled={createMutation.isPending} className="btn-brand flex items-center gap-2">
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Initialize Year
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
