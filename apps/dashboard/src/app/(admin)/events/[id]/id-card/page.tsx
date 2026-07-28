'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useRef } from 'react';

export default function IDCardPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const memberId = searchParams.get('memberId');

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => apiClient.get(`/events/${id}`).then(r => r.data.data),
  });

  const printRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-brand" size={40} />
      </div>
    );
  }

  if (!event || !memberId) {
    return <div className="text-center py-12 text-muted-foreground">Invalid Event or Member</div>;
  }

  // Find the specific committee member
  const committeeMember = event.committeeMembers?.find((cm: any) => cm.memberId?._id === memberId);

  if (!committeeMember) {
    return <div className="text-center py-12 text-muted-foreground">Member not found in committee</div>;
  }

  const handlePrint = () => {
    window.print();
  };

  const member = committeeMember.memberId;
  const bgImage = event.idCardBgImage?.url || event.banner?.url;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12 print:max-w-none print:m-0 print:p-0">
      {/* Header (Hidden when printing) */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link href={`/events/${id}`}>
            <button className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div>
            <h1 className="page-title text-xl">Generate ID Card</h1>
            <p className="page-subtitle font-medium">{member.name}</p>
          </div>
        </div>
        <button onClick={handlePrint} className="btn-brand flex items-center gap-2">
          <Printer size={18} />
          Print ID Card
        </button>
      </div>

      {/* ID Card Canvas */}
      <div id="print-area" className="flex items-center justify-center py-10 print:py-0 print:h-screen print:items-start" ref={printRef}>
        
        {/* The Card Element (2.125 x 3.375 inches standard CR80 size scaled up for web display) */}
        <div 
          className="relative w-[340px] h-[540px] rounded-3xl overflow-hidden shadow-2xl bg-white border border-border/30 print:shadow-none print:border-none"
          style={{
            backgroundImage: bgImage ? `url(${bgImage})` : 'linear-gradient(to bottom, #10b981, #064e3b)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/90" />

          {/* Card Content */}
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-6">
            
            {/* Top: Event Info */}
            <div className="w-full text-center space-y-2 mt-4">
              <div className="mx-auto w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-2 shadow-inner">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <h2 className="text-white font-bold text-lg leading-tight uppercase tracking-wider">{event.title}</h2>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 inline-block">
                <p className="text-white/90 text-[10px] font-bold tracking-widest uppercase">Official Event Pass</p>
              </div>
            </div>

            {/* Middle: Photo */}
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-muted my-6">
              {member.photo?.url ? (
                <img src={member.photo.url} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-4xl text-gray-400 font-bold">{member.name?.[0] || '?'}</span>
                </div>
              )}
            </div>

            {/* Bottom: Member Info */}
            <div className="w-full text-center space-y-1 mb-4">
              <h3 className="text-2xl font-bold text-white leading-none">{member.name}</h3>
              <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm pt-2 pb-1">{committeeMember.role}</p>
              
              <div className="w-full h-px bg-white/20 my-3" />
              
              <p className="text-white/80 text-[11px]">Valid from {new Date(event.date).toLocaleDateString()}</p>
              {event.endDate && (
                <p className="text-white/80 text-[11px]">until {new Date(event.endDate).toLocaleDateString()}</p>
              )}
            </div>

          </div>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
}
