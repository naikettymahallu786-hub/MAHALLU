'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Upload, FileSpreadsheet, FileDown, CheckCircle2, XCircle,
  AlertTriangle, History, RefreshCw, FileText, ShieldAlert, Check, Search, Filter, Eye
} from 'lucide-react';

interface ImportLog {
  _id: string;
  type: 'IMPORT' | 'EXPORT';
  entity: string;
  fileName: string;
  status: 'COMPLETED' | 'FAILED' | 'PROCESSING';
  totalRecords: number;
  successCount: number;
  failedCount: number;
  errorDetails?: Array<{ row: number; message: string }>;
  performedBy: string;
  createdAt: string;
}

export default function ImportExportPage() {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    totalRecords: number;
    successCount: number;
    failedCount: number;
    errorDetails: Array<{ row: number; message: string }>;
  } | null>(null);

  const [selectedErrorLog, setSelectedErrorLog] = useState<ImportLog | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch History Logs
  const { data: historyLogs = [], isLoading, refetch } = useQuery<ImportLog[]>({
    queryKey: ['import-export-history'],
    queryFn: async () => {
      const res = await apiClient.get('/members/import-export/history');
      return res.data.data;
    },
  });

  // Download Demo Template Mutation
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      const res = await apiClient.get('/members/import-export/template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Demo_Import_Template_Families_Members.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download template:', error);
      alert('Error downloading template. Please try again.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // Export Data Mutation
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const res = await apiClient.get('/members/import-export/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Export_Families_Members_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      refetch();
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Error exporting data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Upload & Import Mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/members/import-export/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setImportResult(data.data);
      setSelectedFile(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['families'] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Import failed. Please check file formatting.');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const filteredLogs = historyLogs.filter((log) =>
    log.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.performedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-background border border-emerald-500/20 p-6 rounded-2xl backdrop-blur-xl shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Family & Members Import / Export Portal</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Download demo spreadsheet templates, bulk import family & member datasets with user logins, and export records.
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-sm font-medium transition-colors border border-border"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Logs
        </button>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Download Demo Template */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Download className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Template
              </span>
            </div>
            <h2 className="text-lg font-semibold text-foreground">1. Download Demo Template</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Get an official Excel sample pre-formatted with required headers (Mahallu Code, Family Code, Address, Email, Password, Name, Gender, Phone, Relationship).
            </p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isDownloadingTemplate ? 'Generating Template...' : 'Download Demo Template (.xlsx)'}
          </button>
        </div>

        {/* Card 2: Upload & Bulk Import */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Import
              </span>
            </div>
            <h2 className="text-lg font-semibold text-foreground">2. Import Excel / CSV Data</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload your filled spreadsheet. Families, Members, and User login accounts will be automatically created.
            </p>

            <div className="mt-3">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-500/30 hover:border-emerald-500 rounded-xl p-4 cursor-pointer bg-muted/20 transition-colors text-center">
                <FileSpreadsheet className="w-8 h-8 text-emerald-400 mb-1" />
                <span className="text-xs font-medium text-foreground">
                  {selectedFile ? selectedFile.name : 'Click to select .xlsx or .csv file'}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Maximum file size: 10MB'}
                </span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <button
            onClick={() => selectedFile && importMutation.mutate(selectedFile)}
            disabled={!selectedFile || importMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {importMutation.isPending ? 'Processing Import...' : 'Import Families & Members'}
          </button>
        </div>

        {/* Card 3: Export All Data */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <FileDown className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Export
              </span>
            </div>
            <h2 className="text-lg font-semibold text-foreground">3. Export All Records</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Export all existing family codes, ward numbers, addresses, and member records into a downloadable Excel workbook.
            </p>
          </div>
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            {isExporting ? 'Generating Export...' : 'Export All Data (.xlsx)'}
          </button>
        </div>
      </div>

      {/* Import Result Notification Dialog */}
      {importResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Import Summary Results</h3>
                <p className="text-xs text-muted-foreground">Processed batch import successfully.</p>
              </div>
            </div>
            <button
              onClick={() => setImportResult(null)}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-muted/40 border border-border">
              <p className="text-2xl font-bold text-foreground">{importResult.totalRecords}</p>
              <p className="text-xs text-muted-foreground">Total Rows Read</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-2xl font-bold text-emerald-400">{importResult.successCount}</p>
              <p className="text-xs text-emerald-400/80">Successfully Imported</p>
            </div>
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <p className="text-2xl font-bold text-rose-400">{importResult.failedCount}</p>
              <p className="text-xs text-rose-400/80">Failed Rows</p>
            </div>
          </div>

          {importResult.errorDetails && importResult.errorDetails.length > 0 && (
            <div className="space-y-2 mt-4">
              <h4 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Row Warnings / Errors:
              </h4>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-rose-500/20 bg-rose-950/20 p-3 space-y-1.5 text-xs text-rose-300">
                {importResult.errorDetails.map((err, idx) => (
                  <p key={idx}>
                    <span className="font-bold text-rose-400">Row {err.row}:</span> {err.message}
                  </p>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* History & Status Section */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-muted text-foreground">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Import & Export History</h2>
              <p className="text-xs text-muted-foreground">Historical records of bulk imports, exports, and row counts.</p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search filename or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/40 border border-border text-sm text-foreground focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-muted/60 text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border">
              <tr>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">File Name</th>
                <th className="p-3.5">Performed By</th>
                <th className="p-3.5 text-center">Total Records</th>
                <th className="p-3.5 text-center">Success / Failed</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground text-sm">
                    No import or export history logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 whitespace-nowrap text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          log.type === 'IMPORT'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}
                      >
                        {log.type === 'IMPORT' ? <Upload className="w-3 h-3" /> : <FileDown className="w-3 h-3" />}
                        {log.type}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-medium max-w-[200px] truncate" title={log.fileName}>
                      {log.fileName}
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-xs text-muted-foreground">
                      {log.performedBy}
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-center font-semibold">
                      {log.totalRecords}
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-center text-xs">
                      <span className="text-emerald-400 font-bold">{log.successCount}</span>
                      {' / '}
                      <span className={log.failedCount > 0 ? 'text-rose-400 font-bold' : 'text-muted-foreground'}>
                        {log.failedCount}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          log.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {log.status === 'COMPLETED' ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-right">
                      {log.errorDetails && log.errorDetails.length > 0 ? (
                        <button
                          onClick={() => setSelectedErrorLog(log)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition-colors border border-rose-500/20 flex items-center gap-1.5 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Errors ({log.errorDetails.length})
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Details Modal */}
      <AnimatePresence>
        {selectedErrorLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                  <h3 className="text-lg font-bold text-foreground">Import Error Log Details</h3>
                </div>
                <button
                  onClick={() => setSelectedErrorLog(null)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  ✕ Close
                </button>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  File: <span className="font-semibold text-foreground">{selectedErrorLog.fileName}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Performed by: <span className="font-semibold text-foreground">{selectedErrorLog.performedBy}</span> on{' '}
                  {new Date(selectedErrorLog.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-xl border border-rose-500/20 bg-rose-950/20 p-4 space-y-2 text-xs">
                {selectedErrorLog.errorDetails?.map((err, i) => (
                  <div key={i} className="flex gap-2 text-rose-300 border-b border-rose-500/10 pb-1.5 last:border-0">
                    <span className="font-bold text-rose-400 shrink-0">Row {err.row}:</span>
                    <span>{err.message}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedErrorLog(null)}
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
