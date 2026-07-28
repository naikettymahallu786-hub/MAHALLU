'use client';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export default function NewDeathPage() {
  const router = useRouter();
  const { register, handleSubmit, control } = useForm();
  const { data: members } = useQuery({ queryKey: ['members'], queryFn: () => apiClient.get('/members').then(r => r.data.data || []) });

  const createMutation = useMutation<any, any, any>({
    mutationFn: (data) => apiClient.post('/death', data),
    onSuccess: () => {
      toast.success('Death registry entry added!');
      router.push('/death');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to add death entry')
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/death"><button className="p-2 rounded-xl border"><ArrowLeft size={16} /></button></Link>
        <div>
          <h1 className="page-title text-xl">Register Death Entry</h1>
          <p className="page-subtitle font-medium">Record a deceased member details</p>
        </div>
      </div>
      <div className="section-card">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Deceased Member *</label>
              <Controller
                control={control}
                name="memberId"
                rules={{ required: true }}
                render={({ field }) => (
                  <SearchableSelect
                    options={members?.map((m: any) => ({ value: m._id, label: m.name })) || []}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select Member"
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Date of Death *</label>
              <input type="date" {...register('dateOfDeath', { required: true })} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Burial Place</label>
              <input type="text" {...register('burialPlace')} placeholder="Mahallu Cemetery" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Cemetery Plot ID</label>
              <input type="text" {...register('plotId')} placeholder="e.g. A-24" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Cause of Death</label>
              <input type="text" {...register('causeOfDeath')} placeholder="e.g. Natural, Illness" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href="/death"><button type="button" className="px-5 py-2.5 rounded-xl border text-sm font-semibold">Cancel</button></Link>
            <button type="submit" disabled={createMutation.isPending} className="btn-brand flex items-center gap-2">
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
