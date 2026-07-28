'use client';

import { useForm, Controller } from 'react-hook-form';
import { useRouter, usePathname } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export default function NewClassPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isMadrasaPortal = pathname.startsWith('/madrasa-portal');
  const backUrl = isMadrasaPortal ? '/madrasa-portal/classes' : '/madrasa/classes';

  const { register, handleSubmit, control } = useForm();
  
  const { data: teachersData } = useQuery({ 
    queryKey: ['teachers'], 
    queryFn: () => apiClient.get('/teachers').then(r => r.data) 
  });
  
  const { data: studentsData } = useQuery({ 
    queryKey: ['students'], 
    queryFn: () => apiClient.get('/students').then(r => r.data) 
  });

  const teachersList = Array.isArray(teachersData?.data) 
    ? teachersData.data 
    : (Array.isArray(teachersData) ? teachersData : []);

  const studentsList = Array.isArray(studentsData?.data) 
    ? studentsData.data 
    : (Array.isArray(studentsData) ? studentsData : []);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/classes', data),
    onSuccess: () => {
      toast.success('Class created successfully!');
      router.push(backUrl);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create class')
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href={backUrl}><button className="p-2 rounded-xl border"><ArrowLeft size={16} /></button></Link>
        <div>
          <h1 className="page-title text-xl">Add New Class</h1>
          <p className="page-subtitle font-medium">Create a class and assign an Ustadh</p>
        </div>
      </div>
      <div className="section-card">
        <form onSubmit={handleSubmit(d => {
          const formattedData = { ...d };
          if (typeof d.subjects === 'string' && d.subjects.trim()) {
            formattedData.subjects = d.subjects.split(',').map((s: string) => s.trim());
          } else {
            formattedData.subjects = [];
          }
          createMutation.mutate(formattedData);
        })} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Class Name *</label>
              <input type="text" {...register('name', { required: true })} placeholder="e.g. Class 1A" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5">Academic Level (1-10) *</label>
              <input type="number" {...register('level', { required: true, valueAsNumber: true })} defaultValue={1} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Assigned Teacher (Ustadh)</label>
              <Controller
                control={control}
                name="teacherId"
                render={({ field }) => (
                  <SearchableSelect
                    options={teachersList.map((t: any) => ({ 
                      value: t._id, 
                      label: `${t.memberId?.name || 'Ustadh'} (${t.employeeId || 'Staff'})` 
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="No Teacher Assigned"
                  />
                )}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5 font-semibold">Assign Students (Hold Ctrl/Cmd to select multiple)</label>
              <select multiple {...register('students')} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm min-h-[150px]">
                {studentsList.map((s: any) => (
                  <option key={s._id} value={s._id}>
                    {s.memberId?.name || 'Unknown'} - {s.admissionNo}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5">Subjects (Comma separated)</label>
              <input type="text" {...register('subjects')} placeholder="Quran, Fiqh, Arabic" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href={backUrl}><button type="button" className="px-5 py-2.5 rounded-xl border text-sm font-semibold">Cancel</button></Link>
            <button type="submit" disabled={createMutation.isPending} className="btn-brand flex items-center gap-2">
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Class
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
