'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Grid, CheckCircle, XCircle, Skull, Clock, Bookmark } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { toast } from 'sonner';

export default function CemeteryPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'plots' | 'requests'>('plots');
  const [selectedPlot, setSelectedPlot] = useState<any>(null);
  const [showAddPlot, setShowAddPlot] = useState(false);
  const [newPlot, setNewPlot] = useState({ plotNo: '', section: 'A', row: '', status: 'available' });

  const { data: cemeteryData, isLoading: isCemeteryLoading } = useQuery({
    queryKey: ['cemetery'],
    queryFn: () => apiClient.get('/cemetery').then(r => r.data.data),
  });

  const { data: requestsData, isLoading: isRequestsLoading } = useQuery({
    queryKey: ['cemetery-requests'],
    queryFn: () => apiClient.get('/cemetery/requests').then(r => r.data.data),
  });

  const addPlotMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/cemetery/plots', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemetery'] });
      setShowAddPlot(false);
      setNewPlot({ plotNo: '', section: 'A', row: '', status: 'available' });
      toast.success('Cemetery plot added successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to add plot');
    }
  });

  const deletePlotMutation = useMutation({
    mutationFn: (plotNo: string) => apiClient.delete(`/cemetery/plots/${plotNo}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemetery'] });
      setSelectedPlot(null);
      toast.success('Cemetery plot removed successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete plot');
    }
  });

  const updatePlotMutation = useMutation({
    mutationFn: (data: any) => apiClient.put('/cemetery/plots', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemetery'] });
      setSelectedPlot(null);
      toast.success('Cemetery plot updated successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update plot');
    }
  });

  const handleRequestMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiClient.put(`/cemetery/requests/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemetery'] });
      queryClient.invalidateQueries({ queryKey: ['cemetery-requests'] });
    }
  });

  const plots = cemeteryData?.plots || [];
  const occupiedPlots = plots.filter((p: any) => p.isOccupied || p.status === 'occupied').length;
  const bookedPlots = plots.filter((p: any) => p.status === 'booked' && !p.isOccupied).length;
  const vacantPlots = plots.length - occupiedPlots - bookedPlots;
  const pendingRequests = requestsData?.filter((r: any) => r.status === 'pending').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('cemetery.title')}</h1>
          <p className="page-subtitle">{t('cemetery.subtitle')}</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('plots')}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', activeTab === 'plots' ? 'bg-white dark:bg-slate-900 shadow text-emerald-600' : 'text-slate-500')}
          >
            {t('cemetery.plots')}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2', activeTab === 'requests' ? 'bg-white dark:bg-slate-900 shadow text-emerald-600' : 'text-slate-500')}
          >
            {t('cemetery.requests')}
            {pendingRequests > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingRequests}</span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'plots' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Capacity', value: cemeteryData?.capacity || plots.length || 200, icon: Grid, color: '#3b82f6' },
              { label: 'Occupied Plots', value: occupiedPlots, icon: Skull, color: '#f43f5e' },
              { label: 'Booked in Advance', value: bookedPlots, icon: Bookmark, color: '#f59e0b' },
              { label: 'Available Plots', value: vacantPlots, icon: CheckCircle, color: '#059669' },
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

          {/* Plot Grid Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="section-card space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-semibold">Cemetery Sector Map</h2>
                <p className="text-sm text-muted-foreground">Click on any plot to edit its status and details.</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setShowAddPlot(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow"
                >
                  {t('cemetery.addPlot')}
                </button>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></span> Available</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></span> Booked</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-100 border border-rose-300"></span> Occupied</span>
                </div>
              </div>
            </div>

            {isCemeteryLoading ? (
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {[...Array(30)].map((_, i) => <div key={i} className="h-10 rounded-lg shimmer" />)}
              </div>
            ) : (
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                {(plots.length > 0 ? plots : [...Array(60)].map((_, i) => ({
                  plotNo: `P-${i + 1}`,
                  status: i < 30 ? 'occupied' : (i < 40 ? 'booked' : 'available'),
                  isOccupied: i < 30,
                  section: 'A',
                }))).map((plot: any, i: number) => {
                  const status = plot.status || (plot.isOccupied ? 'occupied' : 'available');
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedPlot({ ...plot, status })}
                      className={cn(
                        'h-11 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold border transition-all duration-200 cursor-pointer hover:scale-105 select-none',
                        status === 'occupied'
                          ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400'
                          : status === 'booked'
                          ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400'
                      )}
                      title={`Plot: ${plot.plotNo} (${status})`}
                    >
                      <span>{plot.plotNo}</span>
                      <span className="text-[8px] opacity-60">Sec {plot.section || 'A'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-card space-y-4"
        >
          <h2 className="text-base font-semibold">Booking Requests</h2>
          <p className="text-sm text-muted-foreground mb-4">Review plot reservation requests from members.</p>
          
          {isRequestsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl shimmer" />)}
            </div>
          ) : requestsData?.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No plot requests found.</div>
          ) : (
            <div className="space-y-3">
              {requestsData?.map((req: any) => (
                <div key={req._id} className="p-4 border border-border rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Plot {req.plotNo} requested by {req.requestedBy?.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">Phone: {req.requestedBy?.phone} • {req.notes}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          className="px-3 py-1.5 rounded-lg text-sm font-medium border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          onClick={() => handleRequestMutation.mutate({ id: req._id, status: 'rejected' })}
                          disabled={handleRequestMutation.isPending}
                        >
                          Reject
                        </button>
                        <button
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                          onClick={() => handleRequestMutation.mutate({ id: req._id, status: 'approved' })}
                          disabled={handleRequestMutation.isPending}
                        >
                          Approve
                        </button>
                      </>
                    ) : (
                      <span className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-medium uppercase tracking-wider",
                        req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      )}>
                        {req.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Edit Plot Modal */}
      {!!selectedPlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-[425px] overflow-hidden">
            <div className="p-6 pb-0">
              <h2 className="text-lg font-bold">{t('cemetery.editPlot')} {selectedPlot?.plotNo}</h2>
            </div>
            <div className="grid gap-4 p-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('cemetery.status')}</label>
                <select
                  className="w-full p-2.5 border rounded-lg bg-background text-foreground text-sm"
                  value={selectedPlot?.status || 'available'}
                  onChange={(e) => setSelectedPlot({ ...selectedPlot, status: e.target.value, isOccupied: e.target.value === 'occupied' })}
                >
                  <option value="available">{t('cemetery.available')} (Green)</option>
                  <option value="booked">{t('cemetery.booked')} (Yellow)</option>
                  <option value="occupied">{t('cemetery.occupied')} (Red)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('cemetery.section')}</label>
                <input
                  type="text"
                  className="w-full p-2.5 border rounded-lg bg-background text-sm"
                  value={selectedPlot?.section || ''}
                  onChange={(e) => setSelectedPlot({ ...selectedPlot, section: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('cemetery.row')}</label>
                <input
                  type="text"
                  className="w-full p-2.5 border rounded-lg bg-background text-sm"
                  value={selectedPlot?.row || ''}
                  onChange={(e) => setSelectedPlot({ ...selectedPlot, row: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-between items-center p-6 pt-0">
              <button
                className="px-4 py-2 text-sm bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-medium transition-colors"
                onClick={() => {
                  if (confirm(t('cemetery.confirmDeletePlot'))) {
                    deletePlotMutation.mutate(selectedPlot.plotNo);
                  }
                }}
                disabled={deletePlotMutation.isPending}
              >
                {t('cemetery.deletePlot')}
              </button>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" onClick={() => setSelectedPlot(null)}>{t('cemetery.cancel')}</button>
                <button 
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50" 
                  onClick={() => updatePlotMutation.mutate(selectedPlot)} 
                  disabled={updatePlotMutation.isPending}
                >
                  {t('cemetery.saveChanges')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Plot Modal */}
      {showAddPlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-[425px] overflow-hidden">
            <div className="p-6 pb-0">
              <h2 className="text-lg font-bold">{t('cemetery.addPlot')}</h2>
            </div>
            <div className="grid gap-4 p-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('cemetery.plotNo')} *</label>
                <input
                  type="text"
                  placeholder="e.g. P-61"
                  className="w-full p-2.5 border rounded-lg bg-background text-sm"
                  value={newPlot.plotNo}
                  onChange={(e) => setNewPlot({ ...newPlot, plotNo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('cemetery.status')}</label>
                <select
                  className="w-full p-2.5 border rounded-lg bg-background text-foreground text-sm"
                  value={newPlot.status}
                  onChange={(e) => setNewPlot({ ...newPlot, status: e.target.value })}
                >
                  <option value="available">{t('cemetery.available')} (Green)</option>
                  <option value="booked">{t('cemetery.booked')} (Yellow)</option>
                  <option value="occupied">{t('cemetery.occupied')} (Red)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('cemetery.section')}</label>
                <input
                  type="text"
                  className="w-full p-2.5 border rounded-lg bg-background text-sm"
                  value={newPlot.section}
                  onChange={(e) => setNewPlot({ ...newPlot, section: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('cemetery.row')}</label>
                <input
                  type="text"
                  className="w-full p-2.5 border rounded-lg bg-background text-sm"
                  value={newPlot.row}
                  onChange={(e) => setNewPlot({ ...newPlot, row: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <button className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" onClick={() => setShowAddPlot(false)}>{t('cemetery.cancel')}</button>
              <button 
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50" 
                onClick={() => addPlotMutation.mutate(newPlot)} 
                disabled={addPlotMutation.isPending || !newPlot.plotNo.trim()}
              >
                {t('cemetery.addPlot')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
