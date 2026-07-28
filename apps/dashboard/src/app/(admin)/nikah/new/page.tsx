'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export default function NewNikahPage() {
  const router = useRouter();
  const { register, handleSubmit } = useForm();

  const createMutation = useMutation<any, any, any>({
    mutationFn: (data) => apiClient.post('/nikah', data),
    onSuccess: () => {
      toast.success('Nikah record registered!');
      router.push('/nikah');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to add Nikah record')
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/nikah"><button className="p-2 rounded-xl border"><ArrowLeft size={16} /></button></Link>
        <div>
          <h1 className="page-title text-xl">Register Marriage (Nikah)</h1>
          <p className="page-subtitle font-medium">Record a new marriage entry in Mahallu Registry</p>
        </div>
      </div>
      <div className="section-card">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nikah Number *</label>
              <input type="text" {...register('nikahNo', { required: true })} placeholder="NKH-2024-001" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Date of Marriage *</label>
              <input type="date" {...register('date', { required: true })} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Groom Name (Husband) *</label>
              <input type="text" {...register('groomName', { required: true })} placeholder="Groom's name" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Groom Father Name *</label>
              <input type="text" {...register('groomFatherName', { required: true })} placeholder="Groom's father" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Bride Name (Wife) *</label>
              <input type="text" {...register('brideName', { required: true })} placeholder="Bride's name" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Bride Father Name *</label>
              <input type="text" {...register('brideFatherName', { required: true })} placeholder="Bride's father" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Mehr Amount (INR) *</label>
              <input type="number" {...register('mehr', { required: true, valueAsNumber: true })} placeholder="15000" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Venue</label>
              <input type="text" {...register('venue')} placeholder="e.g. Mahallu Auditorium" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href="/nikah"><button type="button" className="px-5 py-2.5 rounded-xl border text-sm font-semibold">Cancel</button></Link>
            <button type="submit" disabled={createMutation.isPending} className="btn-brand flex items-center gap-2">
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Register Nikah
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
