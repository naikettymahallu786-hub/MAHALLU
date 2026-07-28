'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Building2, DollarSign, Home, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';

export default function PropertiesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => apiClient.get('/properties').then(r => r.data),
  });

  const { data: requestsData } = useQuery({
    queryKey: ['rental-requests'],
    queryFn: () => apiClient.get('/properties/requests').then(r => r.data),
  });

  const properties = data?.data || [];
  const allRequests = requestsData?.data || [];
  const pendingRequests = allRequests.filter((r: any) => r.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Properties & Rentals</h1>
          <p className="page-subtitle">Manage Mahallu shops, houses and lands</p>
        </div>
        <Link href="/properties/new">
          <button id="add-property-btn" className="btn-brand flex items-center gap-2">
            <Plus size={16} />
            Add Property
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Properties', value: properties.length, icon: Building2, color: '#3b82f6' },
          { label: 'Occupied Rentals', value: properties.filter((p: any) => p.status === 'occupied').length, icon: CheckCircle2, color: '#059669' },
          { label: 'Vacant / Maintenance', value: properties.filter((p: any) => p.status !== 'occupied').length, icon: AlertTriangle, color: '#f59e0b' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="section-card flex items-center gap-4 animate-count"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15` }}>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pending Rental Requests */}
      {pendingRequests.length > 0 && (
        <div className="section-card border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/10">
          <h2 className="text-lg font-bold text-amber-900 dark:text-amber-500 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} />
            Pending Rental Requests
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((req: any) => (
              <div key={req._id} className="bg-white dark:bg-background p-4 rounded-xl shadow-sm border border-border flex items-center justify-between">
                <div>
                  <p className="font-bold">{req.propertyId?.name} <span className="text-muted-foreground text-sm font-normal">x {req.quantityRequested}</span></p>
                  <p className="text-sm text-muted-foreground">Requested by {req.requestedBy?.name} • {new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
                <Link href={`/properties/requests/${req._id}`}>
                  <button className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-bold rounded-lg transition-colors">
                    Review Request
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Properties Table */}
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
                  <th className="pl-6">Property Code</th>
                  <th>Property Name</th>
                  <th>Type</th>
                  <th>Monthly Rent</th>
                  <th>Status</th>
                  <th className="pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                      <p>No properties found</p>
                    </td>
                  </tr>
                ) : (
                  properties.map((property: any, i: number) => (
                    <motion.tr
                      key={property._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="group"
                    >
                      <td className="pl-6">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded-md font-bold">{property.propertyCode}</code>
                      </td>
                      <td>
                        <span className="font-medium text-foreground">
                          {property.name}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 capitalize font-medium">
                          {property.type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm font-semibold text-emerald-600">
                          {property.rentAmount ? formatCurrency(property.rentAmount) : '—'}
                        </span>
                      </td>
                      <td>
                        <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold capitalize',
                          property.status === 'occupied' ? 'badge-active' : property.status === 'vacant' ? 'badge-inactive' : 'badge-pending'
                        )}>
                          {property.status}
                        </span>
                      </td>
                      <td className="pr-6">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/properties/${property._id}`}>
                            <button className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 transition-colors">
                              <Eye size={15} />
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
      </div>
    </div>
  );
}
