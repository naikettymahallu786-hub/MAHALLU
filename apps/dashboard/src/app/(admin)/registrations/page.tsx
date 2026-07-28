'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Clock, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import ApprovalModal from '@/components/registrations/ApprovalModal';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function RegistrationsPage() {
  const { t } = useTranslation();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pending-registrations'],
    queryFn: () => apiClient.get('/registrations/pending').then(r => r.data),
  });

  const registrations = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('registrations.title')}</h1>
          <p className="page-subtitle">{t('registrations.subtitle')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="section-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/15">
            <Clock size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{registrations.length}</p>
            <p className="text-xs text-muted-foreground">{t('registrations.pendingRequests')}</p>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="section-card overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl shimmer" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="pl-6">{t('registrations.applicant')}</th>
                  <th>{t('registrations.role')}</th>
                  <th>{t('registrations.phone')}</th>
                  <th>{t('registrations.requestedOn')}</th>
                  <th>{t('registrations.status')}</th>
                  <th className="pr-6">{t('registrations.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <UserPlus size={40} className="mx-auto mb-3 opacity-30" />
                      <p>{t('registrations.noPending')}</p>
                    </td>
                  </tr>
                ) : (
                  registrations.map((req: any, i: number) => (
                    <motion.tr
                      key={req._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="group hover:bg-muted/30"
                    >
                      <td className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                            {req.payload.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-foreground block">{req.payload.name}</span>
                            <span className="text-xs text-muted-foreground">{req.payload.email || 'No email provided'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {req.type}
                        </span>
                      </td>
                      <td className="text-muted-foreground text-sm font-medium">{req.payload.phone}</td>
                      <td className="text-muted-foreground text-sm">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium badge-pending">
                          {req.status}
                        </span>
                      </td>
                      <td className="pr-6">
                        <button 
                          onClick={() => setSelectedRequest(req)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                        >
                          {t('registrations.review')}
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

      <AnimatePresence>
        {selectedRequest && (
          <ApprovalModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onRefresh={refetch}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
