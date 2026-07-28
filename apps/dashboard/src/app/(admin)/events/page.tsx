'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Calendar, MapPin, Users, Heart, Award, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function EventsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => apiClient.get('/events').then(r => r.data),
  });

  const events = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('events.title')}</h1>
          <p className="page-subtitle">{t('events.subtitle')}</p>
        </div>
        <Link href="/events/new">
          <button id="add-event-btn" className="btn-brand flex items-center gap-2">
            <Plus size={16} />
            {t('events.createEvent')}
          </button>
        </Link>
      </div>

      {/* Events Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-2xl shimmer" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="section-card flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
          <Calendar size={48} className="mb-4 text-emerald-600 opacity-40 animate-pulse" />
          <h2 className="text-lg font-semibold mb-1">{t('events.noEvents')}</h2>
          <p className="text-sm max-w-sm mb-4">{t('events.noEventsDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: any, i: number) => (
            <Link key={event._id} href={`/events/${event._id}`}>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              className="section-card flex flex-col justify-between group cursor-pointer hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden"
            >
              {/* Islamic Pattern Backdrop */}
              <div className="islamic-pattern absolute inset-0 opacity-5" />

              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <span className={cn('text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider',
                    event.isPaid ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  )}>
                    {event.isPaid ? `Paid · ${formatCurrency(event.fee)}` : 'Free Entry'}
                  </span>
                  {event.isFeatured && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold uppercase tracking-wider">
                      Featured
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-lg text-foreground group-hover:text-emerald-600 transition-colors leading-tight">
                  {event.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {event.description || t('events.defaultDesc')}
                </p>
              </div>

              <div className="border-t border-border/40 pt-4 mt-5 space-y-2 text-xs text-muted-foreground relative z-10">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-emerald-600" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-emerald-600" />
                  <span className="truncate">{event.venue || t('events.defaultVenue')}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-border/20 justify-between">
                  <div className="flex items-center gap-1">
                    <Users size={14} className="text-emerald-600" />
                    <span className="font-semibold text-foreground">{event.registrations?.length || 0} {t('events.registered')}</span>
                  </div>
                  {event.capacity && (
                    <span className="opacity-60">Max {event.capacity} seats</span>
                  )}
                </div>
              </div>
            </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
