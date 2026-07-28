'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Users, Contact, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function EventDetailsPage() {
  const { id } = useParams();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => apiClient.get(`/events/${id}`).then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-48 rounded-2xl shimmer" />
        <div className="h-96 rounded-2xl shimmer" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Event not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/events">
            <button className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div>
            <h1 className="page-title text-xl">Event Details</h1>
            <p className="page-subtitle font-medium">{event.title}</p>
          </div>
        </div>
        <Link href={`/events/${event._id}/edit`}>
          <button className="px-4 py-2 rounded-xl bg-white border border-border text-sm font-semibold hover:bg-muted transition-colors shadow-sm">
            Edit Event
          </button>
        </Link>
      </div>

      {/* Banner & Overview */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="section-card overflow-hidden p-0"
      >
        {event.banner?.url ? (
          <div className="h-48 w-full relative bg-muted">
            <img src={event.banner.url} alt="Banner" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-32 w-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-800/40">
            <ImageIcon size={48} />
          </div>
        )}
        
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-2xl">
            {event.description || 'No description provided.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
              <div className="flex items-center gap-2 text-emerald-600 mb-1.5">
                <Calendar size={16} />
                <span className="font-semibold text-sm">Schedule</span>
              </div>
              <p className="text-sm font-medium text-foreground">{formatDate(event.date)}</p>
              {event.endDate && (
                <p className="text-xs text-muted-foreground mt-1">To: {formatDate(event.endDate)}</p>
              )}
            </div>
            
            <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
              <div className="flex items-center gap-2 text-blue-600 mb-1.5">
                <MapPin size={16} />
                <span className="font-semibold text-sm">Location</span>
              </div>
              <p className="text-sm font-medium text-foreground">{event.venue || 'TBA'}</p>
            </div>
            
            <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
              <div className="flex items-center gap-2 text-indigo-600 mb-1.5">
                <Users size={16} />
                <span className="font-semibold text-sm">Attendance</span>
              </div>
              <p className="text-sm font-medium text-foreground">{event.registrations?.length || 0} Registered</p>
              {event.capacity && <p className="text-xs text-muted-foreground mt-1">Max capacity: {event.capacity}</p>}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Committee Members */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="section-card space-y-4"
      >
        <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Users size={20} className="text-emerald-600" />
            Event Committee & Volunteers
          </h3>
        </div>

        {!event.committeeMembers || event.committeeMembers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No committee members assigned to this event.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {event.committeeMembers.map((cm: any) => (
              <div key={cm._id} className="flex items-center justify-between p-4 rounded-2xl border border-border hover:border-emerald-500/30 transition-colors bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    {cm.memberId?.photo?.url ? (
                      <img src={cm.memberId.photo.url} alt={cm.memberId.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-muted-foreground">{cm.memberId?.name?.[0] || '?'}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{cm.memberId?.name || 'Unknown Member'}</p>
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">{cm.role}</p>
                  </div>
                </div>
                
                <Link href={`/events/${event._id}/id-card?memberId=${cm.memberId?._id}`}>
                  <button className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Generate ID Card">
                    <Contact size={20} />
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
