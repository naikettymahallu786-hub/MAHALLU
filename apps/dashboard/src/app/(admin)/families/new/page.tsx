'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, Loader2, Home } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

const familySchema = z.object({
  familyCode: z.string().min(1, 'Family Code is required'),
  headMemberId: z.string().min(1, 'Head of family is required'),
  wardNo: z.string().min(1, 'Ward No is required'),
  address: z.object({
    line1: z.string().min(1, 'Address line 1 is required'),
    city: z.string().min(1, 'City is required'),
    district: z.string().min(1, 'District is required'),
    state: z.string().min(1, 'State is required'),
    pincode: z.string().min(6, 'Pincode must be 6 digits'),
    country: z.string().default('India'),
  }),
  outstandingBalance: z.preprocess((val) => val === '' || val === undefined || val === null || isNaN(Number(val)) ? 0 : Number(val), z.number()).default(0),
  recurringDonationType: z.enum(['monthly', 'yearly', 'none']).default('none'),
  recurringDonationAmount: z.preprocess((val) => val === '' || val === undefined || val === null || isNaN(Number(val)) ? 0 : Number(val), z.number()).default(0),
});

type FamilyForm = z.infer<typeof familySchema>;

export default function NewFamilyPage() {
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<FamilyForm>({
    resolver: zodResolver(familySchema),
    defaultValues: {
      address: {
        city: 'Kozhikode',
        district: 'Kozhikode',
        state: 'Kerala',
        country: 'India',
      },
      outstandingBalance: 0,
      recurringDonationType: 'none',
      recurringDonationAmount: 0,
    },
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: () => apiClient.get('/members').then(r => r.data.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (data: FamilyForm) => apiClient.post('/families', data),
    onSuccess: () => {
      toast.success('Family added successfully!');
      router.push('/families');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add family');
    },
  });

  const onSubmit = (data: FamilyForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/families">
          <button className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
            <ArrowLeft size={16} />
          </button>
        </Link>
        <div>
          <h1 className="page-title text-xl">Create New Family</h1>
          <p className="page-subtitle">Register a new household unit in the Mahallu</p>
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
            {/* Family Code */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Family Code *</label>
              <input
                type="text"
                {...register('familyCode')}
                placeholder="e.g. FAM-0002"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
              />
              {errors.familyCode && <p className="text-red-400 text-xs mt-1">{errors.familyCode.message}</p>}
            </div>

            {/* Head of Family */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Head of Family *</label>
              <select
                {...register('headMemberId')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select Head Member</option>
                {members?.map((m: any) => (
                  <option key={m._id} value={m._id}>{m.name} ({m.phone})</option>
                ))}
              </select>
              {errors.headMemberId && <p className="text-red-400 text-xs mt-1">{errors.headMemberId.message}</p>}
            </div>

            {/* Ward No */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Ward No *</label>
              <input
                type="text"
                {...register('wardNo')}
                placeholder="e.g. Ward 3"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.wardNo && <p className="text-red-400 text-xs mt-1">{errors.wardNo.message}</p>}
            </div>

            {/* Outstanding Balance */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Outstanding Balance (INR)</label>
              <input
                type="number"
                {...register('outstandingBalance', { valueAsNumber: true })}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Recurring Donation Type */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Recurring Donation Frequency *</label>
              <select
                {...register('recurringDonationType')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="none">None</option>
                <option value="monthly">Monthly Subscription</option>
                <option value="yearly">Yearly Donation</option>
              </select>
            </div>

            {/* Recurring Donation Amount */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Recurring Donation Amount (INR) *</label>
              <input
                type="number"
                {...register('recurringDonationAmount', { valueAsNumber: true })}
                placeholder="e.g. 500"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Address line 1 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Address line 1 *</label>
              <input
                type="text"
                {...register('address.line1')}
                placeholder="e.g. House No. 24, Thangal Road"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.address?.line1 && <p className="text-red-400 text-xs mt-1">{errors.address.line1.message}</p>}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">City *</label>
              <input
                type="text"
                {...register('address.city')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.address?.city && <p className="text-red-400 text-xs mt-1">{errors.address.city.message}</p>}
            </div>

            {/* Pincode */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Pincode *</label>
              <input
                type="text"
                {...register('address.pincode')}
                placeholder="673001"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.address?.pincode && <p className="text-red-400 text-xs mt-1">{errors.address.pincode.message}</p>}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 border-t border-border/40 pt-4 mt-5">
            <Link href="/families">
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </Link>
            <button
              id="family-submit"
              type="submit"
              disabled={createMutation.isPending}
              className="btn-brand flex items-center gap-2"
            >
              {createMutation.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Saving...</>
              ) : (
                <><Save size={16} /> Save Family</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
