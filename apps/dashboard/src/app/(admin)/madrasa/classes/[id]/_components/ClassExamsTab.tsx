'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, Calendar, FileText, Plus, X, Save, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export function ClassExamsTab({ classId, madrasaId }: { classId: string, madrasaId: string }) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const { data: exams, isLoading } = useQuery({
    queryKey: ['class-exams', classId],
    queryFn: () => apiClient.get(`/exams?classId=${classId}`).then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      if (!madrasaId) {
        throw new Error('Madrasa ID is required to schedule an exam.');
      }
      const payload = {
        title: data.title,
        subjects: [data.subject],
        date: data.date,
        totalMarks: Number(data.totalMarks),
        passMark: Number(data.passMark),
        isPublished: !!data.isPublished,
        classId,
        madrasaId
      };
      return apiClient.post('/exams', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-exams', classId] });
      setIsModalOpen(false);
      reset();
      toast.success('Examination scheduled successfully!');
    },
    onError: (err: any) => {
      toast.error(err?.message || err?.response?.data?.message || 'Failed to schedule examination');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Award className="text-emerald-600" />
          Examinations
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 font-semibold"
        >
          <Plus size={14} /> Schedule Exam
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-24 rounded-xl shimmer" />)}
        </div>
      ) : exams && exams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam: any) => (
            <div key={exam._id} className="p-4 rounded-xl border border-border bg-card hover:border-emerald-500/30 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-foreground group-hover:text-emerald-600 transition-colors">{exam.title}</h3>
                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${
                  exam.isPublished ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                }`}>
                  {exam.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(exam.date).toLocaleDateString()}</p>
                <p className="flex items-center gap-1.5"><FileText size={12} /> {exam.subjects?.join(', ') || exam.subject}</p>
                <p className="flex items-center gap-1.5"><Award size={12} /> Max Marks: {exam.totalMarks || exam.maxMarks} (Pass: {exam.passMark || 'N/A'})</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 border border-dashed border-border rounded-2xl text-center bg-card">
          <Award size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">No exams scheduled for this class.</p>
        </div>
      )}

      {/* Schedule Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-card z-10">
              <h2 className="font-bold text-lg">Schedule New Examination</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <form id="exam-form" onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Exam Title *</label>
                  <input type="text" {...register('title', { required: true })} placeholder="e.g. First Terminal Exam" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Subject *</label>
                  <input type="text" {...register('subject', { required: true })} placeholder="e.g. Fiqh" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Date *</label>
                    <input type="date" {...register('date', { required: true })} className="w-full px-3 py-2 rounded-xl border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Max Marks *</label>
                    <input type="number" {...register('totalMarks', { required: true, valueAsNumber: true })} placeholder="100" className="w-full px-3 py-2 rounded-xl border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Pass Mark *</label>
                    <input type="number" {...register('passMark', { required: true, valueAsNumber: true })} placeholder="40" className="w-full px-3 py-2 rounded-xl border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="isPublished" {...register('isPublished')} className="w-4 h-4 rounded border-border text-emerald-600 focus:ring-emerald-500" />
                  <label htmlFor="isPublished" className="text-sm font-medium cursor-pointer">Publish results immediately</label>
                </div>
              </form>
            </div>
            <div className="p-4 border-t flex justify-end gap-2 bg-muted/20">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm border rounded-xl hover:bg-muted bg-background">
                Cancel
              </button>
              <button
                type="submit"
                form="exam-form"
                disabled={createMutation.isPending}
                className="btn-brand flex items-center gap-2 font-semibold"
              >
                {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
