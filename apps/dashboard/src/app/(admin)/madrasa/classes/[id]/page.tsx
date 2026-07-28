'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Users, Calendar, Award, CheckSquare, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';

import { ClassOverviewTab } from './_components/ClassOverviewTab';
import { ClassTimetableTab } from './_components/ClassTimetableTab';
import { ClassExamsTab } from './_components/ClassExamsTab';
import { ClassHomeworkTab } from './_components/ClassHomeworkTab';
import { ClassAttendanceTab } from './_components/ClassAttendanceTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'timetable', label: 'Timetable', icon: Calendar },
  { id: 'exams', label: 'Exams', icon: Award },
  { id: 'homework', label: 'Homework', icon: CheckSquare },
  { id: 'attendance', label: 'Attendance', icon: Users },
];

export default function ClassDetailsPage() {
  const params = useParams();
  const classId = params.id as string;
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: classData, isLoading, refetch } = useQuery({
    queryKey: ['madrasa-class', classId],
    queryFn: () => apiClient.get(`/classes/${classId}`).then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-2xl shimmer" />
        <div className="h-96 rounded-2xl shimmer" />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-foreground">Class not found</h2>
        <Link href="/madrasa/classes">
          <button className="mt-4 text-emerald-600 hover:underline">Back to Classes</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link href="/madrasa/classes">
            <button className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <h1 className="page-title">{classData.name}</h1>
            <p className="page-subtitle">Level {classData.level} • {classData.teacherId?.memberId?.name || 'No Teacher Assigned'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1 bg-muted/50 rounded-xl border border-border">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-card rounded-2xl border border-border p-6 min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'overview' && <ClassOverviewTab classData={classData} classId={classId} refetch={refetch} />}
            {activeTab === 'timetable' && <ClassTimetableTab classData={classData} classId={classId} refetch={refetch} />}
            {activeTab === 'exams' && <ClassExamsTab classId={classId} madrasaId={typeof classData.madrasaId === 'object' ? classData.madrasaId?._id : classData.madrasaId} />}
            {activeTab === 'homework' && <ClassHomeworkTab classId={classId} teacherId={typeof classData.teacherId === 'object' ? classData.teacherId?._id : classData.teacherId} />}
            {activeTab === 'attendance' && <ClassAttendanceTab classId={classId} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
