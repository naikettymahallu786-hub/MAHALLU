'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Award, FileText, CheckCircle, Clock, XCircle, Search, Eye, ExternalLink, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

const TYPE_LABELS: Record<string, string> = {
  marriage_certificate: 'Marriage Certificate',
  marriage_clearance: 'Marriage Clearance',
  panchayath_letter: 'Panchayath Letter',
  village_letter: 'Village Letter',
  other_org_letter: 'Other Organizations Letter',
  caste_certificate: 'Caste Certificate',
  noc: 'NOC (No Objection Certificate)',
  residence: 'Residence Certificate',
  membership: 'Membership Certificate',
  nikah: 'Nikah Certificate',
};

export default function AdminCertificatesPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'issued'>('requests');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch requests
  const { data: requests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['admin-certificate-requests', statusFilter],
    queryFn: () => apiClient.get(`/certificates/requests?status=${statusFilter}`).then(r => r.data.data),
  });

  // Fetch issued certificates
  const { data: issuedCerts = [], isLoading: isLoadingIssued } = useQuery({
    queryKey: ['admin-issued-certificates'],
    queryFn: () => apiClient.get('/certificates').then(r => r.data.data),
  });

  const filteredRequests = requests.filter((r: any) => 
    (r.requestedBy?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.purpose || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredIssued = issuedCerts.filter((c: any) => 
    (c.recipientId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.certificateNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Award className="text-emerald-600" size={28} />
            Certificates Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review requests, verify details, issue official certificates with E-Sign & E-Stamp
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'requests' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Certificate Requests
          </button>
          <button
            onClick={() => setActiveTab('issued')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'issued' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Issued Certificates
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search applicant name or cert type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filter for Requests */}
        {activeTab === 'requests' && (
          <div className="flex gap-2 w-full sm:w-auto">
            {['PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === st ? 'bg-emerald-600 text-white shadow-sm' : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* REQUESTS LIST TAB */}
      {activeTab === 'requests' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {isLoadingRequests ? (
            <div className="p-12 text-center text-muted-foreground text-sm">Loading certificate requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">No certificate requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Applicant</th>
                    <th className="p-4">Certificate Type</th>
                    <th className="p-4">Purpose</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRequests.map((req: any) => (
                    <tr key={req._id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-bold text-foreground">
                        {req.requestedBy?.name || 'Member'}
                        <span className="block text-[11px] font-normal text-muted-foreground">{req.requestedBy?.phone || 'No phone'}</span>
                      </td>
                      <td className="p-4 font-bold text-emerald-800 dark:text-emerald-400">
                        {TYPE_LABELS[req.type] || req.type}
                      </td>
                      <td className="p-4 text-muted-foreground max-w-xs truncate">
                        {req.purpose}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${
                          req.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                          req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/certificates/requests/${req._id}`}>
                          <button className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5">
                            <Eye size={14} />
                            Verify & Approve
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ISSUED CERTIFICATES TAB */}
      {activeTab === 'issued' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {isLoadingIssued ? (
            <div className="p-12 text-center text-muted-foreground text-sm">Loading issued certificates...</div>
          ) : filteredIssued.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">No issued certificates found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Cert Ref No</th>
                    <th className="p-4">Recipient</th>
                    <th className="p-4">Certificate Type</th>
                    <th className="p-4">E-Sign & E-Stamp</th>
                    <th className="p-4">Issued Date</th>
                    <th className="p-4 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredIssued.map((cert: any) => (
                    <tr key={cert._id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-foreground">
                        {cert.certificateNo}
                      </td>
                      <td className="p-4 font-bold text-foreground">
                        {cert.recipientId?.name || 'Member'}
                      </td>
                      <td className="p-4 font-bold text-emerald-800 dark:text-emerald-400">
                        {TYPE_LABELS[cert.type] || cert.type}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            ✍️ E-Sign
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                            🏵️ E-Stamp
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(cert.issuedAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-emerald-600 font-bold inline-flex items-center gap-1">
                          <ShieldCheck size={14} /> Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
