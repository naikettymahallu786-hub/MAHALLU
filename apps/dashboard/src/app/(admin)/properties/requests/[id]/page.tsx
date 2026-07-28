'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Package, Loader2, Calendar } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export default function RentalRequestDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: request, isLoading } = useQuery({
    queryKey: ['rental-request', id],
    queryFn: () => apiClient.get(`/properties/requests/${id}`).then(r => r.data.data),
  });

  const approveMutation = useMutation({
    mutationFn: () => apiClient.post(`/properties/requests/${id}/approve`),
    onSuccess: () => {
      toast.success('Rental request approved successfully!');
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      router.push('/inbox');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to approve request')
  });

  const rejectMutation = useMutation({
    mutationFn: () => apiClient.post(`/properties/requests/${id}/reject`),
    onSuccess: () => {
      toast.success('Rental request declined.');
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      router.push('/inbox');
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
        <Link href="/inbox"><button className="mt-4 text-emerald-600">Back to Inbox</button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/inbox">
          <button className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
            <ArrowLeft size={16} />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Review Rental Request</h1>
          <p className="text-sm font-medium text-muted-foreground">Approve or decline property/equipment rental</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-muted/30 p-6 border-b border-border flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Package size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold">{request.propertyId?.name || 'Unknown Property'}</h2>
            <p className="text-muted-foreground text-sm">Requested by: <span className="font-semibold text-foreground">{request.requestedBy?.name || 'Unknown Member'}</span></p>
            <p className="text-muted-foreground text-xs mt-1">Submitted on {new Date(request.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="ml-auto">
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${
              request.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
              request.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {request.status}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-xl border border-border">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Quantity Requested</h3>
              <p className="text-xl font-bold text-indigo-600">{request.quantityRequested}</p>
              <p className="text-xs text-muted-foreground mt-1">Available: {request.propertyId?.availableQuantity || 0}</p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-xl border border-border">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Dates</h3>
              <div className="flex items-center gap-2 mt-1">
                <Calendar size={14} className="text-muted-foreground" />
                <span className="text-sm font-semibold">
                  {request.startDate ? new Date(request.startDate).toLocaleDateString() : 'N/A'} - {request.endDate ? new Date(request.endDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Member Contact</h3>
            <p className="text-sm font-medium">{request.requestedBy?.phone || 'No phone provided'}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Stated Purpose</h3>
            <div className="p-4 bg-muted/30 rounded-xl text-sm border border-border">
              {request.purpose || 'No purpose provided.'}
            </div>
          </div>
        </div>

        {request.status === 'PENDING' && (
          <div className="p-4 bg-muted/30 border-t border-border flex gap-3 justify-end">
            <button 
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending || approveMutation.isPending}
              className="px-5 py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {rejectMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
              Decline
            </button>
            <button 
              onClick={() => approveMutation.mutate()}
              disabled={rejectMutation.isPending || approveMutation.isPending || (request.propertyId?.type === 'equipment' && (request.propertyId?.availableQuantity || 0) < request.quantityRequested)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
            >
              {approveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Approve Rental
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
