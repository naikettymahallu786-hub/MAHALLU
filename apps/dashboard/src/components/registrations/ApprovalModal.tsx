import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, XCircle, Copy } from 'lucide-react';
import { apiClient } from '@/lib/api';

export default function ApprovalModal({ request, onClose, onRefresh }: { request: any, onClose: () => void, onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<{email: string, phone: string, generatedPassword: string} | null>(null);

  const handleApprove = async () => {
    try {
      setLoading(true);
      const res = await apiClient.post(`/registrations/${request._id}/approve`);
      setCredentials(res.data.data);
      onRefresh();
    } catch (error) {
      console.error(error);
      alert('Failed to approve registration');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this registration?')) return;
    try {
      setLoading(true);
      await apiClient.post(`/registrations/${request._id}/reject`);
      onRefresh();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to reject registration');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-border flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/50">
          <h2 className="text-lg font-bold">Review Registration</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {credentials ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} />
              </div>
              <h3 className="text-xl font-bold">Registration Approved!</h3>
              <p className="text-sm text-muted-foreground">The member profile and user account have been created successfully.</p>
              
              <div className="bg-muted p-4 rounded-xl text-left mt-6 border border-border">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Generated Credentials</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-background p-3 rounded-lg border border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Email / Phone</p>
                      <p className="font-mono font-medium text-sm">{credentials.email}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-background p-3 rounded-lg border border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Password</p>
                      <p className="font-mono font-bold text-lg tracking-wider text-emerald-600 dark:text-emerald-400">{credentials.generatedPassword}</p>
                    </div>
                    <button onClick={() => handleCopy(credentials.generatedPassword)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground">
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                  <XCircle size={14} /> Please share this password securely with the user now.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                  {request.payload.name[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-none mb-1">{request.payload.name}</h3>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    Role: {request.type}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Phone Number</p>
                  <p className="text-sm font-medium">{request.payload.phone || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Email</p>
                  <p className="text-sm font-medium">{request.payload.email || 'N/A'}</p>
                </div>
                {request.payload.dob && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Date of Birth</p>
                    <p className="text-sm font-medium">{new Date(request.payload.dob).toLocaleDateString()}</p>
                  </div>
                )}
                {request.payload.gender && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Gender</p>
                    <p className="text-sm font-medium capitalize">{request.payload.gender}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-bold mb-3">Additional Details</h4>
                <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border">
                  {Object.entries(request.payload).map(([key, value]) => {
                    if (['name', 'phone', 'email', 'dob', 'gender'].includes(key)) return null;
                    return (
                      <div key={key} className="flex justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                        <span className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="text-sm font-medium text-right max-w-[60%]">{String(value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {!credentials && (
          <div className="p-4 border-t border-border bg-muted/20 flex gap-3">
            <button 
              onClick={handleReject} 
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 font-medium transition-colors disabled:opacity-50"
            >
              Reject
            </button>
            <button 
              onClick={handleApprove} 
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm shadow-emerald-900/20"
            >
              {loading ? 'Processing...' : 'Approve & Generate'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
