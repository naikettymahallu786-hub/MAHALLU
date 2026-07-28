'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Calendar, FileText, Plus, X, Save, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export function ClassHomeworkTab({ classId, teacherId }: { classId: string, teacherId: string }) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const { data: homework, isLoading } = useQuery({
    queryKey: ['class-homework', classId],
    queryFn: () => apiClient.get(`/homework?classId=${classId}`).then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      if (!teacherId) {
        throw new Error('No teacher is currently assigned to this class. Homework cannot be scheduled without an assigned teacher.');
      }
      return apiClient.post('/homework', { ...data, classId, teacherId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-homework', classId] });
      setIsModalOpen(false);
      reset();
      toast.success('Homework assignment created successfully!');
    },
    onError: (err: any) => {
      toast.error(err?.message || err?.response?.data?.message || 'Failed to create homework assignment');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <CheckSquare className="text-emerald-600" />
          Homework Assignments
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 font-semibold"
        >
          <Plus size={14} /> Add Homework
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-24 rounded-xl shimmer" />)}
        </div>
      ) : homework && homework.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {homework.map((hw: any) => (
            <div key={hw._id} className="p-4 rounded-xl border border-border bg-card hover:border-emerald-500/30 transition-colors flex justify-between items-center group cursor-pointer">
              <div>
                <h3 className="font-bold text-foreground group-hover:text-emerald-600 transition-colors mb-1">{hw.title}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-3">
                  <span className="flex items-center gap-1"><FileText size={12} /> {hw.subject}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold">{hw.submissions?.length || 0}</span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Submissions</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 border border-dashed border-border rounded-2xl text-center bg-card">
          <CheckSquare size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">No homework assignments found.</p>
        </div>
      )}

      {/* Add Homework Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-card z-10">
              <h2 className="font-bold text-lg">Add Homework Assignment</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <form id="homework-form" onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Homework Title *</label>
                  <input type="text" {...register('title', { required: true })} placeholder="e.g. Read Surah Al-Kahf" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Subject *</label>
                  <input type="text" {...register('subject', { required: true })} placeholder="e.g. Quran Tafseer" className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Due Date *</label>
                  <input type="date" {...register('dueDate', { required: true })} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Instructions / Description</label>
                  <textarea {...register('description')} rows={3} placeholder="Provide assignment instructions here..." className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </form>
            </div>
            <div className="p-4 border-t flex justify-end gap-2 bg-muted/20">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm border rounded-xl hover:bg-muted bg-background">
                Cancel
              </button>
              <button
                type="submit"
                form="homework-form"
                disabled={createMutation.isPending}
                className="btn-brand flex items-center gap-2 font-semibold"
              >
                {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Homework
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
