'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  GraduationCap, BookOpen, Users, UserCheck, Calendar,
  FileText, Plus, CheckCircle2, Clock, ArrowUpRight, BookMarked
} from 'lucide-react';

export default function MadrasaPortalDashboard() {
  // Fetch Classes
  const { data: classesData = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['madrasa-portal-classes'],
    queryFn: async () => {
      const res = await apiClient.get('/madrasa/classes');
      return res.data.data || res.data || [];
    },
  });

  // Fetch Students
  const { data: studentsData = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['madrasa-portal-students'],
    queryFn: async () => {
      const res = await apiClient.get('/students');
      return res.data.data || res.data || [];
    },
  });

  // Fetch Teachers
  const { data: teachersData = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ['madrasa-portal-teachers'],
    queryFn: async () => {
      const res = await apiClient.get('/teachers');
      return res.data.data || res.data || [];
    },
  });

  const totalStudents = studentsData.length || 0;
  const totalClasses = classesData.length || 0;
  const totalTeachers = teachersData.length || 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900/40 via-emerald-900/30 to-background border border-teal-500/20 p-6 rounded-3xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold">
            <GraduationCap size={14} /> Official Madrasa Management Panel
          </div>
          <h1 className="text-2xl font-bold text-foreground">Madrasa Command Portal</h1>
          <p className="text-muted-foreground text-sm">
            Manage classes, student admissions, attendance, ustadh schedules, and progress reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/madrasa-portal/attendance"
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition-colors flex items-center gap-2 shadow-lg shadow-teal-500/20"
          >
            <Calendar size={16} /> Mark Today's Attendance
          </Link>
          <Link
            href="/madrasa-portal/students"
            className="px-4 py-2.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground font-medium text-sm transition-colors border border-border flex items-center gap-2"
          >
            <Plus size={16} /> Add Student
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Enrolled Students</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-foreground">{loadingStudents ? '...' : totalStudents}</span>
            <span className="text-xs text-blue-400 font-medium">Active Students</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Active Classes</span>
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <BookOpen size={20} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-foreground">{loadingClasses ? '...' : totalClasses}</span>
            <span className="text-xs text-teal-400 font-medium">Class Sections</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Ustadh Staff</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserCheck size={20} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-foreground">{loadingTeachers ? '...' : totalTeachers}</span>
            <span className="text-xs text-emerald-400 font-medium">Teachers</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Today's Attendance</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Calendar size={20} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-purple-400">96.4%</span>
            <span className="text-xs text-purple-400 font-medium">Marked</span>
          </div>
        </motion.div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Madrasa Portal Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/madrasa-portal/attendance"
            className="p-4 rounded-2xl bg-card border border-border hover:border-teal-500/50 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
                <Calendar size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Daily Attendance</p>
                <p className="text-xs text-muted-foreground">Mark student registers</p>
              </div>
            </div>
            <ArrowUpRight size={18} className="text-muted-foreground group-hover:text-teal-400 transition-colors" />
          </Link>

          <Link
            href="/madrasa-portal/classes"
            className="p-4 rounded-2xl bg-card border border-border hover:border-blue-500/50 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                <BookOpen size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Class Registers</p>
                <p className="text-xs text-muted-foreground">Manage levels & sections</p>
              </div>
            </div>
            <ArrowUpRight size={18} className="text-muted-foreground group-hover:text-blue-400 transition-colors" />
          </Link>

          <Link
            href="/madrasa-portal/students"
            className="p-4 rounded-2xl bg-card border border-border hover:border-emerald-500/50 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Students Directory</p>
                <p className="text-xs text-muted-foreground">Admissions & profiles</p>
              </div>
            </div>
            <ArrowUpRight size={18} className="text-muted-foreground group-hover:text-emerald-400 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Classes Breakdown Table */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Active Classes & Sections</h2>
            <p className="text-xs text-muted-foreground">Overview of academic levels and assigned Ustadhs.</p>
          </div>
          <Link
            href="/madrasa/classes"
            className="text-xs text-teal-400 font-semibold hover:underline"
          >
            View All Classes →
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-muted/60 text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border">
              <tr>
                <th className="p-3.5">Class Name</th>
                <th className="p-3.5">Level</th>
                <th className="p-3.5">Medium</th>
                <th className="p-3.5">Assigned Ustadh</th>
                <th className="p-3.5 text-center">Students</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {classesData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">
                    No classes found. Add classes in Madrasa settings.
                  </td>
                </tr>
              ) : (
                classesData.slice(0, 8).map((cls: any) => (
                  <tr key={cls._id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 font-semibold text-foreground flex items-center gap-2">
                      <BookMarked size={16} className="text-teal-400" />
                      {cls.name}
                    </td>
                    <td className="p-3.5 text-xs text-muted-foreground">Grade {cls.level}</td>
                    <td className="p-3.5 text-xs capitalize">{cls.medium || 'Malayalam'}</td>
                    <td className="p-3.5 text-xs font-medium">
                      {cls.ustadh?.member?.name || cls.ustadh?.employeeId || 'Assigned Staff'}
                    </td>
                    <td className="p-3.5 text-center font-bold text-teal-400">
                      {cls.students?.length || 0}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
