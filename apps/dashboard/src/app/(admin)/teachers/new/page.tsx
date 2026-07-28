'use client';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export default function NewTeacherPage() {
  const router = useRouter();
  const { register, handleSubmit, control } = useForm();
  const { data: members } = useQuery({ queryKey: ['members'], queryFn: () => apiClient.get('/members').then(r => r.data.data || []) });

  const createMutation = useMutation<any, any, any>({
    mutationFn: (data) => apiClient.post('/teachers', data),
    onSuccess: () => {
      toast.success('Teacher logged successfully');
      router.push('/teachers');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to add teacher')
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/teachers"><button className="p-2 rounded-xl border"><ArrowLeft size={16} /></button></Link>
        <div>
          <h1 className="page-title text-xl">Add Teaching Staff</h1>
          <p className="page-subtitle font-medium">Add a new Madrasa teacher</p>
        </div>
      </div>
      <div className="section-card">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Employee ID *</label>
              <input type="text" {...register('employeeId', { required: true })} placeholder="EMP-001" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Teacher Member *</label>
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
              <label className="block text-sm font-medium mb-1.5">Qualification *</label>
              <input type="text" {...register('qualification', { required: true })} placeholder="e.g. MA Arabic, Thaqafi" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Monthly Salary *</label>
              <input type="number" {...register('salary', { required: true, valueAsNumber: true })} placeholder="12000" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Joined Date *</label>
              <input type="date" {...register('joiningDate')} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Madrasa *</label>
              <select {...register('madrasaId')} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm">
                <option value="6a4e586a91e5d5122d851d6a">Darul Uloom Madrasa (Default)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href="/teachers"><button type="button" className="px-5 py-2.5 rounded-xl border text-sm font-semibold">Cancel</button></Link>
            <button type="submit" disabled={createMutation.isPending} className="btn-brand flex items-center gap-2">
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Staff
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
