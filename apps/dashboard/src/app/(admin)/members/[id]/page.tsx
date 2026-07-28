'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Phone, Mail, Award, Calendar, Heart, ShieldAlert, Edit, QrCode } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';

export default function MemberDetailsPage() {
  const { id } = useParams();

  const { data: memberRes, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => apiClient.get(`/members/${id}`).then(r => r.data.data),
  });

  const member = memberRes;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-48 rounded-2xl shimmer" />
        <div className="h-96 rounded-2xl shimmer" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Member not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/members">
            <button className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div>
            <h1 className="page-title text-xl">Member Profile</h1>
            <p className="page-subtitle">Detailed census profile for {member.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/members/${id}/edit`}>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
              <Edit size={16} />
              Edit Profile
            </button>
          </Link>
          <Link href={`/members/${id}/qr-card`}>
            <button className="btn-brand flex items-center gap-2">
              <QrCode size={16} />
              View ID Card
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
        <div className="w-24 h-24 rounded-3xl overflow-hidden bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-800 dark:text-emerald-300 font-bold text-3xl shrink-0 border border-emerald-500/20 shadow-inner select-none">
          {member.photo?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.photo.url} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            member.name[0].toUpperCase()
          )}
        </div>

        <div className="space-y-2 text-center md:text-left flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
            <h2 className="text-2xl font-bold text-foreground leading-tight">{member.name}</h2>
            <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-bold w-fit mx-auto md:mx-0 capitalize',
              member.status === 'active' ? 'badge-active' : 'badge-inactive'
            )}>
              {member.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-1">
            <code className="text-xs bg-muted px-2 py-0.5 rounded font-semibold text-foreground select-all">
              ID: {member.memberId}
            </code>
          </p>
        </div>
      </motion.div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Census Info */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="section-card space-y-4 md:col-span-2"
        >
          <h3 className="font-bold text-base flex items-center gap-2 border-b border-border/40 pb-3">
            <User size={18} className="text-emerald-600" />
            Personal Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-0.5">Gender</p>
              <p className="font-semibold text-foreground capitalize">{member.gender}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-0.5">Date of Birth (Age)</p>
              <p className="font-semibold text-foreground">
                {member.dateOfBirth ? `${formatDate(member.dateOfBirth)} (${member.age} yrs)` : '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-0.5">Blood Group</p>
              <p className="font-semibold text-foreground uppercase">{member.bloodGroup || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-0.5">Aadhaar Number</p>
              <p className="font-semibold text-foreground">{member.aadhaarNumber || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-0.5">Occupation</p>
              <p className="font-semibold text-foreground">{member.occupation || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-0.5">Qualification</p>
              <p className="font-semibold text-foreground">{member.qualification || '—'}</p>
            </div>
          </div>
        </motion.div>

        {/* Contact & Family */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="section-card space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2 border-b border-border/40 pb-3">
              <Phone size={18} className="text-emerald-600" />
              Contact & Household
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground"><Phone size={14} /></div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Mobile Phone</p>
                  <p className="font-semibold">{member.phone}</p>
                </div>
              </div>

              {member.email && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted text-muted-foreground"><Mail size={14} /></div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Email</p>
                    <p className="font-semibold">{member.email}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground"><Award size={14} /></div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Family Relationship</p>
                  <p className="font-semibold capitalize">
                    {member.relationship ? `${member.relationship} of family head` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {member.familyId && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/10 flex items-center justify-between mt-4">
              <div>
                <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold uppercase tracking-wider">Mahallu Family Code</p>
                <p className="text-base font-bold text-emerald-900 dark:text-emerald-300">
                  {member.familyId?.familyCode || '—'}
                </p>
              </div>
              <Link href={`/families`}>
                <button className="text-xs font-bold text-emerald-600 hover:underline">View Family</button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
