'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Save, ArrowLeft, Loader2, Plus, Trash2, Image as ImageIcon, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export default function NewEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get('templateId');

  const [selectedTemplateId, setSelectedTemplateId] = useState(templateIdParam || '');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  const { register, control, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      title: '',
      description: '',
      date: '',
      endDate: '',
      venue: '',
      capacity: '',
      fee: '',
      isPaid: false,
      isFeatured: false,
      committeeMembers: [{ memberId: '', role: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'committeeMembers',
  });

  // Fetch Event Templates
  const { data: templatesData } = useQuery({
    queryKey: ['event-templates'],
    queryFn: () => apiClient.get('/event-templates').then((r) => r.data.data || []),
  });
  const templates = templatesData || [];

  const activeTemplate = templates.find((t: any) => t._id === selectedTemplateId);

  // Auto-fill form when template is selected
  useEffect(() => {
    if (activeTemplate) {
      if (activeTemplate.name) setValue('title', activeTemplate.name);

      const initialVars: Record<string, string> = {};
      activeTemplate.variables?.forEach((v: any) => {
        initialVars[v.key] = v.defaultValue || '';
      });
      setVariableValues(initialVars);

      if (initialVars['VENUE_NAME']) setValue('venue', initialVars['VENUE_NAME']);
      if (activeTemplate.noticeTemplateText) {
        setValue('description', activeTemplate.noticeTemplateText);
      }
    }
  }, [selectedTemplateId, activeTemplate, setValue]);

  // Handle Variable Value Change
  const handleVariableChange = (key: string, value: string) => {
    const updated = { ...variableValues, [key]: value };
    setVariableValues(updated);

    if (key === 'VENUE_NAME') setValue('venue', value);
    if (key === 'ANNIVERSARY_TITLE' || key === 'EVENT_TITLE') setValue('title', value);

    // Update formatted description text
    if (activeTemplate?.noticeTemplateText) {
      let formattedText = activeTemplate.noticeTemplateText;
      Object.keys(updated).forEach((k) => {
        formattedText = formattedText.replace(new RegExp(`{{${k}}}`, 'g'), updated[k] || '');
      });
      setValue('description', formattedText);
    }
  };

  const { data: membersData } = useQuery({
    queryKey: ['all-members-list'],
    queryFn: () => apiClient.get('/members', { params: { limit: 5000 } }).then((r) => r.data.data || []),
  });
  const members = Array.isArray(membersData) ? membersData : (membersData as any)?.items || [];

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/events', data),
    onSuccess: () => {
      toast.success('Community event created successfully!');
      router.push('/events');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create event'),
  });

  const onSubmit = async (data: any) => {
    try {
      const payload = { ...data };
      if (bannerFile) {
        payload.banner = { url: await toBase64(bannerFile) };
      }
      if (bgFile) {
        payload.idCardBgImage = { url: await toBase64(bgFile) };
      }

      // Include template program schedule if applied
      if (activeTemplate?.programSchedule) {
        payload.programSchedule = activeTemplate.programSchedule;
      }

      payload.committeeMembers = payload.committeeMembers.filter((cm: any) => cm.memberId && cm.role);

      createMutation.mutate(payload);
    } catch (e) {
      toast.error('Failed to process image uploads');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div className="flex items-center gap-4">
        <Link href="/events" className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="page-title">Create Community Event</h1>
          <p className="page-subtitle">Schedule a new program, gathering, or Islamic conference notice</p>
        </div>
      </div>

      {/* Template Selector Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 p-6 rounded-3xl text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h2 className="font-extrabold text-base text-white">⚡ Choose Event Program Template</h2>
          </div>
          <Link href="/events/templates" className="text-xs text-emerald-300 hover:underline font-bold">
            + Manage / Create Templates
          </Link>
        </div>

        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="">-- Standard Event (No Template) --</option>
          {templates.map((t: any) => (
            <option key={t._id} value={t._id}>
              {t.name} ({t.category})
            </option>
          ))}
        </select>

        {activeTemplate && (
          <div className="bg-white/10 p-4 rounded-2xl space-y-3 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-300 uppercase">
                Active Template: {activeTemplate.name}
              </span>
              <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-2.5 py-0.5 rounded-full">
                Auto-applied
              </span>
            </div>

            {/* Template Dynamic Variable Inputs */}
            {activeTemplate.variables?.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <p className="text-xs font-bold text-slate-300">Fill Program Variables (മലയാളം വിവരങ്ങൾ നൽക്കുക):</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeTemplate.variables.map((v: any) => (
                    <div key={v.key}>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">{v.label}</label>
                      <input
                        type="text"
                        value={variableValues[v.key] ?? v.defaultValue ?? ''}
                        onChange={(e) => handleVariableChange(v.key, e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="section-card space-y-4">
          <h2 className="font-bold text-lg border-b pb-2">Event Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Event Title *</label>
              <input
                type="text"
                {...register('title', { required: true })}
                placeholder="e.g. Annual Meelad Conference 2026"
                className="w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Description / Program Notice Text</label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="Provide event details, schedule, or Malayalam flyer notice..."
                className="w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm font-medium font-sans"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  {...register('date', { required: true })}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">End Date & Time</label>
                <input
                  type="datetime-local"
                  {...register('endDate')}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Venue Location</label>
                <input
                  type="text"
                  {...register('venue')}
                  placeholder="e.g. Mahallu Auditorium / Main Hall"
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Capacity (Max Attendees)</label>
                <input
                  type="number"
                  {...register('capacity')}
                  placeholder="e.g. 500 (leave blank for unlimited)"
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & Visibility */}
        <div className="section-card space-y-4">
          <h2 className="font-bold text-lg border-b pb-2">Ticket & Visibility</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-muted/20">
              <input type="checkbox" id="isPaid" {...register('isPaid')} className="w-4 h-4 text-emerald-600 rounded" />
              <label htmlFor="isPaid" className="text-sm font-medium cursor-pointer">
                Paid Event (Requires Registration Fee)
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Ticket Fee (INR)</label>
              <input
                type="number"
                {...register('fee')}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Branding & ID Card Images */}
        <div className="section-card space-y-4">
          <h2 className="font-bold text-lg border-b pb-2">Branding & Committee ID Card Design</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Banner Image */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase">Event Banner Image</label>
              <div className="border-2 border-dashed border-border hover:border-emerald-500/50 rounded-2xl p-4 text-center transition-colors">
                <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                  className="text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 dark:file:bg-emerald-950 dark:file:text-emerald-300 hover:file:bg-emerald-100"
                />
                {bannerFile && <p className="text-xs text-emerald-600 font-bold mt-2">Selected: {bannerFile.name}</p>}
              </div>
            </div>

            {/* Committee ID Card Background Image */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase">
                Committee ID Card Background Image
              </label>
              <div className="border-2 border-dashed border-border hover:border-emerald-500/50 rounded-2xl p-4 text-center transition-colors">
                <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBgFile(e.target.files?.[0] || null)}
                  className="text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 dark:file:bg-emerald-950 dark:file:text-emerald-300 hover:file:bg-emerald-100"
                />
                {bgFile && <p className="text-xs text-emerald-600 font-bold mt-2">Selected: {bgFile.name}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Committee Members */}
        <div className="section-card space-y-4">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h2 className="font-bold text-lg">Event Committee</h2>
            <button
              type="button"
              onClick={() => append({ memberId: '', role: '' })}
              className="text-xs font-semibold text-emerald-600 flex items-center gap-1 hover:underline"
            >
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
                          options={
                            members?.map((m: any) => ({
                              value: m._id,
                              label: `${m.name} ${m.memberId ? `(${m.memberId})` : ''} ${
                                m.phone ? `- 📞 ${m.phone}` : ''
                              }`,
                            })) || []
                          }
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="-- Search & Choose Member --"
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Assigned Role</label>
                    <input
                      type="text"
                      {...register(`committeeMembers.${index}.role`)}
                      placeholder="e.g. Volunteer, Coordinator, Speaker"
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg mt-6"
                >
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
          <Link href="/events">
            <button type="button" className="px-5 py-3 rounded-xl border text-sm font-semibold shadow-sm">
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-brand flex items-center gap-2 shadow-lg shadow-emerald-500/20 px-6 py-3 cursor-pointer"
          >
            {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Create Event
          </button>
        </div>
      </form>
    </div>
  );
}
