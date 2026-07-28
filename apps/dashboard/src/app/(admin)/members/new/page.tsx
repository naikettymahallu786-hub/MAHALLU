'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

const memberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  gender: z.enum(['male', 'female']),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.string().optional(),
  occupation: z.string().optional(),
  qualification: z.string().optional(),
  relationship: z.string().optional(),
  status: z.enum(['active', 'inactive', 'deceased', 'migrated']).default('active'),
  familyId: z.string().optional(),
});

type MemberForm = z.infer<typeof memberSchema>;

export default function NewMemberPage() {
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
    defaultValues: { gender: 'male', status: 'active' },
  });

  const { data: families } = useQuery({
    queryKey: ['families'],
    queryFn: () => apiClient.get('/families').then(r => r.data.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (data: MemberForm) => apiClient.post('/members', data),
    onSuccess: () => {
      toast.success('Member added successfully!');
      router.push('/members');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add member');
    },
  });

  const onSubmit = (data: MemberForm) => {
    // Generate simple sequential memberId in backend automatically, or let it generate
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/members">
          <button className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
            <ArrowLeft size={16} />
          </button>
        </Link>
        <div>
          <h1 className="page-title text-xl">Add New Member</h1>
          <p className="page-subtitle">Register a new person in the Mahallu census registry</p>
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
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Full Name *</label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Muhammed Ali"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Phone Number *</label>
              <input
                type="text"
                {...register('phone')}
                placeholder="e.g. 9876543210"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Gender *</label>
              <select
                {...register('gender')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Date of Birth</label>
              <input
                type="date"
                {...register('dateOfBirth')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Blood Group</label>
              <select
                {...register('bloodGroup')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select Blood Group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Occupation</label>
              <input
                type="text"
                {...register('occupation')}
                placeholder="e.g. Teacher, Business"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Qualification */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Qualification</label>
              <input
                type="text"
                {...register('qualification')}
                placeholder="e.g. B.Tech, SSLC"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Family selection */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Associated Family</label>
              <select
                {...register('familyId')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select Family (Optional)</option>
                {families?.map((f: any) => (
                  <option key={f._id} value={f._id}>{f.familyCode} — Head: {f.headMemberId?.name || 'Unknown'}</option>
                ))}
              </select>
            </div>

            {/* Relationship with head */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Relationship to Head</label>
              <select
                {...register('relationship')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select Relationship</option>
                <option value="Head">Head</option>
                <option value="Spouse">Spouse</option>
                <option value="Son">Son (Child)</option>
                <option value="Daughter">Daughter (Child)</option>
                <option value="Child">Child / Dependent</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Grandson">Grandson</option>
                <option value="Granddaughter">Granddaughter</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Status *</label>
              <select
                {...register('status')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="deceased">Deceased</option>
                <option value="migrated">Migrated</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 border-t border-border/40 pt-4 mt-5">
            <Link href="/members">
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </Link>
            <button
              id="member-submit"
              type="submit"
              disabled={createMutation.isPending}
              className="btn-brand flex items-center gap-2"
            >
              {createMutation.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Saving...</>
              ) : (
                <><Save size={16} /> Save Member</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
