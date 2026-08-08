'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Skull, Calendar, MapPin, Download } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function DeathPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['death'],
    queryFn: () => apiClient.get('/death').then(r => r.data),
  });

  const deathList = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Death Registry</h1>
          <p className="page-subtitle">View and manage Mahallu death & burial records</p>
        </div>
        <Link href="/death/new">
          <button id="register-death-btn" className="btn-brand flex items-center gap-2">
            <Plus size={16} />
            Register Entry
          </button>
        </Link>
      </div>

      {/* Death Records Table */}
      <div className="section-card overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl shimmer" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="pl-6">Deceased Member</th>
                  <th>Member ID</th>
                  <th>Date of Death</th>
                  <th>Burial Place</th>
                  <th>Cause of Death</th>
                </tr>
              </thead>
              <tbody>
                {deathList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      <Skull size={40} className="mx-auto mb-3 opacity-30" />
                      <p>No death records registered yet</p>
                    </td>
                  </tr>
                ) : (
                  deathList.map((death: any, i: number) => (
                    <motion.tr
                      key={death._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <td className="pl-6 font-semibold text-sm text-foreground">
                        {death.memberId?.name || 'Deceased Member'}
                      </td>
                      <td>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded-md font-bold">{death.memberId?.memberId || '—'}</code>
                      </td>
                      <td className="text-sm text-muted-foreground">
                        {formatDate(death.dateOfDeath)}
                      </td>
                      <td className="text-sm font-medium">
                        {death.burialPlace || 'Mahallu Ground'}
                      </td>
                      <td className="text-sm text-muted-foreground">
                        {death.causeOfDeath || 'Natural'}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
