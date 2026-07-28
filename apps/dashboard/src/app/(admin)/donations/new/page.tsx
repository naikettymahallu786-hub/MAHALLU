'use client';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

import { useState } from 'react';

export default function NewDonationPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [customCampaignActive, setCustomCampaignActive] = useState(false);
  const { register, handleSubmit, setValue, control } = useForm<any>({ defaultValues: { isAnonymous: false, campaign: 'General Sadaqah' } });

  const { data: families } = useQuery({
    queryKey: ['families'],
    queryFn: () => apiClient.get('/families').then(r => r.data.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/donations', data),
    onSuccess: () => {
      toast.success('Donation entry logged!');
      router.push('/donations');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to add donation')
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/donations"><button className="p-2 rounded-xl border"><ArrowLeft size={16} /></button></Link>
        <div>
          <h1 className="page-title text-xl">{t('collect_donation_page.title')}</h1>
          <p className="page-subtitle font-medium">{t('collect_donation_page.subtitle')}</p>
        </div>
      </div>
      <div className="section-card">
        <form onSubmit={handleSubmit(d => {
          const payload = { ...d };
          if (!payload.familyId) delete payload.familyId;
          createMutation.mutate(payload);
        })} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('collect_donation_page.donorName')}</label>
              <input type="text" {...register('donorName')} placeholder={t('collect_donation_page.donorPlaceholder')} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('collect_donation_page.amount')}</label>
              <input type="number" {...register('amount', { required: true, valueAsNumber: true })} placeholder="1000" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('collect_donation_page.campaignName')}</label>
              {!customCampaignActive ? (
                <select 
                  {...register('campaign', { required: true })}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setCustomCampaignActive(true);
                      setValue('campaign', '');
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm"
                >
                  <option value="General Sadaqah">General Sadaqah</option>
                  <option value="Mosque Renovation">Mosque Renovation</option>
                  <option value="Orphan Support">Orphan Support</option>
                  <option value="Madrasa Fund">Madrasa Fund</option>
                  <option value="custom">{t('collect_donation_page.customCampaign')}</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    {...register('campaign', { required: true })} 
                    className="flex-1 px-4 py-2.5 rounded-xl border bg-background text-sm" 
                    placeholder="Type custom campaign name..."
                    autoFocus
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      setCustomCampaignActive(false);
                      setValue('campaign', 'General Sadaqah');
                    }}
                    className="px-3 rounded-xl border text-xs font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors"
                  >
                    Choose List
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('collect_donation_page.family')}</label>
              <Controller
                control={control}
                name="familyId"
                render={({ field }) => (
                  <SearchableSelect
                    options={families?.map((f: any) => ({ value: f._id, label: `${f.familyCode} - ${f.headMemberId?.name || 'Unknown'}` })) || []}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('collect_donation_page.selectFamily') || 'Select Family'}
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('collect_donation_page.paymentMethod')}</label>
              <select {...register('gateway')} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm">
                <option value="cash">{t('collect_donation_page.collectedByHand')}</option>
                <option value="upi">{t('collect_donation_page.gpay')}</option>
                <option value="bank_transfer">{t('collect_donation_page.bankTransfer')}</option>
                <option value="">{t('collect_donation_page.payLater')}</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-8">
              <input type="checkbox" id="isAnonymous" {...register('isAnonymous')} className="w-4 h-4 rounded border-border" />
              <label htmlFor="isAnonymous" className="text-sm font-medium cursor-pointer">{t('collect_donation_page.anonymous')}</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href="/donations"><button type="button" className="px-5 py-2.5 rounded-xl border text-sm font-semibold">{t('collect_donation_page.cancel')}</button></Link>
            <button type="submit" disabled={createMutation.isPending} className="btn-brand flex items-center gap-2">
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {t('collect_donation_page.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
