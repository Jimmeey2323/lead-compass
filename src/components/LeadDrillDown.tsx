import { motion } from 'framer-motion';
import { X, Phone, Mail, MessageSquare, ArrowRight, ExternalLink } from 'lucide-react';
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
      className="fixed top-0 right-0 h-full w-full md:w-[500px] glass-strong shadow-elevated z-50 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 gradient-header p-5 text-primary-foreground">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{lead.fullName}</h2>
            <p className="text-sm opacity-80 font-mono mt-0.5">ID: {lead.id}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/10">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" className="gap-1.5 text-xs bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground border-0 rounded-lg">
            <Phone className="h-3.5 w-3.5" /> Call
          </Button>
          <Button size="sm" className="gap-1.5 text-xs bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground border-0 rounded-lg">
            <Mail className="h-3.5 w-3.5" /> Email
          </Button>
          <Button size="sm" className="gap-1.5 text-xs bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground border-0 rounded-lg">
            <MessageSquare className="h-3.5 w-3.5" /> Message
          </Button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={lead.status} type={lead.status === 'Lost' ? 'destructive' : lead.status.includes('Trial') ? 'info' : 'default'} />
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
        <Section title="Conversion Path">
          <div className="flex items-center gap-2 flex-wrap">
            {conversionPath.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs bg-primary/5 text-foreground border border-primary/10 px-3 py-1.5 rounded-lg font-medium">{step}</span>
                {i < conversionPath.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </Section>

        {/* Contact Info */}
        <Section title="Contact Details">
          <div className="space-y-0">
            <InfoRow label="Phone" value={lead.phoneNumber} mono />
            <InfoRow label="Email" value={lead.email} />
            <InfoRow label="Center" value={lead.center} />
            <InfoRow label="Class Type" value={lead.classType} />
            <InfoRow label="Channel" value={lead.channel} />
            <InfoRow label="Associate" value={lead.associate} />
            <InfoRow label="Source" value={lead.sourceName} />
            <InfoRow label="Created" value={lead.createdAt} mono />
            {lead.convertedAt && lead.convertedAt !== '-' && (
              <InfoRow label="Converted" value={lead.convertedAt} mono />
            )}
          </div>
        </Section>

        {/* Remarks */}
        <Section title="Remarks">
          <p className={`text-sm p-3.5 rounded-xl leading-relaxed ${
            !lead.remarks || lead.remarks === '-'
              ? 'bg-accent-warning/8 text-accent-warning border border-accent-warning/15 italic'
              : 'bg-surface/80 text-foreground border border-border/30'
          }`}>
            {lead.remarks && lead.remarks !== '-' ? lead.remarks : 'No remarks added'}
          </p>
        </Section>

        {/* Follow-up Timeline */}
        <Section title="Follow-up History">
          <div className="mb-4">
            <FollowUpTimeline followUps={lead.followUps} status={lead.status} />
          </div>
          <div className="space-y-2.5">
            {lead.followUps.map((fu) => {
              const hasDate = !!fu.date && fu.date !== '-';
              const hasComment = !!fu.comment && fu.comment !== '-';
              return (
                <div key={fu.index} className={`p-3.5 rounded-xl text-sm border ${
                  !hasDate ? 'bg-muted/30 border-border/20 text-muted-foreground/50' :
                  !hasComment ? 'bg-accent-warning/5 border-accent-warning/15' :
                  'bg-surface/50 border-border/30'
                }`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-semibold text-foreground text-xs">Follow Up {fu.index}</span>
                    {hasDate && <span className="font-mono text-[11px] text-muted-foreground">{fu.date}</span>}
                  </div>
                  <p className={`text-xs leading-relaxed ${!hasComment && hasDate ? 'text-accent-warning italic' : 'text-muted-foreground'}`}>
                    {hasComment ? fu.comment : hasDate ? 'Missing feedback' : 'Not scheduled'}
                  </p>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Associate Benchmark */}
        {associateStats && (
          <Section title="Associate Performance">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Total Leads" value={String(associateStats.totalLeads)} />
              <MetricCard label="Conv. Rate" value={`${associateStats.conversionRate.toFixed(1)}%`} highlight={associateStats.conversionRate > 20} />
              <MetricCard label="Avg Follow-ups" value={associateStats.avgFollowUps.toFixed(1)} />
              <MetricCard label="Overdue" value={String(associateStats.overdueFollowUps)} highlight={associateStats.overdueFollowUps > 0} highlightDestructive />
            </div>
          </Section>
        )}
      </div>
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}

function StatusBadge({ label }: { label: string; type: string }) {
  if (!label || label === '-') return null;
  return (
    <span className="inline-flex items-center justify-center h-6 px-3 rounded-md text-[10px] font-semibold gradient-primary text-primary-foreground shadow-sm whitespace-nowrap">
      {label}
    </span>
  );
}

function MetricCard({ label, value, highlight, highlightDestructive }: { label: string; value: string; highlight?: boolean; highlightDestructive?: boolean }) {
  return (
    <div className={`p-3.5 rounded-xl border ${highlight ? (highlightDestructive ? 'bg-accent-overdue/5 border-accent-overdue/15' : 'bg-accent-converted/5 border-accent-converted/15') : 'bg-surface/50 border-border/30'}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${
        highlight ? (highlightDestructive ? 'text-accent-overdue' : 'text-accent-converted') : 'text-foreground'
      }`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-border/20 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm text-foreground ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  );
}
