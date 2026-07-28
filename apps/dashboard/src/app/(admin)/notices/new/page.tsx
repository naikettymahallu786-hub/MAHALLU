'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export default function NewNoticePage() {
  const router = useRouter();
  const { register, handleSubmit } = useForm<any>({ defaultValues: { channel: 'whatsapp', status: 'pending' } });

  const createMutation = useMutation<any, any, any>({
    mutationFn: (data) => apiClient.post('/notices', data),
    onSuccess: () => {
      toast.success('Notice published successfully!');
      router.push('/notices');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to publish notice')
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/notices"><button className="p-2 rounded-xl border"><ArrowLeft size={16} /></button></Link>
        <div>
          <h1 className="page-title text-xl">Publish Announcement</h1>
          <p className="page-subtitle font-medium">Broadcast notices to members</p>
        </div>
      </div>
      <div className="section-card">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Notice Title *</label>
              <input type="text" {...register('title', { required: true })} placeholder="e.g. Prayer Time Change" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Message Body *</label>
              <textarea {...register('body', { required: true })} rows={4} placeholder="Type announcement description..." className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Broadcast Channel *</label>
              <select {...register('channel', { required: true })} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm">
                <option value="whatsapp">WhatsApp bot</option>
                <option value="sms">Carrier SMS</option>
                <option value="email">SMTP Email</option>
                <option value="push">Mobile Push Notification</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href="/notices"><button type="button" className="px-5 py-2.5 rounded-xl border text-sm font-semibold">Cancel</button></Link>
            <button type="submit" disabled={createMutation.isPending} className="btn-brand flex items-center gap-2">
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Send Notice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
