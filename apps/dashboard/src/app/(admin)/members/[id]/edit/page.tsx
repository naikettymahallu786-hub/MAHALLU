'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
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

export default function EditMemberPage() {
  const router = useRouter();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginId, setLoginId] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
  });

  const { data: memberRes, isLoading: isMemberLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => apiClient.get(`/members/${id}`).then(r => r.data.data),
  });

  const { data: families } = useQuery({
    queryKey: ['families'],
    queryFn: () => apiClient.get('/families').then(r => r.data.data || []),
  });

  useEffect(() => {
    if (memberRes) {
      reset({
        name: memberRes.name,
        phone: memberRes.phone,
        gender: memberRes.gender,
        dateOfBirth: memberRes.dateOfBirth ? new Date(memberRes.dateOfBirth).toISOString().split('T')[0] : '',
        bloodGroup: memberRes.bloodGroup || '',
        occupation: memberRes.occupation || '',
        qualification: memberRes.qualification || '',
        relationship: memberRes.relationship || '',
        status: memberRes.status || 'active',
        familyId: memberRes.familyId?._id || '',
      });
      if (memberRes.userId) {
        setLoginId(memberRes.userId.email || memberRes.userId.phone || '');
      } else {
        setLoginId(memberRes.phone || '');
      }
    }
  }, [memberRes, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: MemberForm) => apiClient.put(`/members/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', id] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member profile updated successfully!');
      router.push(`/members/${id}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update member');
    },
  });

  const onSubmit = (data: MemberForm) => {
    updateMutation.mutate(data);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters long');
    }
    if (newPassword && newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    try {
      setIsResetting(true);
      await apiClient.post(`/auth/${id}/admin-reset-password`, { newPassword, loginId });
      toast.success('Security credentials updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update credentials');
    } finally {
      setIsResetting(false);
    }
  };

  if (isMemberLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="h-96 rounded-2xl shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/members/${id}`}>
          <button className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
            <ArrowLeft size={16} />
          </button>
        </Link>
        <div>
          <h1 className="page-title text-xl">Edit Member Profile</h1>
          <p className="page-subtitle">Update census details for {memberRes?.name}</p>
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
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Qualification */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Qualification</label>
              <input
                type="text"
                {...register('qualification')}
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
            <Link href={`/members/${id}`}>
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </Link>
            <button
              id="member-update-submit"
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

      {/* Security Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="section-card space-y-6"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck size={20} />
          </div>
          <h2 className="text-lg font-bold">Security & Access</h2>
        </div>

        <div className="max-w-md space-y-6">
          <div>
            <h3 className="font-semibold text-foreground mb-1">Update Security Credentials</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Update the login ID (Phone or Email) and reset the password for this member.
            </p>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Login ID (Phone/Email)</label>
              <input 
                type="text" 
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                className="form-input w-full" 
                placeholder="Enter email or phone number" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="form-input w-full" 
                placeholder="Enter new password (optional)" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="form-input w-full" 
                placeholder="Confirm new password" 
              />
            </div>

            <button 
              type="submit"
              disabled={isResetting || !newPassword || !confirmPassword}
              className="btn-brand w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResetting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
