'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';

export default function MemberQRCardPage() {
  const { id } = useParams();

  const { data: memberRes, isLoading } = useQuery({
    queryKey: ['member-qr', id],
    queryFn: () => apiClient.get(`/members/${id}/qr-card`).then(r => r.data.data),
  });

  const member = memberRes;

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse space-y-4 w-72">
          <div className="h-96 bg-muted rounded-2xl" />
        </div>
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
    <div className="space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <Link href="/members">
            <button className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <h1 className="page-title text-base">QR ID Card</h1>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border text-sm hover:bg-muted transition-colors"
        >
          <Printer size={15} />
          Print Card
        </button>
      </div>

      {/* ID Card Visualizer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm mx-auto bg-gradient-to-br from-emerald-600 to-emerald-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-emerald-500/25 aspect-[2.3/3.6] flex flex-col justify-between print:shadow-none print:border print:text-black print:from-white print:to-white"
      >
        {/* Background Overlay Pattern */}
        <div className="islamic-pattern absolute inset-0 opacity-10" />

        {/* Top Info */}
        <div className="relative z-10 text-center space-y-1">
          <h2 className="text-sm font-bold tracking-widest uppercase opacity-85">Mahallu Census ID Card</h2>
          <p className="text-[10px] opacity-60">Jamia Masjid Mahallu Committee</p>
        </div>

        {/* QR Code Container */}
        <div className="relative z-10 my-4 flex items-center justify-center">
          <div className="w-40 h-40 bg-white p-3 rounded-2xl shadow-inner flex items-center justify-center">
            {member.qrCode ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.qrCode} alt="Member QR Code" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg" />
            )}
          </div>
        </div>

        {/* Member Details */}
        <div className="relative z-10 space-y-4 border-t border-white/20 pt-4 print:border-black/20">
          <div className="text-center">
            <h3 className="text-lg font-bold truncate">{member.name}</h3>
            <code className="text-xs bg-black/20 px-2.5 py-0.5 rounded-full font-semibold opacity-90 tracking-wider">
              {member.memberId}
            </code>
          </div>

          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px] opacity-75">
            <div>
              <p className="font-semibold uppercase tracking-wider opacity-60">Phone</p>
              <p className="font-bold truncate">{member.phone}</p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wider opacity-60">Blood Group</p>
              <p className="font-bold">{member.bloodGroup || '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="font-semibold uppercase tracking-wider opacity-60">Address</p>
              <p className="font-bold truncate">
                {member.familyId?.address?.line1 || 'Mahallu Ward ' + (member.familyId?.wardNo || '—')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-center text-[9px] opacity-40 border-t border-white/10 pt-2 print:border-black/10">
          <span>This card is property of JMM001 Mahallu. Scan to verify credentials.</span>
        </div>
      </motion.div>
    </div>
  );
}
