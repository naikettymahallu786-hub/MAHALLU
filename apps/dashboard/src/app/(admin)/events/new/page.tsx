'use client';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Save, ArrowLeft, Loader2, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = error => reject(error);
});

export default function NewEventPage() {
  const router = useRouter();
  const { register, control, handleSubmit } = useForm({
    defaultValues: {
      title: '', description: '', date: '', endDate: '', venue: '',
      capacity: '', fee: '', isPaid: false, isFeatured: false,
      committeeMembers: [{ memberId: '', role: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "committeeMembers"
  });

  const { data: members } = useQuery({ 
    queryKey: ['members'], 
    queryFn: () => apiClient.get('/members').then(r => r.data.data || []) 
  });

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/events', data),
    onSuccess: () => {
      toast.success('Community event created!');
      router.push('/events');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create event')
  });

  const onSubmit = async (data: any) => {
    try {
      const payload = { ...data };
      
      // Clean up committee members (remove empty ones)
      payload.committeeMembers = payload.committeeMembers.filter(
        (m: any) => m.memberId && m.role
      );

      if (bannerFile) {
        const base64 = await toBase64(bannerFile);
        payload.banner = { url: base64 };
      }
      
      if (bgFile) {
        const base64 = await toBase64(bgFile);
        payload.idCardBgImage = { url: base64 };
      }

      createMutation.mutate(payload);
    } catch (e) {
      toast.error('Failed to process images');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Link href="/events"><button className="p-2 rounded-xl border"><ArrowLeft size={16} /></button></Link>
        <div>
          <h1 className="page-title text-xl">Create Event</h1>
          <p className="page-subtitle font-medium">Publish a new program announcement</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Details */}
        <div className="section-card space-y-4">
          <h2 className="font-bold text-lg border-b pb-2 mb-4">Event Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Event Title *</label>
              <input type="text" {...register('title', { required: true })} placeholder="e.g. Monthly Majlis" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea {...register('description')} rows={3} placeholder="Provide program details..." className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Start Date *</label>
              <input type="datetime-local" {...register('date', { required: true })} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">End Date (Optional)</label>
              <input type="datetime-local" {...register('endDate')} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Venue *</label>
              <input type="text" {...register('venue', { required: true })} placeholder="e.g. Mosque Hall" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Total capacity</label>
              <input type="number" {...register('capacity', { valueAsNumber: true })} placeholder="150" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
          </div>
        </div>

        {/* Media Uploads */}
        <div className="section-card space-y-4">
          <h2 className="font-bold text-lg border-b pb-2 mb-4">Media & ID Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2">
              <ImageIcon size={32} className="text-muted-foreground" />
              <label className="text-sm font-semibold cursor-pointer text-brand hover:underline">
                Upload Event Banner
                <input type="file" className="hidden" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} />
              </label>
              <p className="text-xs text-muted-foreground">{bannerFile ? bannerFile.name : 'Optional display banner'}</p>
            </div>
            
            <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2">
              <ImageIcon size={32} className="text-muted-foreground" />
              <label className="text-sm font-semibold cursor-pointer text-indigo-600 hover:underline">
                Upload ID Card Background
                <input type="file" className="hidden" accept="image/*" onChange={(e) => setBgFile(e.target.files?.[0] || null)} />
              </label>
              <p className="text-xs text-muted-foreground">{bgFile ? bgFile.name : 'Used for generating volunteer ID cards'}</p>
            </div>
          </div>
        </div>

        {/* Committee Members */}
        <div className="section-card space-y-4">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h2 className="font-bold text-lg">Event Committee</h2>
            <button type="button" onClick={() => append({ memberId: '', role: '' })} className="text-xs font-semibold text-brand flex items-center gap-1 hover:underline">
              <Plus size={14} /> Add Member
            </button>
          </div>
          
          <div className="space-y-3">
            {fields.map((item, index) => (
              <div key={item.id} className="flex items-start gap-3 bg-muted/20 p-3 rounded-xl border border-border/50">
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Select Member</label>
                    <Controller
                      control={control}
                      name={`committeeMembers.${index}.memberId`}
                      render={({ field }) => (
                        <SearchableSelect
                          options={members?.map((m: any) => ({ value: m._id, label: `${m.name} (${m.phone || 'No phone'})` })) || []}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="-- Choose Member --"
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Assigned Role</label>
                    <input type="text" {...register(`committeeMembers.${index}.role`)} placeholder="e.g. Volunteer, Coordinator, Speaker" className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
                  </div>
                </div>
                <button type="button" onClick={() => remove(index)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg mt-6">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No committee members added.</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Link href="/events"><button type="button" className="px-5 py-3 rounded-xl border text-sm font-semibold shadow-sm">Cancel</button></Link>
          <button type="submit" disabled={createMutation.isPending} className="btn-brand flex items-center gap-2 shadow-lg shadow-emerald-500/20 px-6 py-3">
            {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Create Event
          </button>
        </div>
      </form>
    </div>
  );
}
