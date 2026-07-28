'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Settings, Save, ShieldAlert, Loader2, Bell, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function SettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiClient.get('/settings').then(r => r.data.data),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    if (settingsData) {
      reset({
        mahalluName: settingsData.general?.mahalluName,
        phone: settingsData.general?.phone,
        email: settingsData.general?.email,
        address: settingsData.general?.address,
        whatsappEnabled: settingsData.notifications?.whatsappEnabled,
        smsEnabled: settingsData.notifications?.smsEnabled,
        emailEnabled: settingsData.notifications?.emailEnabled,
        pushEnabled: settingsData.notifications?.pushEnabled,
        currency: settingsData.finance?.currency || 'INR',
        autoReceiptEnabled: settingsData.finance?.autoReceiptEnabled,
        iqamahTimes: settingsData.iqamahTimes || {
          Fajr: '05:30', Dhuhr: '13:30', Asr: '16:30', Maghrib: '18:45', Isha: '20:00', Jumuah: '13:30'
        },
      });
    }
  }, [settingsData, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        general: {
          mahalluName: data.mahalluName,
          phone: data.phone,
          email: data.email,
          address: data.address,
        },
        notifications: {
          whatsappEnabled: data.whatsappEnabled,
          smsEnabled: data.smsEnabled,
          emailEnabled: data.emailEnabled,
          pushEnabled: data.pushEnabled,
        },
        finance: {
          currency: data.currency,
          autoReceiptEnabled: data.autoReceiptEnabled,
        },
        iqamahTimes: data.iqamahTimes,
      };
      return apiClient.put('/settings', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 rounded-2xl shimmer" />
        <div className="h-64 rounded-2xl shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('settings.title')}</h1>
          <p className="page-subtitle">{t('settings.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* General settings */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="section-card lg:col-span-2 space-y-5"
          >
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2 border-b border-border/40 pb-3">
              <Settings size={18} className="text-emerald-600" />
              {t('settings.generalDetails')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('settings.mahalluName')}</label>
                <input
                  type="text"
                  {...register('mahalluName')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('settings.phone')}</label>
                <input
                  type="text"
                  {...register('phone')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('settings.email')}</label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('settings.address')}</label>
                <input
                  type="text"
                  {...register('address')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Finance Details */}
            <h3 className="font-semibold text-base pt-4 flex items-center gap-2 border-b border-border/40 pb-3">
              <ShieldCheck size={18} className="text-emerald-600" />
              {t('settings.financeDefaults')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('settings.baseCurrency')}</label>
                <select
                  {...register('currency')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="AED">UAE Dirham (AED)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-8 pl-1">
                <input
                  type="checkbox"
                  id="autoReceiptEnabled"
                  {...register('autoReceiptEnabled')}
                  className="w-4 h-4 text-emerald-600 border-border rounded focus:ring-emerald-500"
                />
                <label htmlFor="autoReceiptEnabled" className="text-sm font-medium text-foreground cursor-pointer">
                  {t('settings.autoReceipt')}
                </label>
              </div>
            </div>

            {/* Prayer Times Details */}
            <h3 className="font-semibold text-base pt-4 flex items-center gap-2 border-b border-border/40 pb-3">
              <Settings size={18} className="text-emerald-600" />
              {t('settings.namazTimes')}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Jumuah'].map(prayer => (
                <div key={prayer}>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">{prayer}</label>
                  <input
                    type="time"
                    {...register(`iqamahTimes.${prayer}`)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              ))}
            </div>

          </motion.div>

          {/* Notifications Toggles */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="section-card flex flex-col justify-between"
          >
            <div className="space-y-4">
              <h3 className="font-semibold text-base flex items-center gap-2 border-b border-border/40 pb-3">
                <Bell size={18} className="text-emerald-600" />
                {t('settings.notificationChannels')}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">{t('settings.notificationDesc')}</p>

              {[
                { name: 'whatsappEnabled', label: t('settings.whatsappAlerts'), desc: t('settings.whatsappDesc') },
                { name: 'smsEnabled', label: t('settings.smsNotifications'), desc: t('settings.smsDesc') },
                { name: 'emailEnabled', label: t('settings.emailConfirmations'), desc: t('settings.emailDesc') },
                { name: 'pushEnabled', label: t('settings.pushNotifications'), desc: t('settings.pushDesc') },
              ].map(ch => (
                <div key={ch.name} className="flex items-start justify-between p-3 rounded-xl border border-border/60 hover:bg-muted/40 transition-colors select-none">
                  <div>
                    <label htmlFor={ch.name} className="text-sm font-semibold block cursor-pointer">{ch.label}</label>
                    <span className="text-[10px] text-muted-foreground">{ch.desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    id={ch.name}
                    {...register(ch.name)}
                    className="w-4 h-4 text-emerald-600 border-border rounded focus:ring-emerald-500 mt-1 cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <button
              id="save-settings-btn"
              type="submit"
              disabled={isSubmitting}
              className="btn-brand w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white mt-6 transition-all duration-200 hover:opacity-90"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> {t('settings.saving')}</>
              ) : (
                <><Save size={16} /> {t('settings.save')}</>
              )}
            </button>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
