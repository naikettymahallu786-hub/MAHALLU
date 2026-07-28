'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, FileText, Loader2, Eye, Award, CheckSquare, X } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

const CERTIFICATE_TYPE_LABELS: Record<string, string> = {
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

export default function CertificateRequestDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Approval Form State
  const [selectedType, setSelectedType] = useState('marriage_certificate');
  const [customCertNo, setCustomCertNo] = useState('');
  const [isESigned, setIsESigned] = useState(true);
  const [signedBy, setSignedBy] = useState('Secretary, Mahallu Committee');
  const [isEStamped, setIsEStamped] = useState(true);
  const [sealTitle, setSealTitle] = useState('Official Seal of Mahallu');
  const [verifiedDetails, setVerifiedDetails] = useState<Record<string, any>>({});

  const { data: request, isLoading } = useQuery({
    queryKey: ['certificate-request', id],
    queryFn: () => apiClient.get(`/certificates/requests/${id}`).then(r => r.data.data),
  });

  // Initialize approval states when request loads
  useState(() => {
    if (request) {
      setSelectedType(request.type || 'marriage_certificate');
      setVerifiedDetails(request.details || {});
    }
  });

  const approveMutation = useMutation({
    mutationFn: () => apiClient.post(`/certificates/requests/${id}/approve`, {
      type: selectedType,
      customCertificateNo: customCertNo.trim() || undefined,
      details: verifiedDetails,
      eSign: { isSigned: isESigned, signedBy, designation: 'Authorized Signatory' },
      eStamp: { isStamped: isEStamped, sealTitle },
    }),
    onSuccess: () => {
      toast.success('Certificate verified, e-signed, stamped & sent to user successfully!');
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      setShowApprovalModal(false);
      setShowPreviewModal(false);
      router.push('/certificates');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to approve request')
  });

  const rejectMutation = useMutation({
    mutationFn: () => apiClient.post(`/certificates/requests/${id}/reject`),
    onSuccess: () => {
      toast.success('Certificate request declined.');
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      router.push('/certificates');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to decline request')
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center p-12">
        <p className="text-muted-foreground">Request not found.</p>
        <Link href="/certificates"><button className="mt-4 text-emerald-600 font-bold">Back to Certificates</button></Link>
      </div>
    );
  }

  const currentTypeLabel = CERTIFICATE_TYPE_LABELS[selectedType] || CERTIFICATE_TYPE_LABELS[request.type] || request.type;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/certificates">
          <button className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Review Certificate Request</h1>
          <p className="text-sm font-medium text-muted-foreground">Verify details, attach E-Sign & E-Stamp, and generate official document</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-muted/30 p-6 border-b border-border flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Award size={26} />
          </div>
          <div>
            <h2 className="text-xl font-bold">{CERTIFICATE_TYPE_LABELS[request.type] || request.type} Request</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Applicant: <span className="font-semibold text-foreground">{request.requestedBy?.name || 'Member'}</span> ({request.requestedBy?.phone || 'No phone'})</p>
            <p className="text-muted-foreground text-xs mt-1">Submitted on {new Date(request.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="ml-auto">
            <span className={`px-3.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${
              request.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 
              request.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}>
              {request.status}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Stated Purpose</h3>
            <div className="p-4 bg-muted/30 rounded-xl text-sm border border-border font-medium">
              {request.purpose || 'No purpose description provided.'}
            </div>
          </div>

          {/* Dynamic Details provided by applicant */}
          {request.details && Object.keys(request.details).length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Applicant Submitted Form Data</h3>
              <div className="grid grid-cols-2 gap-3 p-4 bg-muted/20 rounded-xl border border-border text-sm">
                {Object.entries(request.details).map(([k, v]) => {
                  if (!v) return null;
                  return (
                    <div key={k}>
                      <span className="text-xs text-muted-foreground font-semibold capitalize">{k.replace(/([A-Z])/g, ' $1')}: </span>
                      <span className="font-bold text-foreground">{String(v)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {request.status === 'PENDING' && (
          <div className="p-4 bg-muted/30 border-t border-border flex gap-3 justify-end">
            <button 
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending || approveMutation.isPending}
              className="px-5 py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {rejectMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
              Decline Request
            </button>
            <button 
              onClick={() => {
                setSelectedType(request.type || 'marriage_certificate');
                setVerifiedDetails(request.details || {});
                setShowApprovalModal(true);
              }}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 flex items-center gap-2 transition-colors shadow-sm"
            >
              <CheckCircle size={16} />
              Verify, E-Sign & Approve
            </button>
          </div>
        )}
      </motion.div>

      {/* Admin Approval & Verification Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center pb-4 border-b border-border mb-4">
              <div>
                <h3 className="text-lg font-bold">Verify & Approve Certificate</h3>
                <p className="text-xs text-muted-foreground">Select template, verify details, and attach E-Sign/E-Stamp</p>
              </div>
              <button onClick={() => setShowApprovalModal(false)} className="p-2 text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Template selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Select Certificate Template Modal *</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="marriage_certificate">Marriage Certificate</option>
                  <option value="marriage_clearance">Marriage Clearance</option>
                  <option value="panchayath_letter">Panchayath Letter</option>
                  <option value="village_letter">Village Letter</option>
                  <option value="other_org_letter">Other Organizations Letter</option>
                  <option value="caste_certificate">Caste Certificate</option>
                  <option value="noc">NOC (No Objection Certificate)</option>
                  <option value="residence">Residence Certificate</option>
                  <option value="membership">Membership Certificate</option>
                </select>
              </div>

              {/* Custom Cert No */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Certificate Reference Number (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-generated if left blank (e.g. CERT-2026-00012)"
                  value={customCertNo}
                  onChange={(e) => setCustomCertNo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                />
              </div>

              {/* E-Sign Controls */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-emerald-900 dark:text-emerald-300">
                    <input
                      type="checkbox"
                      checked={isESigned}
                      onChange={(e) => setIsESigned(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    Attach Digital E-Signature
                  </label>
                  <span className="text-xs bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded">E-Sign Enabled</span>
                </div>
                {isESigned && (
                  <input
                    type="text"
                    value={signedBy}
                    onChange={(e) => setSignedBy(e.target.value)}
                    placeholder="Signatory Title (e.g. Secretary, Mahallu Committee)"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs"
                  />
                )}
              </div>

              {/* E-Stamp Controls */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-amber-900 dark:text-amber-300">
                    <input
                      type="checkbox"
                      checked={isEStamped}
                      onChange={(e) => setIsEStamped(e.target.checked)}
                      className="w-4 h-4 accent-amber-600 rounded"
                    />
                    Attach Official E-Stamp Seal
                  </label>
                  <span className="text-xs bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded">E-Stamp Enabled</span>
                </div>
                {isEStamped && (
                  <input
                    type="text"
                    value={sealTitle}
                    onChange={(e) => setSealTitle(e.target.value)}
                    placeholder="Seal Designation (e.g. Official Seal of Mahallu Committee)"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs"
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-emerald-600 text-emerald-600 font-bold text-sm hover:bg-emerald-50 flex items-center justify-center gap-2 transition-colors"
                >
                  <Eye size={16} />
                  Preview Certificate Document
                </button>
                <button
                  type="button"
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                >
                  {approveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Approve & Send to User
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Live Document Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border-8 border-emerald-950">
            <button onClick={() => setShowPreviewModal(false)} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full">
              <X size={20} color="#0f172a" />
            </button>

            {/* Mahallu Official Letterhead */}
            <div className="text-center border-b-2 border-emerald-900 pb-4 mb-6">
              <h2 className="text-3xl font-black tracking-widest text-emerald-950 uppercase">MAHALLU JUMA MASJID COMMITTEE</h2>
              <p className="text-xs font-bold text-emerald-800 mt-1 uppercase">OFFICIAL CERTIFICATE & LETTER ISSUANCE AUTHORITY</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Register No: MHL/2026/GOVT • Mahallu Office</p>
            </div>

            <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-6">
              <span>Ref: {customCertNo || 'CERT-2026-PREVIEW'}</span>
              <span>Date: {new Date().toLocaleDateString()}</span>
            </div>

            <h3 className="text-2xl font-black text-center text-emerald-950 uppercase tracking-wide mb-6 underline underline-offset-8 decoration-amber-500">
              {currentTypeLabel}
            </h3>

            <div className="space-y-4 text-sm leading-relaxed text-slate-800 text-justify">
              <p>
                This is to officially certify that <span className="font-bold underline">{request.requestedBy?.name || 'Applicant Member'}</span>, residing under this Mahallu jurisdiction, is a verified and registered member.
              </p>

              <p>
                This certificate is issued for the purpose of: <span className="font-semibold italic">{request.purpose}</span>.
              </p>

              {Object.entries(verifiedDetails).length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5 my-4">
                  {Object.entries(verifiedDetails).map(([k, v]) => {
                    if (!v) return null;
                    return (
                      <div key={k} className="flex justify-between">
                        <span className="font-semibold text-slate-600 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="font-bold text-slate-900">{String(v)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-xs text-slate-600">
                This document is issued by the Mahallu Executive Committee after verification of records.
              </p>
            </div>

            {/* Seals & E-Sign section */}
            <div className="flex justify-between items-end mt-12 pt-6 border-t border-slate-200">
              {isEStamped && (
                <div className="w-24 h-24 border-2 border-dashed border-emerald-800 rounded-full flex flex-col items-center justify-center p-1 bg-emerald-50/60">
                  <Award size={24} className="text-emerald-800" />
                  <span className="text-[7px] font-black text-emerald-950 text-center uppercase mt-1">OFFICIAL SEAL</span>
                  <span className="text-[6px] text-emerald-800 text-center">{sealTitle}</span>
                </div>
              )}

              {isESigned && (
                <div className="text-right">
                  <p className="font-serif italic font-bold text-xl text-emerald-950 mb-1">{signedBy}</p>
                  <p className="text-xs font-bold text-slate-800">Authorized Signatory</p>
                  <p className="text-[10px] text-slate-500">Secretary, Mahallu Committee</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
              <span>Verified Digital Copy</span>
              <span className="font-bold text-emerald-800">Status: READY TO SEND</span>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  approveMutation.mutate();
                }}
                disabled={approveMutation.isPending}
                className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <CheckCircle size={14} />
                Looks Good - Approve & Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
