'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Download, QrCode, Users, UserCheck, UserX, Eye, Edit } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/useTranslation';

const STATUS_COLORS = {
  active: 'badge-active',
  inactive: 'badge-inactive',
  deceased: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  migrated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function MembersPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [gender, setGender] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['members', page, search, status, gender],
    queryFn: () => apiClient.get('/members', {
      params: { page, limit: 20, search, status, gender },
    }).then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['member-stats'],
    queryFn: () => apiClient.get('/members/stats').then(r => r.data.data),
  });

  const members = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('members.title')}</h1>
          <p className="page-subtitle">{t('members.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
            <Download size={16} />
            {t('members.export')}
          </button>
          <Link href="/members/new">
            <button id="add-member-btn" className="btn-brand flex items-center gap-2">
              <Plus size={16} />
              {t('members.addMember')}
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('members.totalMembers'), value: stats?.total || 0, icon: Users, color: '#3b82f6' },
          { label: t('members.active'), value: stats?.active || 0, icon: UserCheck, color: '#059669' },
          { label: t('members.male'), value: stats?.male || 0, icon: Users, color: '#6366f1' },
          { label: t('members.female'), value: stats?.female || 0, icon: Users, color: '#ec4899' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="section-card flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15` }}>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="section-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('members.search')}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="deceased">Deceased</option>
          </select>
          <select
            value={gender}
            onChange={e => { setGender(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="section-card overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[...Array(8)].map((_, i) => <div key={i} className="h-14 rounded-xl shimmer" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="pl-6">{t('members.name')}</th>
                  <th>{t('members.id')}</th>
                  <th>{t('members.phone')}</th>
                  <th>{t('members.gender')}</th>
                  <th>{t('members.occupation')}</th>
                  <th>{t('members.status')}</th>
                  <th className="pr-6">{t('members.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Users size={40} className="mx-auto mb-3 opacity-30" />
                      <p>{t('members.noMembers')}</p>
                    </td>
                  </tr>
                ) : (
                  members.map((member: {
                    _id: string;
                    name: string;
                    photo?: { url: string };
                    memberId: string;
                    phone: string;
                    gender: string;
                    occupation?: string;
                    status: string;
                  }, i: number) => (
                    <motion.tr
                      key={member._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="group"
                    >
                      <td className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
                            {member.photo?.url ? (
                              <Image src={member.photo.url} alt={member.name} width={36} height={36} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                                {member.name[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-foreground">{member.name}</span>
                        </div>
                      </td>
                      <td>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded-md">{member.memberId}</code>
                      </td>
                      <td className="text-muted-foreground text-sm">{member.phone}</td>
                      <td>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize font-medium',
                          member.gender === 'male' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                        )}>
                          {member.gender === 'male' ? t('members.male') : member.gender === 'female' ? t('members.female') : member.gender}
                        </span>
                      </td>
                      <td className="text-sm text-muted-foreground">{member.occupation || '—'}</td>
                      <td>
                        <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize',
                          STATUS_COLORS[member.status as keyof typeof STATUS_COLORS] || 'badge-inactive')}>
                          {member.status === 'active' ? t('members.active') : member.status}
                        </span>
                      </td>
                      <td className="pr-6">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/members/${member._id}`}>
                            <button className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 transition-colors">
                              <Eye size={15} />
                            </button>
                          </Link>
                          <Link href={`/members/${member._id}/edit`}>
                            <button className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 transition-colors">
                              <Edit size={15} />
                            </button>
                          </Link>
                          <Link href={`/members/${member._id}/qr-card`}>
                            <button className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 transition-colors">
                              <QrCode size={15} />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total} members
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Previous
              </button>
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                      page === pageNum ? 'bg-emerald-600 text-white' : 'hover:bg-muted',
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
