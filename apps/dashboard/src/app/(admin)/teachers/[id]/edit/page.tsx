'use client';
import { useForm, Controller } from 'react-hook-form';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export default function EditTeacherPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, control } = useForm<any>();
  
  const { data: members } = useQuery({ queryKey: ['members'], queryFn: () => apiClient.get('/members').then(r => r.data.data || []) });

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher', id],
    queryFn: () => apiClient.get(`/teachers/${id}`).then(r => r.data.data),
  });

  useEffect(() => {
    if (teacher) {
      reset({
        employeeId: teacher.employeeId,
        memberId: teacher.memberId?._id || teacher.memberId,
        qualification: teacher.qualification,
        salary: teacher.salary,
        joiningDate: teacher.joiningDate ? new Date(teacher.joiningDate).toISOString().split('T')[0] : '',
        madrasaId: teacher.madrasaId?._id || teacher.madrasaId
      });
    }
  }, [teacher, reset]);

  const updateMutation = useMutation<any, any, any>({
    mutationFn: (data) => apiClient.put(`/teachers/${id}`, data),
    onSuccess: () => {
      toast.success('Teacher updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      router.push('/teachers');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update teacher')
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href={`/teachers/${id}`}><button className="p-2 rounded-xl border"><ArrowLeft size={16} /></button></Link>
        <div>
          <h1 className="page-title text-xl">Edit Teaching Staff</h1>
          <p className="page-subtitle font-medium">Update teaching staff profile</p>
        </div>
      </div>
      <div className="section-card">
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Employee ID *</label>
              <input type="text" {...register('employeeId', { required: true })} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
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
              <input type="text" {...register('qualification', { required: true })} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Monthly Salary *</label>
              <input type="number" {...register('salary', { required: true, valueAsNumber: true })} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
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
            <Link href={`/teachers/${id}`}><button type="button" className="px-5 py-2.5 rounded-xl border text-sm font-semibold">Cancel</button></Link>
            <button type="submit" disabled={updateMutation.isPending} className="btn-brand flex items-center gap-2">
              {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
