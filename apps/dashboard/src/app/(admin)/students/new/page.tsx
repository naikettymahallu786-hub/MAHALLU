'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, Loader2, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

const studentSchema = z.object({
  admissionNo: z.string().optional(),
  memberId: z.string().min(1, 'Student member is required'),
  madrasaId: z.string().min(1, 'Madrasa selection is required'),
  classId: z.string().min(1, 'Class selection is required'),
  guardianId: z.string().min(1, 'Guardian member is required'),
  admissionDate: z.string().default(() => new Date().toISOString().split('T')[0]),
  status: z.enum(['active', 'promoted', 'transferred', 'withdrawn']).default('active'),
  feeBalance: z.preprocess((val) => val === '' || val === undefined || val === null || isNaN(Number(val)) ? 0 : Number(val), z.number()).default(0),
});

type StudentForm = z.infer<typeof studentSchema>;

export default function NewStudentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultClassId = searchParams.get('classId') || '';

  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: { status: 'active', feeBalance: 0, admissionDate: new Date().toISOString().split('T')[0], classId: defaultClassId },
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: () => apiClient.get('/members').then(r => r.data.data || []),
  });

  const { data: madrasas } = useQuery({
    queryKey: ['madrasa'],
    queryFn: () => apiClient.get('/madrasa').then(r => r.data.data ? [r.data.data] : []),
  });

  useEffect(() => {
    if (madrasas && madrasas.length > 0) {
      setValue('madrasaId', madrasas[0]._id);
    }
  }, [madrasas, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: StudentForm) => apiClient.post('/students', data),
    onSuccess: () => {
      toast.success('Student admission completed successfully!');
      router.push('/students');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to complete admission');
    },
  });

  const onSubmit = (data: StudentForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/students">
          <button className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
            <ArrowLeft size={16} />
          </button>
        </Link>
        <div>
          <h1 className="page-title text-xl">New Madrasa Admission</h1>
          <p className="page-subtitle">Register a student to Madrasa classes</p>
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
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Admission Number (Optional)</label>
              <input
                type="text"
                {...register('admissionNo')}
                placeholder="Leave blank for auto-generation"
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
                <option value="6a4e586a91e5d5122d851d67">Class 1</option>
                <option value="6a4e586a91e5d5122d851d68">Class 2</option>
                <option value="6a4e586a91e5d5122d851d69">Class 3</option>
                {defaultClassId && !['6a4e586a91e5d5122d851d67', '6a4e586a91e5d5122d851d68', '6a4e586a91e5d5122d851d69'].includes(defaultClassId) && (
                  <option value={defaultClassId}>Current Class</option>
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
            <Link href="/students">
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
              disabled={createMutation.isPending}
              className="btn-brand flex items-center gap-2"
            >
              {createMutation.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Admitting...</>
              ) : (
                <><Save size={16} /> Complete Admission</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
