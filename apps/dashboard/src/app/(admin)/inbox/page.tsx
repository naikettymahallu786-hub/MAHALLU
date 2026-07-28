'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Inbox, ArrowRight, UserPlus, MapPin, CheckCircle, Clock, FileText, Package } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

export default function InboxPage() {
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');

  const { data: inboxItems, isLoading, refetch } = useQuery({
    queryKey: ['inbox', filter],
    queryFn: () => apiClient.get(`/inbox?status=${filter}`).then(r => r.data.data),
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'REGISTRATION': return <UserPlus className="text-blue-600" size={20} />;
      case 'PLOT_REQUEST': return <MapPin className="text-amber-600" size={20} />;
      case 'CERTIFICATE_REQUEST': return <FileText className="text-purple-600" size={20} />;
      case 'RENTAL_REQUEST': return <Package className="text-indigo-600" size={20} />;
      default: return <Inbox className="text-emerald-600" size={20} />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'REGISTRATION': return 'bg-blue-100 dark:bg-blue-900/30';
      case 'PLOT_REQUEST': return 'bg-amber-100 dark:bg-amber-900/30';
      case 'CERTIFICATE_REQUEST': return 'bg-purple-100 dark:bg-purple-900/30';
      case 'RENTAL_REQUEST': return 'bg-indigo-100 dark:bg-indigo-900/30';
      default: return 'bg-emerald-100 dark:bg-emerald-900/30';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-20 rounded-2xl shimmer" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 rounded-2xl shimmer" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="page-header border-b pb-4 mb-4">
        <div className="flex justify-between items-center w-full">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Inbox className="text-emerald-600" />
              Action Center
            </h1>
            <p className="page-subtitle">Review requests, approvals, and updates across the platform.</p>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                filter === f ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-card border hover:bg-muted text-muted-foreground'
              }`}
            >
              {f === 'PENDING' ? 'New / Pending' : f === 'APPROVED' ? 'Approved' : f === 'REJECTED' ? 'Declined' : 'All History'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {inboxItems && inboxItems.length > 0 ? (
          inboxItems.map((item: any, index: number) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-2xl border border-border p-4 hover:border-emerald-500/30 transition-colors group flex gap-4 items-start"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getBgColor(item.type)}`}>
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-foreground text-lg">{item.title}</h3>
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 shrink-0">
                    <Clock size={12} /> {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-line mb-3">
                  {item.description}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    item.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                    item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.status === 'PENDING' ? 'Needs Approval' : item.status}
                  </span>
                  {item.status === 'PENDING' && (
                    <Link href={item.actionUrl}>
                      <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group-hover:underline">
                        Review <ArrowRight size={14} />
                      </button>
                    </Link>
                  )}
                  {item.status !== 'PENDING' && item.type === 'CERTIFICATE_REQUEST' && item.status === 'APPROVED' && (
                     <button className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                       View Certificate <ArrowRight size={14} />
                     </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-16 border border-dashed border-border rounded-2xl text-center bg-card">
            <CheckCircle size={48} className="mx-auto text-emerald-600/30 mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-1">You're all caught up!</h3>
            <p className="text-muted-foreground text-sm">There are no pending requests or approvals needing your attention.</p>
          </div>
        )}
      </div>
    </div>
  );
}
