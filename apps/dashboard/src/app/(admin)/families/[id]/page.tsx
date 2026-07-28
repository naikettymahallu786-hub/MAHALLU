'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, MapPin, Users, Heart, Home, AlertCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function FamilyEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ['family', id],
    queryFn: () => apiClient.get(`/families/${id}`).then(r => r.data),
  });

  const family = response?.data;

  const { register, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm({
    defaultValues: {
      address: {
        line1: '',
        city: '',
        district: '',
        state: '',
        pincode: '',
      },
      wardNo: '',
      recurringDonationType: 'none',
      recurringDonationAmount: 0,
      outstandingBalance: 0,
    }
  });

  useEffect(() => {
    if (family) {
      reset({
        address: family.address || {},
        wardNo: family.wardNo || '',
        recurringDonationType: family.recurringDonationType || 'none',
        recurringDonationAmount: family.recurringDonationAmount || 0,
        outstandingBalance: family.outstandingBalance || 0,
      });
    }
  }, [family, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.put(`/families/${id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('Family details updated successfully');
      queryClient.invalidateQueries({ queryKey: ['family', id] });
      queryClient.invalidateQueries({ queryKey: ['families'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update family');
    }
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="page-header shimmer h-24 rounded-2xl" />
        <div className="section-card shimmer h-96 rounded-2xl" />
      </div>
    );
  }

  if (!family) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Family Not Found</h2>
        <p className="text-muted-foreground mb-6">The family you're looking for does not exist or has been deleted.</p>
        <Link href="/families">
          <button className="btn-brand">Back to Families</button>
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview & Address', icon: MapPin },
    { id: 'members', label: 'Family Members', icon: Users },
    { id: 'donations', label: 'Donations & Finance', icon: Heart },
    { id: 'security', label: 'Security & Access', icon: ShieldCheck },
  ];

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters long');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    try {
      setIsResetting(true);
      await apiClient.post(`/auth/${family.headMemberId._id}/admin-reset-password`, { newPassword });
      toast.success('Password reset successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link href="/families">
            <button className="p-2 rounded-xl hover:bg-muted transition-colors border border-border bg-background">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">{family.headMemberId?.name || 'Family Details'}</h1>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold">
                {family.familyCode}
              </span>
            </div>
            <p className="page-subtitle">Manage family details, members, and recurring donations</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSubmit(onSubmit)}
            disabled={!isDirty || isSubmitting}
            className={cn("flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm",
              isDirty ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20" 
                      : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Save size={16} />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                activeTab === tab.id 
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 shadow-sm" 
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <tab.icon size={18} className={activeTab === tab.id ? "text-emerald-600 dark:text-emerald-400" : "opacity-50"} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="section-card space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <MapPin size={20} />
                  </div>
                  <h2 className="text-lg font-bold">Address & Location</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">Address Line 1 (House Name/Number)</label>
                    <input {...register('address.line1')} className="form-input w-full" placeholder="House name or number" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">City</label>
                    <input {...register('address.city')} className="form-input w-full" placeholder="City" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">District</label>
                    <input {...register('address.district')} className="form-input w-full" placeholder="District" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">State</label>
                    <input {...register('address.state')} className="form-input w-full" placeholder="State" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Pincode</label>
                    <input {...register('address.pincode')} className="form-input w-full" placeholder="Pincode" />
                  </div>
                  
                  <div className="space-y-2 pt-4 md:col-span-2 border-t border-border">
                    <label className="text-sm font-medium text-foreground">Ward Number</label>
                    <input {...register('wardNo')} className="form-input w-full md:w-1/2" placeholder="e.g. Ward 5" />
                    <p className="text-xs text-muted-foreground mt-1">Specify which ward or zone this family belongs to.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MEMBERS TAB */}
            {activeTab === 'members' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="section-card space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <Users size={20} />
                    </div>
                    <h2 className="text-lg font-bold">Family Members ({family.members?.length || 0})</h2>
                  </div>
                  <Link href={`/members/new?familyId=${family._id}`}>
                    <button type="button" className="text-sm bg-muted px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors font-medium">
                      + Add Member
                    </button>
                  </Link>
                </div>

                <div className="space-y-3">
                  {family.members?.map((fm: any) => {
                    const member = fm.memberId;
                    if (!member) return null;
                    return (
                      <div key={member._id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-emerald-500/30 transition-colors bg-background">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-500">
                            {member.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-foreground">{member.name}</p>
                              {fm.isHead && (
                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Head</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{fm.relationship} • {member.phone}</p>
                          </div>
                        </div>
                        <Link href={`/members/${member._id}`}>
                          <button type="button" className="text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:underline">View Profile</button>
                        </Link>
                      </div>
                    );
                  })}
                  
                  {(!family.members || family.members.length === 0) && (
                    <div className="py-12 text-center text-muted-foreground">
                      <Users size={40} className="mx-auto mb-3 opacity-20" />
                      <p>No family members found.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* DONATIONS TAB */}
            {activeTab === 'donations' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="section-card space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                    <Heart size={20} />
                  </div>
                  <h2 className="text-lg font-bold">Donations & Finances</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Recurring Donation Setup</h3>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Donation Frequency</label>
                      <select {...register('recurringDonationType')} className="form-input w-full bg-background">
                        <option value="none">None</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Recurring Amount (₹)</label>
                      <input 
                        type="number" 
                        {...register('recurringDonationAmount', { valueAsNumber: true })} 
                        className="form-input w-full" 
                        placeholder="0" 
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Current Balances</h3>
                    
                    <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-900/30 dark:bg-rose-900/10">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-rose-600 dark:text-rose-400 font-bold">Outstanding Balance</p>
                        <AlertCircle size={18} className="text-rose-500" />
                      </div>
                      <p className="text-3xl font-black text-rose-700 dark:text-rose-300">
                        {formatCurrency(family.outstandingBalance || 0)}
                      </p>
                      <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mt-2">
                        This is the total pending amount for this family's dues.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Manually Adjust Balance (₹)</label>
                      <input 
                        type="number" 
                        {...register('outstandingBalance', { valueAsNumber: true })} 
                        className="form-input w-full" 
                        placeholder="0" 
                      />
                      <p className="text-xs text-muted-foreground">Only adjust manually if necessary.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </form>

          {/* SECURITY TAB (Outside main form so it handles its own submit) */}
          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="section-card space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-lg font-bold">Security & Access</h2>
              </div>

              <div className="max-w-md space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Admin Password Reset</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Reset the login password for the Head of Family. They will be able to log in immediately with the new password.
                  </p>
                </div>

                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="form-input w-full" 
                      placeholder="Enter new password" 
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
          )}
        </div>
      </div>
    </div>
  );
}
