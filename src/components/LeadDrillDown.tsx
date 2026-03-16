import { motion } from 'framer-motion';
import { X, Phone, Mail, UserCheck, MessageSquare, ArrowRight } from 'lucide-react';
import type { Lead, AssociateStats } from '@/types/leads';
import { FollowUpTimeline } from './FollowUpTimeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Props {
  lead: Lead;
  associateStats?: AssociateStats;
  onClose: () => void;
}

export function LeadDrillDown({ lead, associateStats, onClose }: Props) {
  const conversionPath = [lead.sourceName, lead.stageName, lead.conversionStatus].filter(Boolean);

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-card shadow-elevated z-50 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
        <div>
          <h2 className="text-heading text-lg">{lead.fullName}</h2>
          <p className="text-data font-mono-data">{lead.id}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-data">
            <Phone className="h-3.5 w-3.5" /> Call
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-data">
            <Mail className="h-3.5 w-3.5" /> Email
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-data">
            <MessageSquare className="h-3.5 w-3.5" /> Message
          </Button>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={lead.status} type={lead.status === 'Lost' ? 'destructive' : lead.status === 'Trial Completed' ? 'success' : 'default'} />
          <StatusBadge label={lead.conversionStatus} type={lead.conversionStatus === 'Converted' ? 'success' : 'muted'} />
          <StatusBadge label={lead.trialStatus} type={lead.trialStatus === 'Trial Completed' ? 'success' : 'muted'} />
          <StatusBadge label={lead.retentionStatus} type={lead.retentionStatus === 'Retained' ? 'success' : 'muted'} />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="LTV" value={`₹${lead.ltv.toLocaleString()}`} highlight={lead.ltv > 0} />
          <MetricCard label="Visits" value={String(lead.visits)} />
          <MetricCard label="Purchases" value={String(lead.purchasesMade)} />
        </div>

        {/* Conversion Path */}
        <div>
          <h3 className="text-header uppercase tracking-wider font-medium text-muted-foreground mb-3">Conversion Path</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {conversionPath.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-data bg-surface px-2.5 py-1 rounded-md">{step}</span>
                {i < conversionPath.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-header uppercase tracking-wider font-medium text-muted-foreground mb-3">Contact</h3>
          <div className="space-y-2">
            <InfoRow label="Phone" value={lead.phoneNumber} mono />
            <InfoRow label="Email" value={lead.email} />
            <InfoRow label="Center" value={lead.center} />
            <InfoRow label="Class" value={lead.classType} />
            <InfoRow label="Channel" value={lead.channel} />
            <InfoRow label="Associate" value={lead.associate} />
            <InfoRow label="Created" value={lead.createdAt} mono />
            {lead.convertedAt && lead.convertedAt !== '-' && (
              <InfoRow label="Converted" value={lead.convertedAt} mono />
            )}
          </div>
        </div>

        {/* Remarks */}
        {lead.remarks && (
          <div>
            <h3 className="text-header uppercase tracking-wider font-medium text-muted-foreground mb-2">Remarks</h3>
            <p className={`text-data p-3 rounded-lg ${!lead.remarks ? 'bg-accent-warning/10 text-accent-warning' : 'bg-surface'}`}>
              {lead.remarks || 'No remarks added'}
            </p>
          </div>
        )}

        {/* Follow-up Timeline */}
        <div>
          <h3 className="text-header uppercase tracking-wider font-medium text-muted-foreground mb-3">Follow-up Timeline</h3>
          <div className="mb-3">
            <FollowUpTimeline followUps={lead.followUps} status={lead.status} />
          </div>
          <div className="space-y-2">
            {lead.followUps.map((fu) => {
              const hasDate = !!fu.date && fu.date !== '-';
              const hasComment = !!fu.comment && fu.comment !== '-';
              return (
                <div key={fu.index} className={`p-3 rounded-lg text-data ${
                  !hasDate ? 'bg-surface/50 text-muted-foreground/50' :
                  !hasComment ? 'bg-accent-warning/10 border border-accent-warning/20' :
                  'bg-surface'
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-foreground">Follow Up {fu.index}</span>
                    {hasDate && <span className="font-mono-data text-[11px]">{fu.date}</span>}
                  </div>
                  <p className={!hasComment && hasDate ? 'text-accent-warning italic' : ''}>
                    {hasComment ? fu.comment : hasDate ? 'Missing feedback' : 'Not scheduled'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Associate Benchmark */}
        {associateStats && (
          <div>
            <h3 className="text-header uppercase tracking-wider font-medium text-muted-foreground mb-3">Associate Performance</h3>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Total Leads" value={String(associateStats.totalLeads)} />
              <MetricCard label="Conv. Rate" value={`${associateStats.conversionRate.toFixed(1)}%`} highlight={associateStats.conversionRate > 20} />
              <MetricCard label="Avg Follow-ups" value={associateStats.avgFollowUps.toFixed(1)} />
              <MetricCard label="Overdue" value={String(associateStats.overdueFollowUps)} highlight={associateStats.overdueFollowUps > 0} highlightDestructive />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatusBadge({ label, type }: { label: string; type: 'success' | 'destructive' | 'default' | 'muted' }) {
  const cls = {
    success: 'bg-accent-converted/10 text-accent-converted border-accent-converted/20',
    destructive: 'bg-accent-overdue/10 text-accent-overdue border-accent-overdue/20',
    default: 'bg-accent-info/10 text-accent-info border-accent-info/20',
    muted: 'bg-surface text-muted-foreground border-border',
  }[type];

  return <Badge variant="outline" className={`${cls} text-[11px]`}>{label}</Badge>;
}

function MetricCard({ label, value, highlight, highlightDestructive }: { label: string; value: string; highlight?: boolean; highlightDestructive?: boolean }) {
  return (
    <div className={`p-3 rounded-lg ${highlight ? (highlightDestructive ? 'bg-accent-overdue/10' : 'bg-accent-converted/10') : 'bg-surface'}`}>
      <p className="text-header uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-lg font-semibold font-mono-data ${
        highlight ? (highlightDestructive ? 'text-accent-overdue' : 'text-accent-converted') : 'text-foreground'
      }`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/50">
      <span className="text-data text-muted-foreground">{label}</span>
      <span className={`text-data text-foreground ${mono ? 'font-mono-data' : ''}`}>{value || '—'}</span>
    </div>
  );
}
