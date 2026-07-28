'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Phone, Edit, QrCode, BookOpen, Clock } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';

export default function StudentDetailsPage() {
  const { id } = useParams();

  const { data: studentRes, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => apiClient.get(`/students/${id}`).then(r => r.data.data),
  });

  const student = studentRes;
  const member = student?.memberId;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-48 rounded-2xl shimmer" />
        <div className="h-96 rounded-2xl shimmer" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Student not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/students">
            <button className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div>
            <h1 className="page-title text-xl">Student Profile</h1>
            <p className="page-subtitle">Detailed academic profile for {member?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/students/${id}/edit`}>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
              <Edit size={16} />
              Edit Profile
            </button>
          </Link>
        </div>
      </div>

      {/* Profile Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="section-card flex flex-col md:flex-row gap-6 items-center"
      >
        <div className="w-24 h-24 rounded-3xl overflow-hidden bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-blue-800 dark:text-blue-300 font-bold text-3xl shrink-0 border border-blue-500/20 shadow-inner select-none">
          {member?.photo?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.photo.url} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            member?.name?.[0]?.toUpperCase() || 'S'
          )}
        </div>

        <div className="space-y-2 text-center md:text-left flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
            <h2 className="text-2xl font-bold text-foreground leading-tight">{member?.name || 'Student'}</h2>
            <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-bold w-fit mx-auto md:mx-0 capitalize',
              student.status === 'active' ? 'badge-active' : 'badge-inactive'
            )}>
              {student.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-1">
            <code className="text-xs bg-muted px-2 py-0.5 rounded font-semibold text-foreground select-all">
              Admission No: {student.admissionNo}
            </code>
          </p>
        </div>
      </motion.div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Info */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="section-card space-y-4"
        >
          <h3 className="font-bold text-base flex items-center gap-2 border-b border-border/40 pb-3">
            <BookOpen size={18} className="text-blue-600" />
            Academic Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-0.5">Current Class</p>
              <p className="font-semibold text-foreground capitalize">{student.classId?.name || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-0.5">Admission Date</p>
              <p className="font-semibold text-foreground">
                {student.admissionDate ? formatDate(student.admissionDate) : '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-0.5">Blood Group</p>
              <p className="font-semibold text-foreground uppercase">{student.bloodGroup || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-0.5">Previous Institution</p>
              <p className="font-semibold text-foreground">{student.previousInstitution || '—'}</p>
            </div>
          </div>
        </motion.div>

        {/* Contact & Guardian */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="section-card space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2 border-b border-border/40 pb-3">
              <User size={18} className="text-blue-600" />
              Guardian Details
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground"><User size={14} /></div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Guardian Name</p>
                  <p className="font-semibold">{student.guardianId?.name || '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground"><Phone size={14} /></div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Guardian Phone</p>
                  <p className="font-semibold">{student.guardianId?.phone || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-500/10 flex items-center justify-between mt-4">
            <div>
              <p className="text-[10px] text-blue-800 dark:text-blue-400 font-bold uppercase tracking-wider">Member ID</p>
              <p className="text-base font-bold text-blue-900 dark:text-blue-300">
                {member?.memberId || '—'}
              </p>
            </div>
            {member?._id && (
              <Link href={`/members/${member._id}`}>
                <button className="text-xs font-bold text-blue-600 hover:underline">View Member</button>
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
