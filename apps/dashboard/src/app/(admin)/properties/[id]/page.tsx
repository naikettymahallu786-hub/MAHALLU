'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Package, Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => apiClient.get(`/properties/${id}`).then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center p-12">
        <p className="text-muted-foreground">Property not found.</p>
        <Link href="/properties"><button className="mt-4 text-emerald-600">Back to Properties</button></Link>
      </div>
    );
  }

  const isEquipment = property.type === 'equipment';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/properties">
          <button className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
            <ArrowLeft size={16} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Property Details</h1>
          <p className="text-sm font-medium text-muted-foreground">{property.propertyCode}</p>
        </div>
        <Link href={`/properties/${id}/edit`}>
          <button className="btn-brand">
            Edit Property
          </button>
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-muted/30 p-6 border-b border-border flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            {isEquipment ? <Package size={32} /> : <Building2 size={32} />}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{property.name}</h2>
            <p className="text-muted-foreground text-sm uppercase tracking-wider font-semibold mt-1">{property.type?.replace('_', ' ')}</p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${
              property.status === 'vacant' ? 'bg-emerald-100 text-emerald-700' : 
              property.status === 'occupied' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {property.status}
            </span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Financials</h3>
              <div className="p-4 bg-muted/30 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground">Monthly Rent / Fee</p>
                <p className="text-2xl font-bold text-emerald-600">{property.rentAmount ? formatCurrency(property.rentAmount) : 'N/A'}</p>
              </div>
            </div>

            {isEquipment && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Inventory</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-xl border border-border">
                    <p className="text-sm text-muted-foreground">Total Quantity</p>
                    <p className="text-xl font-bold">{property.quantity}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold">Available</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-500">{property.availableQuantity}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {!isEquipment && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Current Lease</h3>
                {property.currentLeaseId ? (
                  <div className="p-4 bg-muted/30 rounded-xl border border-border flex gap-3 items-center">
                     <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Building2 size={20} />
                     </div>
                     <div>
                       <p className="font-bold text-sm">Active Lease</p>
                       <p className="text-xs text-muted-foreground mt-0.5">Occupied until further notice</p>
                     </div>
                  </div>
                ) : (
                  <div className="p-4 bg-muted/30 rounded-xl border border-border border-dashed text-center">
                    <p className="text-muted-foreground text-sm font-medium">No active lease found.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
