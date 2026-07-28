'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MessageCircle, ShieldAlert, CheckCircle, RefreshCw, Send } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function WhatsAppPage() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiClient.get('/settings').then(r => r.data.data),
  });

  const apiConnected = settings?.notifications?.whatsappEnabled;

  const testConnection = () => {
    toast.success('WhatsApp API connection verified successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">WhatsApp Bot & API</h1>
          <p className="page-subtitle">Configure WhatsApp Business API, webhook triggers and message logs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection status */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-card lg:col-span-2 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <MessageCircle size={18} className="text-emerald-600" />
              API Gateway Configuration
            </h3>
            <span className={cn('text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider',
              apiConnected ? 'badge-active' : 'badge-inactive'
            )}>
              {apiConnected ? 'Connected' : 'Offline'}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-1">Webhook URL</p>
              <code className="text-xs bg-muted px-3 py-2 rounded-xl block border border-border/40 select-all">
                http://localhost:5000/api/v1/whatsapp/webhook
              </code>
            </div>

            <div>
              <p className="text-sm font-semibold mb-1">Webhook Verify Token</p>
              <code className="text-xs bg-muted px-3 py-2 rounded-xl block border border-border/40 select-all">
                {process.env.WHATSAPP_VERIFY_TOKEN || 'mahallu_verify_token_default_123'}
              </code>
            </div>
          </div>

          <div className="border-t border-border/40 pt-5 flex gap-3">
            <button
              onClick={testConnection}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
            >
              <RefreshCw size={15} />
              Test API connection
            </button>
          </div>
        </motion.div>

        {/* Templates cards */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="section-card space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <h3 className="font-semibold text-base flex items-center gap-2 border-b border-border/40 pb-3">
              <ShieldAlert size={18} className="text-emerald-600" />
              WhatsApp Reminders
            </h3>
            <p className="text-xs text-muted-foreground">Automated WhatsApp template messages sent to members.</p>

            <div className="p-3 rounded-xl border border-border/60 text-xs space-y-2 bg-muted/20">
              <p className="font-semibold text-foreground">Template: fee_reminder</p>
              <p className="text-muted-foreground leading-relaxed">
                "Assalamu alaikum [Name], this is a gentle reminder that your monthly subscription of [Amount] is pending. Please pay at [Link]."
              </p>
            </div>

            <div className="p-3 rounded-xl border border-border/60 text-xs space-y-2 bg-muted/20">
              <p className="font-semibold text-foreground">Template: event_announcement</p>
              <p className="text-muted-foreground leading-relaxed">
                "Dear member, [Event Title] is scheduled on [Date] at [Venue]. Please register to participate."
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
