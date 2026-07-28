'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Heart, Calendar, FileText, Download, Edit2, Trash2, Search, X, Award } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function NikahPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedNikah, setSelectedNikah] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['nikah'],
    queryFn: () => apiClient.get('/nikah').then(r => r.data),
  });

  const nikahList = data?.data || [];

  const editMutation = useMutation({
    mutationFn: (data: any) => apiClient.put(`/nikah/${data._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nikah'] });
      setSelectedNikah(null);
      toast.success('Marriage record updated successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update marriage record');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/nikah/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nikah'] });
      toast.success('Marriage record deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete marriage record');
    }
  });

  const handlePrintCertificate = (nikah: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Marriage Certificate - ${nikah.nikahNo}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Noto+Naskh+Arabic:wght@700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            background: #fff;
            color: #0f172a;
            padding: 30px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 90vh;
          }
          .cert-container {
            border: 12px double #047857;
            padding: 50px;
            position: relative;
            border-radius: 20px;
            width: 100%;
            max-width: 650px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            background: #fafdfb;
          }
          .header {
            text-align: center;
            margin-bottom: 35px;
          }
          .header h1 {
            font-size: 30px;
            color: #047857;
            margin: 5px 0 0 0;
            font-weight: 800;
            letter-spacing: 1px;
          }
          .header p {
            font-size: 13px;
            color: #64748b;
            margin: 3px 0;
            font-weight: 600;
          }
          .arabic-word {
            font-family: 'Noto Naskh Arabic', serif;
            font-size: 36px;
            color: #047857;
            margin-bottom: 5px;
          }
          .body-text {
            text-align: center;
            line-height: 2.2;
            font-size: 16px;
            margin-bottom: 45px;
            color: #334155;
          }
          .body-text .highlight {
            font-weight: 800;
            color: #047857;
            border-bottom: 1.5px dashed #059669;
            padding: 0 4px;
          }
          .body-text .sub-info {
            font-size: 13px;
            color: #64748b;
            display: block;
            line-height: 1.4;
            margin-top: 2px;
            margin-bottom: 12px;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            font-size: 12px;
            font-weight: 600;
            color: #475569;
          }
          .sig-line {
            border-top: 1.5px solid #cbd5e1;
            width: 160px;
            text-align: center;
            padding-top: 8px;
            margin-top: 40px;
          }
          @media print {
            body { padding: 0; background: none; }
            .cert-container { box-shadow: none; border-color: #000; }
            .cert-container h1, .cert-container .highlight { color: #000; border-color: #000; }
          }
        </style>
      </head>
      <body>
        <div class="cert-container">
          <div class="header">
            <div class="arabic-word">م</div>
            <h1>MARRIAGE CERTIFICATE</h1>
            <p>MAHALLU MUSLIM JAMA-ATH REGISTRY</p>
            <p style="font-family: monospace; font-weight: 800; margin-top: 12px; font-size: 15px; color: #047857;">NO: ${nikah.nikahNo}</p>
          </div>
          
          <div class="body-text">
            This is to certify that the marriage (Nikah) between <br>
            <span class="highlight">${nikah.groomName}</span> (Groom)<br>
            <span class="sub-info">Son of ${nikah.groomFatherName}</span>
            and <br>
            <span class="highlight">${nikah.brideName}</span> (Bride)<br>
            <span class="sub-info">Daughter of ${nikah.brideFatherName}</span>
            was solemnized on <span class="highlight">${new Date(nikah.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span><br>
            at <span class="highlight">${nikah.venue || 'Mahallu Auditorium'}</span><br>
            with a Mehr of <span class="highlight">₹${nikah.mehr}</span>.
          </div>

          <div class="footer">
            <div>
              <div class="sig-line">Solemnizing Imam</div>
            </div>
            <div>
              <div class="sig-line">Groom Signature</div>
            </div>
            <div>
              <div class="sig-line">Mahallu Registrar</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Stats calculations
  const totalMarriages = nikahList.length;
  const currentYear = new Date().getFullYear();
  const marriagesThisYear = nikahList.filter((n: any) => new Date(n.date).getFullYear() === currentYear).length;
  const totalMehr = nikahList.reduce((sum: number, n: any) => sum + (n.mehr || 0), 0);
  const latestMarriage = nikahList.length > 0 ? formatDate(nikahList[0].date) : 'N/A';

  const filteredList = nikahList.filter((nikah: any) =>
    nikah.nikahNo.toLowerCase().includes(search.toLowerCase()) ||
    nikah.groomName.toLowerCase().includes(search.toLowerCase()) ||
    nikah.brideName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Marriage (Nikah) Registry</h1>
          <p className="page-subtitle">View, edit, delete, and download Mahallu wedding certificates</p>
        </div>
        <Link href="/nikah/new">
          <button id="register-nikah-btn" className="btn-brand flex items-center gap-2">
            <Plus size={16} />
            Register Nikah
          </button>
        </Link>
      </div>

      {/* Analytics Cards */}
      {!isLoading && nikahList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Marriages', value: totalMarriages, icon: Heart, color: '#ec4899' },
            { label: 'Registered This Year', value: marriagesThisYear, icon: Calendar, color: '#3b82f6' },
            { label: 'Total Mehr Amount', value: formatCurrency(totalMehr), icon: Award, color: '#059669' },
            { label: 'Latest Solemnization', value: latestMarriage, icon: FileText, color: '#f59e0b' },
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
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 bg-card rounded-2xl p-4 border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search by name or Nikah ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Nikah Registry Table */}
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
                  <th className="pl-6">Nikah No</th>
                  <th>Groom (Husband)</th>
                  <th>Bride (Wife)</th>
                  <th>Mehr</th>
                  <th>Venue</th>
                  <th>Marriage Date</th>
                  <th className="pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Heart size={40} className="mx-auto mb-3 opacity-30 text-pink-500" />
                      <p>No marriage entries registered yet</p>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((nikah: any, i: number) => (
                    <motion.tr
                      key={nikah._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="group"
                    >
                      <td className="pl-6">
                        <code className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-xl font-bold dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400">
                          {nikah.nikahNo}
                        </code>
                      </td>
                      <td>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{nikah.groomName}</p>
                          <p className="text-xs text-muted-foreground">S/o: {nikah.groomFatherName}</p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{nikah.brideName}</p>
                          <p className="text-xs text-muted-foreground">D/o: {nikah.brideFatherName}</p>
                        </div>
                      </td>
                      <td className="text-sm font-bold text-emerald-600">
                        {formatCurrency(nikah.mehr || 0)}
                      </td>
                      <td className="text-sm text-muted-foreground">
                        {nikah.venue || 'Mahallu Auditorium'}
                      </td>
                      <td className="text-sm text-muted-foreground">
                        {formatDate(nikah.date)}
                      </td>
                      <td className="pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handlePrintCertificate(nikah)}
                            className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                            title="Download Certificate"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => setSelectedNikah(nikah)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this Nikah record permanently?')) {
                                deleteMutation.mutate(nikah._id);
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* Edit Marriage Record Modal */}
      {!!selectedNikah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl shadow-lg w-full max-w-[500px] overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-muted/40">
              <h2 className="text-lg font-bold">Edit Nikah Record</h2>
              <button onClick={() => setSelectedNikah(null)} className="p-1 rounded-lg hover:bg-slate-100"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Groom Name *</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={selectedNikah.groomName || ''}
                    onChange={(e) => setSelectedNikah({ ...selectedNikah, groomName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Groom Father *</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={selectedNikah.groomFatherName || ''}
                    onChange={(e) => setSelectedNikah({ ...selectedNikah, groomFatherName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bride Name *</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={selectedNikah.brideName || ''}
                    onChange={(e) => setSelectedNikah({ ...selectedNikah, brideName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bride Father *</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={selectedNikah.brideFatherName || ''}
                    onChange={(e) => setSelectedNikah({ ...selectedNikah, brideFatherName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mehr Amount (INR) *</label>
                <input
                  type="number"
                  className="w-full p-2.5 border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={selectedNikah.mehr || ''}
                  onChange={(e) => setSelectedNikah({ ...selectedNikah, mehr: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Marriage Date *</label>
                  <input
                    type="date"
                    className="w-full p-2.5 border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={selectedNikah.date ? new Date(selectedNikah.date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setSelectedNikah({ ...selectedNikah, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Venue</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={selectedNikah.venue || ''}
                    onChange={(e) => setSelectedNikah({ ...selectedNikah, venue: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-6 border-t bg-muted/20">
              <button className="px-4 py-2 text-sm border rounded-xl hover:bg-slate-50" onClick={() => setSelectedNikah(null)}>Cancel</button>
              <button
                className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold disabled:opacity-50"
                onClick={() => editMutation.mutate(selectedNikah)}
                disabled={editMutation.isPending}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
