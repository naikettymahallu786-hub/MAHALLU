'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function ClassAttendanceTab({ classId }: { classId: string }) {
  const { t } = useTranslation();
  // We'll fetch today's attendance summary for this class
  const today = new Date().toISOString().split('T')[0];
  const { data: attendance, isLoading } = useQuery({
    queryKey: ['class-attendance', classId, today],
    queryFn: () => apiClient.get(`/attendance?classId=${classId}&date=${today}`).then(r => r.data.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Users className="text-emerald-600" />
          Today's Attendance ({new Date().toLocaleDateString()})
        </h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-24 rounded-xl shimmer" />
        </div>
      ) : attendance && attendance.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attendance.map((record: any) => (
            <div key={record._id} className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {record.entityId?.name?.[0] || 'S'}
                </div>
                <span className="font-medium text-sm">{record.entityId?.name || 'Unknown Student'}</span>
              </div>
              <div>
                {record.status === 'present' ? (
                  <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1">
                    <CheckCircle size={12} /> Present
                  </span>
                ) : record.status === 'absent' ? (
                  <span className="px-2 py-1 rounded-md bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1">
                    <XCircle size={12} /> Absent
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-bold flex items-center gap-1">
                    <Calendar size={12} /> {record.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 border border-dashed border-border rounded-2xl text-center bg-card">
          <Calendar size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">No attendance recorded for today.</p>
        </div>
      )}
    </div>
  );
}
