'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Edit, Save, Plus, Trash2, Clock, Book } from 'lucide-react';
import { apiClient } from '@/lib/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ClassTimetableTab({ classData, classId, refetch }: { classData: any, classId: string, refetch: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [schedule, setSchedule] = useState<any[]>(classData.schedule || []);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (newSchedule: any[]) => apiClient.put(`/classes/${classId}`, { schedule: newSchedule }),
    onSuccess: () => {
      setIsEditing(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['madrasa-classes'] });
    }
  });

  const handleAddSlot = (day: string) => {
    setSchedule([...schedule, { day, startTime: '08:00 AM', endTime: '09:00 AM', subject: '' }]);
  };

  const handleUpdateSlot = (index: number, field: string, value: string) => {
    const updated = [...schedule];
    updated[index] = { ...updated[index], [field]: value };
    setSchedule(updated);
  };

  const handleRemoveSlot = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Calendar className="text-emerald-600" />
          Weekly Timetable
        </h2>
        
        {isEditing ? (
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setSchedule(classData.schedule || []);
                setIsEditing(false);
              }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted"
            >
              Cancel
            </button>
            <button 
              onClick={() => updateMutation.mutate(schedule)}
              disabled={updateMutation.isPending}
              className="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1"
            >
              {updateMutation.isPending ? 'Saving...' : <><Save size={14} /> Save</>}
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted flex items-center gap-1"
          >
            <Edit size={14} /> Edit Timetable
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DAYS.map(day => {
          const daySlots = schedule.map((s, i) => ({ ...s, index: i })).filter(s => s.day === day);
          
          if (!isEditing && daySlots.length === 0) return null;

          return (
            <div key={day} className="border border-border rounded-xl bg-card overflow-hidden flex flex-col">
              <div className="bg-muted/50 p-3 font-semibold border-b border-border flex justify-between items-center">
                {day}
                {isEditing && (
                  <button onClick={() => handleAddSlot(day)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded">
                    <Plus size={16} />
                  </button>
                )}
              </div>
              
              <div className="p-3 space-y-3 flex-1">
                {daySlots.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No classes scheduled</p>
                ) : (
                  daySlots.map(slot => (
                    <div key={slot.index} className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/30 dark:border-emerald-950/50 dark:bg-emerald-950/20 text-sm space-y-2 relative group">
                      {isEditing ? (
                        <>
                          <input 
                            type="text" 
                            value={slot.subject}
                            onChange={(e) => handleUpdateSlot(slot.index, 'subject', e.target.value)}
                            placeholder="Subject"
                            className="w-full text-sm font-semibold bg-transparent border-b border-emerald-200 dark:border-emerald-900 focus:outline-none focus:border-emerald-500 text-emerald-800 dark:text-emerald-200 pb-1"
                          />
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={slot.startTime}
                              onChange={(e) => handleUpdateSlot(slot.index, 'startTime', e.target.value)}
                              placeholder="08:00 AM"
                              className="w-1/2 text-xs bg-transparent border-b border-emerald-200 dark:border-emerald-900 focus:outline-none focus:border-emerald-500 text-emerald-800 dark:text-emerald-300 pb-1"
                            />
                            <input 
                              type="text" 
                              value={slot.endTime}
                              onChange={(e) => handleUpdateSlot(slot.index, 'endTime', e.target.value)}
                              placeholder="09:00 AM"
                              className="w-1/2 text-xs bg-transparent border-b border-emerald-200 dark:border-emerald-900 focus:outline-none focus:border-emerald-500 text-emerald-800 dark:text-emerald-300 pb-1"
                            />
                          </div>
                          <button 
                            onClick={() => handleRemoveSlot(slot.index)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <Book size={14} className="text-emerald-600 dark:text-emerald-400" />
                            {slot.subject}
                          </p>
                          <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 flex items-center gap-1.5">
                            <Clock size={12} className="text-emerald-500/80 dark:text-emerald-400/60" />
                            {slot.startTime} - {slot.endTime}
                          </p>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {!isEditing && schedule.length === 0 && (
        <div className="p-12 border border-dashed border-border rounded-2xl text-center">
          <Calendar size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">Timetable has not been set up yet.</p>
          <button 
            onClick={() => setIsEditing(true)}
            className="mt-4 px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Create Timetable
          </button>
        </div>
      )}
    </div>
  );
}
