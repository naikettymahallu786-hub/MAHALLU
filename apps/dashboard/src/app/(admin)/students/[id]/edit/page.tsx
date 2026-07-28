'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

const studentSchema = z.object({
  admissionNo: z.string().min(1, 'Admission number is required'),
  memberId: z.string().min(1, 'Student member is required'),
  madrasaId: z.string().min(1, 'Madrasa selection is required'),
  classId: z.string().min(1, 'Class selection is required'),
  guardianId: z.string().min(1, 'Guardian member is required'),
  admissionDate: z.string().default(() => new Date().toISOString().split('T')[0]),
  status: z.enum(['active', 'promoted', 'transferred', 'withdrawn']).default('active'),
  feeBalance: z.preprocess((val) => val === '' || val === undefined || val === null || isNaN(Number(val)) ? 0 : Number(val), z.number()).default(0),
});

type StudentForm = z.infer<typeof studentSchema>;

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const { register, handleSubmit, setValue, reset, control, formState: { errors } } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
  });

  // Fetch existing student data
  const { data: student, isLoading: isStudentLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => apiClient.get(`/students/${studentId}`).then(r => r.data.data),
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: () => apiClient.get('/members').then(r => r.data.data || []),
  });

  const { data: madrasas } = useQuery({
    queryKey: ['madrasa'],
    queryFn: () => apiClient.get('/madrasa').then(r => r.data.data ? [r.data.data] : []),
  });

  // Set default values when student data is loaded
  useEffect(() => {
    if (student) {
      reset({
        admissionNo: student.admissionNo || '',
        memberId: typeof student.memberId === 'object' ? student.memberId?._id : student.memberId,
        madrasaId: typeof student.madrasaId === 'object' ? student.madrasaId?._id : student.madrasaId,
        classId: typeof student.classId === 'object' ? student.classId?._id : student.classId,
        guardianId: typeof student.guardianId === 'object' ? student.guardianId?._id : student.guardianId,
        admissionDate: student.admissionDate ? new Date(student.admissionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: student.status || 'active',
        feeBalance: student.feeBalance || 0,
      });
    }
  }, [student, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: StudentForm) => apiClient.put(`/students/${studentId}`, data),
    onSuccess: () => {
      toast.success('Student updated successfully!');
      router.push(`/students/${studentId}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update student');
    },
  });

  const onSubmit = (data: StudentForm) => {
    updateMutation.mutate(data);
  };

  if (isStudentLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-16 rounded-xl shimmer" />
        <div className="h-96 rounded-2xl shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/students/${studentId}`}>
          <button className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
            <ArrowLeft size={16} />
          </button>
        </Link>
        <div>
          <h1 className="page-title text-xl">Edit Student</h1>
          <p className="page-subtitle">Update student admission details</p>
        </div>
      </div>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="section-card space-y-6"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Admission No */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Admission Number *</label>
              <input
                type="text"
                {...register('admissionNo')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.admissionNo && <p className="text-red-400 text-xs mt-1">{errors.admissionNo.message}</p>}
            </div>

            {/* Student member selection */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Student Member *</label>
              <Controller
                control={control}
                name="memberId"
                render={({ field }) => (
                  <SearchableSelect
                    options={members?.map((m: any) => ({ value: m._id, label: `${m.name} (${m.phone || 'No phone'})` })) || []}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select Student Member"
                  />
                )}
              />
              {errors.memberId && <p className="text-red-400 text-xs mt-1">{errors.memberId.message}</p>}
            </div>

            {/* Madrasa selection */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Madrasa *</label>
              <select
                {...register('madrasaId')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select Madrasa</option>
                {madrasas?.map((m: any) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
                <option value="6a4e586a91e5d5122d851d6a">Darul Uloom Madrasa (Default)</option>
              </select>
              {errors.madrasaId && <p className="text-red-400 text-xs mt-1">{errors.madrasaId.message}</p>}
            </div>

            {/* Class selection */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Class Level *</label>
              <select
                {...register('classId')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select Class</option>
                {/* Dynamically list classes or fallback */}
                <option value="6a4e586a91e5d5122d851d67">Class 1</option>
                <option value="6a4e586a91e5d5122d851d68">Class 2</option>
                <option value="6a4e586a91e5d5122d851d69">Class 3</option>
                {/* if the original classId is not in the hardcoded list, ensure it's still available so select doesn't break */}
                {student && student.classId && !['6a4e586a91e5d5122d851d67', '6a4e586a91e5d5122d851d68', '6a4e586a91e5d5122d851d69'].includes(typeof student.classId === 'object' ? student.classId._id : student.classId) && (
                  <option value={typeof student.classId === 'object' ? student.classId._id : student.classId}>Current Class</option>
                )}
              </select>
              {errors.classId && <p className="text-red-400 text-xs mt-1">{errors.classId.message}</p>}
            </div>

            {/* Guardian member selection */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Guardian *</label>
              <Controller
                control={control}
                name="guardianId"
                render={({ field }) => (
                  <SearchableSelect
                    options={members?.map((m: any) => ({ value: m._id, label: `${m.name} (${m.phone || 'No phone'})` })) || []}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select Guardian"
                  />
                )}
              />
              {errors.guardianId && <p className="text-red-400 text-xs mt-1">{errors.guardianId.message}</p>}
            </div>

            {/* Admission Date */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Admission Date</label>
              <input
                type="date"
                {...register('admissionDate')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Fee Balance */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Madrasa Fees Balance (INR)</label>
              <input
                type="number"
                {...register('feeBalance', { valueAsNumber: true })}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Admission Status *</label>
              <select
                {...register('status')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="active">Active</option>
                <option value="promoted">Promoted</option>
                <option value="transferred">Transferred</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 border-t border-border/40 pt-4 mt-5">
            <Link href={`/students/${studentId}`}>
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </Link>
            <button
              id="student-submit"
              type="submit"
              disabled={updateMutation.isPending}
              className="btn-brand flex items-center gap-2"
            >
              {updateMutation.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Saving...</>
              ) : (
                <><Save size={16} /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
