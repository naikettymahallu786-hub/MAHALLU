'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  ArrowLeft,
  Sparkles,
  Calendar,
  Clock,
  User,
  Users,
  MapPin,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Copy,
  Printer,
  X,
  Share2,
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export default function EventTemplatesPage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State for Template Creation/Editing
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('Religious Conference');
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [noticeText, setNoticeText] = useState('');
  const [variables, setVariables] = useState<any[]>([
    { key: 'EVENT_TITLE', label: 'Event Title / പരിപാടി ശീർഷകം', defaultValue: 'വാർഷിക സമ്മേളനം' },
    { key: 'VENUE', label: 'Venue / സ്ഥലം', defaultValue: 'മഖാം ജുമാ മസ്ജിദ് അങ്കണം' },
  ]);
  const [scheduleItems, setScheduleItems] = useState<any[]>([
    {
      dayNumber: 1,
      dateText: '30 ഏപ്രിൽ',
      sessionTime: '8.00 PM',
      sessionTitle: 'മത പ്രഭാഷണം',
      keynoteSpeaker: 'ഉസ്താദ് കെ. ബഷീർ ബാഖവി',
      voteOfThanks: 'കൺവീനർ',
    },
  ]);

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['event-templates'],
    queryFn: () => apiClient.get('/event-templates').then((r) => r.data.data || []),
  });

  const templates = templatesData || [];

  // Extract unique categories across DB templates
  const allCategories = Array.from(
    new Set([
      'Religious Conference',
      'Swalath / Religious Gathering',
      'Madrasa Festival',
      'General Meeting',
      ...templates.map((t: any) => t.category).filter(Boolean),
    ])
  );

  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : templates.filter((t: any) => t.category === selectedCategory);

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/event-templates/${id}`),
    onSuccess: () => {
      toast.success('Template deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['event-templates'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete template'),
  });

  // Save Template Mutation
  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      editingTemplate
        ? apiClient.put(`/event-templates/${editingTemplate._id}`, data)
        : apiClient.post('/event-templates', data),
    onSuccess: () => {
      toast.success(editingTemplate ? 'Template updated!' : 'New Event Template created!');
      setIsCreateModalOpen(false);
      setEditingTemplate(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['event-templates'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save template'),
  });

  const resetForm = () => {
    setTemplateName('');
    setTemplateCategory('Religious Conference');
    setIsCustomCategoryMode(false);
    setCustomCategoryInput('');
    setTemplateDesc('');
    setNoticeText('');
    setVariables([
      { key: 'EVENT_TITLE', label: 'Event Title / പരിപാടി ശീർഷകം', defaultValue: 'വാർഷിക സമ്മേളനം' },
    ]);
    setScheduleItems([]);
  };

  const handleOpenEdit = (t: any) => {
    setEditingTemplate(t);
    setTemplateName(t.name);
    setTemplateCategory(t.category || 'Religious Conference');
    setIsCustomCategoryMode(false);
    setCustomCategoryInput('');
    setTemplateDesc(t.description || '');
    setNoticeText(t.noticeTemplateText || '');
    setVariables(t.variables || []);
    setScheduleItems(t.programSchedule || []);
    setIsCreateModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName) return toast.error('Template name is required');

    const finalCategory = isCustomCategoryMode && customCategoryInput.trim()
      ? customCategoryInput.trim()
      : templateCategory;

    saveMutation.mutate({
      name: templateName,
      category: finalCategory,
      description: templateDesc,
      noticeTemplateText: noticeText,
      variables,
      programSchedule: scheduleItems,
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" />
            Event & Program Notice Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Event Templates (ഈവന്റ് ടെംപ്ലേറ്റുകൾ)</h1>
          <p className="text-emerald-100/80 text-sm mt-1">
            Create reusable Islamic Conference, Uroos, Swalath & Mahallu notice templates with dynamic Malayalam variables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/events">
            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-3 rounded-2xl transition-all">
              <ArrowLeft size={16} /> Back to Events
            </button>
          </Link>
          <button
            onClick={() => {
              resetForm();
              setEditingTemplate(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-lg transition-all cursor-pointer"
          >
            <Plus size={18} />
            Create Event Template
          </button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex flex-wrap items-center gap-2 bg-card p-3 rounded-2xl border border-border">
        {['all', ...allCategories].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat === 'all' ? 'All Templates' : cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 rounded-3xl shimmer" />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-3xl text-center">
          <FileText className="h-12 w-12 text-emerald-600 opacity-40 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-foreground">No Event Templates Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Create a custom event template to quickly schedule conferences, Swalath majlis, and annual meetings with pre-configured variables.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTemplates.map((template: any) => (
            <motion.div
              key={template._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all group relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-extrabold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
                    {template.category || 'General'}
                  </span>
                  {template.isMasterTemplate && (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      ⭐ Master Template
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-extrabold text-foreground group-hover:text-emerald-600 transition-colors">
                  {template.name}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {template.description || 'Pre-configured event template with Malayalam variables and session schedule.'}
                </p>

                {/* Variable Badges */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="text-[10px] font-bold px-2 py-1 bg-muted rounded-lg text-foreground">
                    ⚡ {template.variables?.length || 0} Dynamic Variables
                  </span>
                  <span className="text-[10px] font-bold px-2 py-1 bg-muted rounded-lg text-foreground">
                    📅 {template.programSchedule?.length || 0} Program Sessions
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-foreground font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <Eye size={14} className="text-emerald-600" />
                    Preview Flyer Notice
                  </button>

                  <button
                    onClick={() => handleOpenEdit(template)}
                    className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Edit Template"
                  >
                    <Edit size={14} />
                  </button>

                  {!template.isMasterTemplate && (
                    <button
                      onClick={() => deleteMutation.mutate(template._id)}
                      className="p-2 rounded-xl border border-border hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                      title="Delete Template"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <Link href={`/events/new?templateId=${template._id}`}>
                  <button className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer">
                    <Sparkles size={14} />
                    Use Template
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Program Notice Flyer Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-amber-50 dark:bg-slate-900 border-4 border-amber-300 dark:border-amber-700/50 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-8 text-slate-900 dark:text-slate-100"
            >
              {/* Poster Header */}
              <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 p-6 text-white text-center relative border-b-4 border-amber-400">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="absolute right-4 top-4 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 cursor-pointer"
                >
                  <X size={18} />
                </button>

                <div className="w-16 h-16 mx-auto mb-2 bg-amber-400/20 rounded-full flex items-center justify-center border-2 border-amber-400">
                  <Sparkles size={28} className="text-amber-300" />
                </div>
                <p className="text-amber-300 font-extrabold text-xs uppercase tracking-widest">
                  ബിസ്മില്ലാഹിറഹ്മാനിറഹീം
                </p>
                <h2 className="text-2xl md:text-3xl font-black mt-1 text-white leading-tight">
                  {previewTemplate.name}
                </h2>
                <p className="text-emerald-200 text-xs font-semibold mt-1">
                  {previewTemplate.category}
                </p>
              </div>

              {/* Poster Body */}
              <div className="p-6 md:p-8 space-y-6">
                {/* Program Sessions Grid */}
                <div className="space-y-6">
                  {previewTemplate.programSchedule?.map((session: any, index: number) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900 shadow-sm space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between border-b pb-2.5 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                            {session.dayNumber || index + 1}
                          </span>
                          <span className="font-extrabold text-emerald-800 dark:text-emerald-300 text-sm">
                            {session.dateText || 'സമ്മേളന ദിനം'}
                          </span>
                        </div>
                        <span className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 text-xs font-black px-3 py-1 rounded-full border border-amber-300">
                          ⏰ {session.sessionTime || 'സമയം'}
                        </span>
                      </div>

                      <h4 className="text-lg font-black text-emerald-900 dark:text-emerald-100">
                        {session.sessionTitle}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {session.president && (
                          <div className="bg-amber-50/70 dark:bg-slate-900 p-2.5 rounded-xl border border-amber-200 dark:border-slate-700">
                            <span className="font-bold text-amber-800 dark:text-amber-400 block">അധ്യക്ഷൻ:</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">{session.president}</span>
                          </div>
                        )}
                        {session.inaugurator && (
                          <div className="bg-emerald-50/70 dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-200 dark:border-slate-700">
                            <span className="font-bold text-emerald-800 dark:text-emerald-400 block">ഉദ്ഘാടനം:</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">{session.inaugurator}</span>
                          </div>
                        )}
                        {session.keynoteSpeaker && (
                          <div className="md:col-span-2 bg-rose-50/70 dark:bg-slate-900 p-2.5 rounded-xl border border-rose-200 dark:border-slate-700">
                            <span className="font-bold text-rose-800 dark:text-rose-400 block">പ്രഭാഷണം / ആമുഖ പ്രഭാഷണം:</span>
                            <span className="font-extrabold text-slate-900 dark:text-slate-100">{session.keynoteSpeaker}</span>
                          </div>
                        )}
                        {session.chiefGuests && (
                          <div className="md:col-span-2 bg-blue-50/70 dark:bg-slate-900 p-2.5 rounded-xl border border-blue-200 dark:border-slate-700">
                            <span className="font-bold text-blue-800 dark:text-blue-400 block">വിശിഷ്ട അതിഥികൾ / തങ്ങൾമാർ:</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">{session.chiefGuests}</span>
                          </div>
                        )}
                      </div>

                      {(session.voteOfThanks || session.notes) && (
                        <div className="flex flex-wrap items-center justify-between text-[11px] pt-2 border-t text-slate-600 dark:text-slate-400 font-semibold">
                          {session.voteOfThanks && <span>നന്ദി: {session.voteOfThanks}</span>}
                          {session.notes && <span className="text-emerald-700 dark:text-emerald-400 font-bold">✨ {session.notes}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Formatted Text Notice Box */}
                {previewTemplate.noticeTemplateText && (
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h5 className="font-bold text-xs text-slate-500 uppercase mb-2">Formatted Notice Text Template</h5>
                    <pre className="text-xs whitespace-pre-wrap font-sans bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border">
                      {previewTemplate.noticeTemplateText}
                    </pre>
                  </div>
                )}
              </div>

              {/* Poster Footer Actions */}
              <div className="p-4 bg-emerald-900 text-white border-t flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 rounded-xl border border-white/30 text-xs font-bold hover:bg-white/10"
                >
                  Close Preview
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl transition-all"
                  >
                    <Printer size={14} /> Print Flyer
                  </button>
                  <Link href={`/events/new?templateId=${previewTemplate._id}`}>
                    <button className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all">
                      <Sparkles size={14} /> Create Event with This Template
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create / Edit Template Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-3xl p-6 w-full max-w-3xl shadow-2xl space-y-6 my-8"
          >
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="font-extrabold text-xl text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                {editingTemplate ? 'Edit Event Template' : 'Create New Event Template'}
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Template Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3-Day Islamic Conference & Uroos Notice"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold">Category</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategoryMode(!isCustomCategoryMode);
                        if (!isCustomCategoryMode) setCustomCategoryInput('');
                      }}
                      className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      {isCustomCategoryMode ? 'Choose from list' : '+ Create Custom Category'}
                    </button>
                  </div>

                  {!isCustomCategoryMode ? (
                    <select
                      value={templateCategory}
                      onChange={(e) => {
                        if (e.target.value === '__create_custom__') {
                          setIsCustomCategoryMode(true);
                          setCustomCategoryInput('');
                        } else {
                          setTemplateCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm"
                    >
                      {allCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__create_custom__">+ Create New Custom Category...</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      autoFocus
                      required
                      placeholder="Type custom category name (e.g. Uroos Mubarak, Youth Fest...)"
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-background border-2 border-emerald-500 rounded-xl text-sm font-bold"
                    />
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Short description of this template"
                    value={templateDesc}
                    onChange={(e) => setTemplateDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Dynamic Variables Section */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                    ⚡ Dynamic Variables (ടെംപ്ലേറ്റ് വേരിയബിളുകൾ)
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setVariables([...variables, { key: `VAR_${variables.length + 1}`, label: 'New Variable', defaultValue: '' }])
                    }
                    className="text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-300 cursor-pointer"
                  >
                    + Add Variable
                  </button>
                </div>

                <div className="space-y-2">
                  {variables.map((v, i) => (
                    <div key={i} className="flex gap-2 items-center bg-muted/50 p-2.5 rounded-2xl border">
                      <input
                        type="text"
                        placeholder="Key (e.g. EVENT_TITLE)"
                        value={v.key}
                        onChange={(e) => {
                          const updated = [...variables];
                          updated[i].key = e.target.value;
                          setVariables(updated);
                        }}
                        className="w-1/3 px-3 py-1.5 bg-background border rounded-xl text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Label (e.g. പരിപാടി ശീർഷകം)"
                        value={v.label}
                        onChange={(e) => {
                          const updated = [...variables];
                          updated[i].label = e.target.value;
                          setVariables(updated);
                        }}
                        className="w-1/3 px-3 py-1.5 bg-background border rounded-xl text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Default value"
                        value={v.defaultValue || ''}
                        onChange={(e) => {
                          const updated = [...variables];
                          updated[i].defaultValue = e.target.value;
                          setVariables(updated);
                        }}
                        className="w-1/3 px-3 py-1.5 bg-background border rounded-xl text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setVariables(variables.filter((_, idx) => idx !== i))}
                        className="text-rose-600 hover:text-rose-700 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Program Schedule Builder */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                    📅 Program Sessions Schedule Builder (പ്രോഗ്രാം സെഷനുകൾ)
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setScheduleItems([
                        ...scheduleItems,
                        {
                          dayNumber: scheduleItems.length + 1,
                          dateText: '',
                          sessionTime: '',
                          sessionTitle: '',
                          keynoteSpeaker: '',
                        },
                      ])
                    }
                    className="text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-300 cursor-pointer"
                  >
                    + Add Session Day
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {scheduleItems.map((item, i) => (
                    <div key={i} className="bg-muted/40 p-3 rounded-2xl border space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b pb-1 font-bold">
                        <span>Session {i + 1}</span>
                        <button
                          type="button"
                          onClick={() => setScheduleItems(scheduleItems.filter((_, idx) => idx !== i))}
                          className="text-rose-600"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Date / Day Text (e.g. 30 ഏപ്രിൽ)"
                          value={item.dateText || ''}
                          onChange={(e) => {
                            const updated = [...scheduleItems];
                            updated[i].dateText = e.target.value;
                            setScheduleItems(updated);
                          }}
                          className="px-2.5 py-1.5 bg-background border rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="Time (e.g. 8.00 PM)"
                          value={item.sessionTime || ''}
                          onChange={(e) => {
                            const updated = [...scheduleItems];
                            updated[i].sessionTime = e.target.value;
                            setScheduleItems(updated);
                          }}
                          className="px-2.5 py-1.5 bg-background border rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="Session Title (e.g. മത പ്രഭാഷണം)"
                          value={item.sessionTitle || ''}
                          onChange={(e) => {
                            const updated = [...scheduleItems];
                            updated[i].sessionTitle = e.target.value;
                            setScheduleItems(updated);
                          }}
                          className="px-2.5 py-1.5 bg-background border rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="President / അധ്യക്ഷൻ"
                          value={item.president || ''}
                          onChange={(e) => {
                            const updated = [...scheduleItems];
                            updated[i].president = e.target.value;
                            setScheduleItems(updated);
                          }}
                          className="px-2.5 py-1.5 bg-background border rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="Inaugurator / ഉദ്ഘാടനം"
                          value={item.inaugurator || ''}
                          onChange={(e) => {
                            const updated = [...scheduleItems];
                            updated[i].inaugurator = e.target.value;
                            setScheduleItems(updated);
                          }}
                          className="px-2.5 py-1.5 bg-background border rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="Keynote Speaker / പ്രഭാഷണം"
                          value={item.keynoteSpeaker || ''}
                          onChange={(e) => {
                            const updated = [...scheduleItems];
                            updated[i].keynoteSpeaker = e.target.value;
                            setScheduleItems(updated);
                          }}
                          className="px-2.5 py-1.5 bg-background border rounded-lg"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formatted Text Editor */}
              <div className="border-t pt-4 space-y-2">
                <label className="block text-xs font-bold">Malayalam Notice Text Template</label>
                <textarea
                  rows={4}
                  placeholder="Enter notice text template with {{VARIABLE_NAME}} placeholders..."
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  className="w-full p-3 bg-background border rounded-2xl text-xs font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
