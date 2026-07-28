'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Building2 as MosqueIcon, User, Calendar, MapPin, Phone, Award, ShieldAlert, Edit2, X, Save, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useForm, Controller } from 'react-hook-form';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { toast } from 'sonner';

export default function MosquePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: mosque, isLoading } = useQuery({
    queryKey: ['mosque'],
    queryFn: () => apiClient.get('/mosque').then(r => r.data.data),
  });

  const { data: prayerTimes } = useQuery({
    queryKey: ['prayer-times'],
    queryFn: () => apiClient.get('/mosque/prayer-times').then(r => r.data.data),
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: () => apiClient.get('/members').then(r => r.data.data || []),
  });

  const { register, handleSubmit, reset, control } = useForm<any>();

  useEffect(() => {
    if (mosque) {
      reset({
        name: mosque.name || '',
        yearEstablished: mosque.yearEstablished || '',
        registrationNo: mosque.registrationNo || '',
        phone: mosque.phone || '',
        email: mosque.email || '',
        address: {
          line1: mosque.address?.line1 || '',
          city: mosque.address?.city || '',
          state: mosque.address?.state || '',
          pincode: mosque.address?.pincode || '',
        },
        imamId: mosque.imamId?._id || mosque.imamId || '',
        muazzinId: mosque.muazzinId?._id || mosque.muazzinId || '',
        facilities: mosque.facilities?.join(', ') || '',
      });
    }
  }, [mosque, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        facilities: typeof data.facilities === 'string' 
          ? data.facilities.split(',').map((f: string) => f.trim()).filter(Boolean)
          : data.facilities,
      };
      return apiClient.post('/mosque', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mosque'] });
      setIsEditModalOpen(false);
      toast.success('Mosque details updated successfully!');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update mosque details');
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 rounded-2xl shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 rounded-2xl shimmer" />
          <div className="h-48 rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('mosque.title')}</h1>
          <p className="page-subtitle">{t('mosque.subtitle')}</p>
        </div>
        <button onClick={() => setIsEditModalOpen(true)} className="btn-secondary flex items-center gap-2">
          <Edit2 size={16} /> Edit Details
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-card lg:col-span-2 space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl gradient-brand flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
              <MosqueIcon size={30} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{mosque?.name || 'Jamia Masjid'}</h2>
              <p className="text-sm text-muted-foreground arabic">مسجد الجامع</p>
              <p className="text-xs text-muted-foreground mt-1">Established in {mosque?.yearEstablished || 1990} · Reg No: {mosque?.registrationNo || 'REG-1203/90'}</p>
            </div>
          </div>

          <div className="border-t border-border pt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t('mosque.address')}</p>
                <p className="text-muted-foreground">
                  {mosque?.address?.line1 || 'Masjid Lane, Town Road'}<br />
                  {mosque?.address?.city || 'Kozhikode'}, {mosque?.address?.state || 'Kerala'} - {mosque?.address?.pincode || '673001'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t('mosque.contact')}</p>
                <p className="text-muted-foreground">Phone: {mosque?.phone || '+91 98765 43210'}</p>
                <p className="text-muted-foreground">Email: {mosque?.email || 'mosque@mahallu.app'}</p>
              </div>
            </div>
          </div>

          {/* Mosque Staff */}
          <div className="border-t border-border pt-5">
            <h3 className="font-semibold mb-4 text-base">{t('mosque.religiousStaff')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Imam / Khatheeb</p>
                  <p className="font-semibold text-sm">{mosque?.imamId?.name || 'Usthad Ahmed Musliyar'}</p>
                  <p className="text-xs text-muted-foreground">{mosque?.imamId?.phone || '+91 98765 43211'}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Muazzin</p>
                  <p className="font-semibold text-sm">{mosque?.muazzinId?.name || 'Usthad Faisal Bilali'}</p>
                  <p className="text-xs text-muted-foreground">{mosque?.muazzinId?.phone || '+91 98765 43212'}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Prayer Times */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="section-card space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-emerald-600" />
            <h2 className="text-base font-semibold">{t('mosque.prayerTimes')}</h2>
          </div>
          <div className="space-y-2.5">
            {prayerTimes ? (
              Object.entries(prayerTimes).map(([name, time]: [string, any]) => (
                <div key={name} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="font-medium capitalize text-sm">{name}</span>
                  <span className="font-bold text-emerald-600">{time}</span>
                </div>
              ))
            ) : (
              // Fallback default times
              [
                { name: 'Fajr', time: '04:55' },
                { name: 'Dhuhr', time: '12:32' },
                { name: 'Asr', time: '15:54' },
                { name: 'Maghrib', time: '18:48' },
                { name: 'Isha', time: '20:05' },
              ].map(item => (
                <div key={item.name} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="font-medium text-sm">{item.name}</span>
                  <span className="font-bold text-emerald-600">{item.time}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Committee & Assets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="section-card"
        >
          <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
            <Award size={18} className="text-emerald-600" />
            {t('mosque.committee')}
          </h3>
          <div className="space-y-3">
            {mosque?.committee?.length > 0 ? (
              mosque.committee.map((member: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div>
                    <p className="font-semibold text-sm">{member.memberId?.name || 'Committee Member'}</p>
                    <p className="text-xs text-muted-foreground">{member.memberId?.phone || ''}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">{member.position}</span>
                </div>
              ))
            ) : (
              [
                { name: 'K. M. Ibrahim Kutty', role: 'President' },
                { name: 'P. A. Faisal Rahman', role: 'Secretary' },
                { name: 'C. H. Abdul Kareem', role: 'Treasurer' },
              ].map((member, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <p className="font-medium text-sm">{member.name}</p>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-semibold">{member.role}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="section-card"
        >
          <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
            <ShieldAlert size={18} className="text-emerald-600" />
            {t('mosque.facilities')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {(mosque?.facilities || ['Ablution Place', 'Library', 'Cemetery Annex', 'Conference Hall', 'Nikah Stage', 'Separate Ladies Area']).map((facility: string, i: number) => (
              <span key={i} className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/10 cursor-default transition-all duration-200">
                {facility}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Edit Mosque Details Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-card z-10">
              <h2 className="font-bold text-lg">Edit Mosque Details</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-muted rounded-full">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <form id="mosque-form" onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Mosque Name *</label>
                    <input type="text" {...register('name', { required: true })} className="w-full px-4 py-2 rounded-xl border bg-background text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Established Year</label>
                    <input type="number" {...register('yearEstablished')} className="w-full px-4 py-2 rounded-xl border bg-background text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Registration Number</label>
                    <input type="text" {...register('registrationNo')} className="w-full px-4 py-2 rounded-xl border bg-background text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Phone</label>
                    <input type="text" {...register('phone')} className="w-full px-4 py-2 rounded-xl border bg-background text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Email</label>
                    <input type="email" {...register('email')} className="w-full px-4 py-2 rounded-xl border bg-background text-sm" />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h3 className="font-semibold text-sm">Address Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs text-muted-foreground mb-1">Address Line 1</label>
                      <input type="text" {...register('address.line1')} className="w-full px-4 py-2 rounded-xl border bg-background text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">City</label>
                      <input type="text" {...register('address.city')} className="w-full px-4 py-2 rounded-xl border bg-background text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">State</label>
                      <input type="text" {...register('address.state')} className="w-full px-4 py-2 rounded-xl border bg-background text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Pincode</label>
                      <input type="text" {...register('address.pincode')} className="w-full px-4 py-2 rounded-xl border bg-background text-sm" />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h3 className="font-semibold text-sm">Religious Staff (Usthadhs)</h3>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Imam / Khatheeb</label>
                    <Controller
                      control={control}
                      name="imamId"
                      render={({ field }) => (
                        <SearchableSelect
                          options={members?.map((m: any) => ({ value: m._id, label: m.name })) || []}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select Imam"
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Muazzin</label>
                    <Controller
                      control={control}
                      name="muazzinId"
                      render={({ field }) => (
                        <SearchableSelect
                          options={members?.map((m: any) => ({ value: m._id, label: m.name })) || []}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select Muazzin"
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium mb-1.5">Facilities (Comma separated)</label>
                  <input type="text" {...register('facilities')} placeholder="Ablution Place, Library, Cemetery" className="w-full px-4 py-2 rounded-xl border bg-background text-sm" />
                </div>
              </form>
            </div>
            <div className="p-4 border-t flex justify-end gap-2 bg-muted/20 sticky bottom-0">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm border rounded-xl hover:bg-muted bg-background">
                Cancel
              </button>
              <button
                type="submit"
                form="mosque-form"
                disabled={updateMutation.isPending}
                className="btn-brand flex items-center gap-2"
              >
                {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
