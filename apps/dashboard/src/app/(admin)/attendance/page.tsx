'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Search, CheckCircle, XCircle, Clock, CheckSquare, Plus, Save } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { toast } from 'sonner';

export default function AttendancePage() {
  const { t } = useTranslation();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [classId, setClassId] = useState('');
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  // Monthly mode selectors
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiClient.get('/classes').then(r => r.data.data),
  });

  useEffect(() => {
    if (classes && classes.length > 0 && !classId) {
      setClassId(classes[0]._id);
    }
  }, [classes, classId]);

  // Daily Query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['attendance', classId, date],
    queryFn: () => apiClient.get(`/attendance/class/${classId}`, {
      params: { date },
    }).then(r => r.data),
    enabled: !!classId && viewMode === 'daily',
  });

  const [localRecords, setLocalRecords] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data?.data && viewMode === 'daily') {
      setLocalRecords(data.data);
    } else if (viewMode === 'daily') {
      setLocalRecords([]);
    }
  }, [data, viewMode]);

  const presentCount = localRecords.filter((r: any) => r.status === 'present').length;
  const absentCount = localRecords.filter((r: any) => r.status === 'absent').length;

  const toggleStatus = (studentId: string) => {
    setLocalRecords(prev => prev.map(r => {
      if (r.entityId?._id === studentId) {
        return { ...r, status: r.status === 'present' ? 'absent' : 'present' };
      }
      return r;
    }));
  };

  const saveAttendance = async () => {
    if (localRecords.length === 0) return;
    setIsSaving(true);
    const loadingToast = toast.loading('Saving attendance...');
    try {
      const payload = {
        classId,
        date,
        entityType: 'student',
        records: localRecords.map(r => ({
          entityId: r.entityId?._id,
          status: r.status
        }))
      };
      await apiClient.post('/attendance/bulk', payload);
      toast.dismiss(loadingToast);
      toast.success('Attendance saved successfully!');
      refetch();
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setIsSaving(false);
    }
  };

  // Monthly Query
  const { data: monthlyData, isLoading: isMonthlyLoading, refetch: refetchMonthly } = useQuery({
    queryKey: ['attendance-monthly', classId, selectedMonth, selectedYear],
    queryFn: () => apiClient.get(`/attendance/class/${classId}/monthly`, {
      params: { month: selectedMonth, year: selectedYear }
    }).then(r => r.data),
    enabled: !!classId && viewMode === 'monthly',
  });

  const [monthlyMatrix, setMonthlyMatrix] = useState<Record<string, Record<number, string>>>({});
  const [isSavingMonthly, setIsSavingMonthly] = useState(false);

  useEffect(() => {
    if (monthlyData?.data && viewMode === 'monthly') {
      const matrix: Record<string, Record<number, string>> = {};
      monthlyData.data.students.forEach((s: any) => {
        matrix[s._id] = {};
      });
      monthlyData.data.records.forEach((r: any) => {
        const day = new Date(r.date).getDate();
        if (matrix[r.entityId]) {
          matrix[r.entityId][day] = r.status;
        }
      });
      setMonthlyMatrix(matrix);
    }
  }, [monthlyData, viewMode]);

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const toggleMonthlyCell = (studentId: string, day: number) => {
    setMonthlyMatrix(prev => {
      const studentRow = { ...prev[studentId] };
      const currentStatus = studentRow[day];
      let nextStatus = 'present';
      if (currentStatus === 'present') nextStatus = 'absent';
      else if (currentStatus === 'absent') nextStatus = '';
      
      studentRow[day] = nextStatus;
      return { ...prev, [studentId]: studentRow };
    });
  };

  const saveMonthlyAttendance = async () => {
    setIsSavingMonthly(true);
    const loadingToast = toast.loading('Saving monthly attendance...');
    try {
      const recordsToSave: any[] = [];
      Object.entries(monthlyMatrix).forEach(([studentId, days]) => {
        Object.entries(days).forEach(([dayStr, status]) => {
          if (status) {
            const day = parseInt(dayStr);
            const dateObj = new Date(selectedYear, selectedMonth - 1, day);
            dateObj.setHours(0, 0, 0, 0);
            recordsToSave.push({
              entityId: studentId,
              status,
              date: dateObj.toISOString()
            });
          }
        });
      });
      if (recordsToSave.length === 0) {
        toast.dismiss(loadingToast);
        toast.warning('No attendance records to save.');
        setIsSavingMonthly(false);
        return;
      }
      await apiClient.post('/attendance/bulk', {
        classId,
        entityType: 'student',
        records: recordsToSave
      });
      toast.dismiss(loadingToast);
      toast.success('Monthly attendance saved successfully!');
      refetchMonthly();
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || 'Failed to save monthly attendance.');
    } finally {
      setIsSavingMonthly(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('attendance_page.title')}</h1>
          <p className="page-subtitle">{t('attendance_page.subtitle')}</p>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setViewMode('daily')}
          className={cn(
            'px-5 py-3 border-b-2 text-sm font-medium transition duration-200',
            viewMode === 'daily'
              ? 'border-emerald-500 text-emerald-600 font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Daily Tracker
        </button>
        <button
          onClick={() => setViewMode('monthly')}
          className={cn(
            'px-5 py-3 border-b-2 text-sm font-medium transition duration-200',
            viewMode === 'monthly'
              ? 'border-emerald-500 text-emerald-600 font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Monthly Attendance Sheet
        </button>
      </div>

      {/* Stats (Only in Daily Tracker) */}
      {viewMode === 'daily' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: t('attendance_page.present'), value: presentCount, icon: CheckCircle, color: '#059669' },
            { label: t('attendance_page.absent'), value: absentCount, icon: XCircle, color: '#f43f5e' },
            { label: t('attendance_page.total'), value: localRecords.length, icon: Calendar, color: '#3b82f6' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="section-card flex items-center gap-4 animate-count"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="section-card">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="flex gap-3 w-full sm:w-auto">
            {viewMode === 'monthly' ? (
              <div className="flex gap-3">
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(parseInt(e.target.value))}
                  className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(parseInt(e.target.value))}
                  className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}
            <select
              value={classId}
              onChange={e => setClassId(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {classes && classes.length > 0 ? (
                classes.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))
              ) : (
                <option value="">No classes found</option>
              )}
            </select>
          </div>
          {viewMode === 'daily' && localRecords.length > 0 && (
            <button
              onClick={saveAttendance}
              disabled={isSaving}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition duration-200"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Attendance'}
            </button>
          )}
          {viewMode === 'monthly' && monthlyData?.data?.students?.length > 0 && (
            <button
              onClick={saveMonthlyAttendance}
              disabled={isSavingMonthly}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition duration-200"
            >
              <Save size={16} />
              {isSavingMonthly ? 'Saving...' : 'Save Monthly Sheet'}
            </button>
          )}
        </div>
      </div>

      {/* Main Grid View */}
      {viewMode === 'daily' ? (
        <div className="section-card overflow-hidden p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl shimmer" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="pl-6">{t('attendance_page.studentName')}</th>
                    <th>{t('attendance_page.admissionId')}</th>
                    <th>{t('attendance_page.date')}</th>
                    <th>{t('attendance_page.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {localRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-muted-foreground">
                        <CheckSquare size={40} className="mx-auto mb-3 opacity-30" />
                        <p>{t('attendance_page.noLogs')}</p>
                      </td>
                    </tr>
                  ) : (
                    localRecords.map((record: any, i: number) => (
                      <motion.tr
                        key={record.entityId?._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                      >
                        <td className="pl-6">
                          <span className="font-medium text-foreground">
                            {record.entityId?.name || 'Unknown Student'}
                          </span>
                        </td>
                        <td>
                          <code className="text-xs bg-muted px-2 py-0.5 rounded-md font-bold">{record.entityId?.admissionNo || '—'}</code>
                        </td>
                        <td className="text-muted-foreground text-sm">
                          {formatDate(record.date)}
                        </td>
                        <td>
                          <button
                            onClick={() => toggleStatus(record.entityId?._id)}
                            className={cn('text-xs px-2.5 py-1 rounded-full font-semibold capitalize transition duration-200',
                              record.status === 'present' ? 'badge-active hover:bg-emerald-200/40' : 'badge-overdue hover:bg-red-200/40'
                            )}
                          >
                            {record.status}
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="section-card overflow-hidden p-0">
          {isMonthlyLoading ? (
            <div className="space-y-3 p-6">
              {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl shimmer" />)}
            </div>
          ) : !monthlyData?.data?.students ? (
            <div className="text-center py-12 text-muted-foreground">
              Select a class to view monthly attendance sheet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table min-w-full text-xs">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="pl-6 py-3 font-semibold text-left sticky left-0 bg-background border-r border-border min-w-[180px] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      Student Name
                    </th>
                    <th className="py-3 font-semibold text-left min-w-[100px] border-r border-border">
                      Admission No
                    </th>
                    {daysArray.map(day => {
                      const d = new Date(selectedYear, selectedMonth - 1, day);
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      return (
                        <th
                          key={day}
                          className={cn(
                            'text-center py-3 font-semibold min-w-[36px]',
                            isWeekend ? 'bg-red-500/10 text-red-600 dark:text-red-400 font-bold' : ''
                          )}
                        >
                          {day}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.data.students.length === 0 ? (
                    <tr>
                      <td colSpan={daysInMonth + 2} className="text-center py-12 text-muted-foreground text-sm">
                        No students found in this class
                      </td>
                    </tr>
                  ) : (
                    monthlyData.data.students.map((student: any) => (
                      <tr key={student._id} className="hover:bg-muted/30">
                        <td className="pl-6 py-2.5 font-medium text-foreground sticky left-0 bg-background border-r border-border min-w-[180px] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] z-10">
                          {student.name}
                        </td>
                        <td className="py-2.5 text-muted-foreground border-r border-border">
                          {student.admissionNo}
                        </td>
                        {daysArray.map(day => {
                          const status = monthlyMatrix[student._id]?.[day] || '';
                          const d = new Date(selectedYear, selectedMonth - 1, day);
                          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                          return (
                            <td key={day} className={cn('p-1 text-center border-r border-border/40', isWeekend ? 'bg-red-500/5' : '')}>
                              <button
                                onClick={() => toggleMonthlyCell(student._id, day)}
                                className={cn(
                                  'w-7 h-7 rounded-lg flex items-center justify-center font-semibold transition-all duration-150 border text-[10px]',
                                  status === 'present'
                                    ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/30 font-bold shadow-sm'
                                    : status === 'absent'
                                    ? 'bg-red-500/20 text-red-600 border-red-500/40 hover:bg-red-500/30 font-bold shadow-sm'
                                    : 'bg-background hover:bg-muted text-muted-foreground/30 border-border/80 hover:text-foreground'
                                )}
                                title={`${student.name} - Day ${day}: ${status || 'Unmarked'}`}
                              >
                                {status === 'present' ? 'P' : status === 'absent' ? 'A' : '+'}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
