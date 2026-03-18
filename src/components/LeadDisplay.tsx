import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertCircle,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Flag,
  Globe,
  MapPinned,
  MessageCircleMore,
  PhoneCall,
  Sparkles,
  Target,
  UserRoundPlus,
  XCircle,
} from 'lucide-react';
import type { Lead } from '@/types/leads';
import { cn } from '@/lib/utils';
import { cleanLooseText } from '@/lib/lead-utils';

function getStatusMeta(status: string): { icon: LucideIcon; className: string } {
  const value = status.toLowerCase();

  if (/converted|sold|member|retained|done|completed/.test(value)) {
    return { icon: CheckCircle2, className: 'bg-emerald-900/95 text-emerald-50 border border-emerald-700/70' };
  }

  if (/lost|not interested|dropped|dead|cancel/.test(value)) {
    return { icon: XCircle, className: 'bg-red-900/95 text-red-50 border border-red-700/70' };
  }

  if (/pending|follow|awaiting|warm|new|fresh/.test(value)) {
    return { icon: Clock3, className: 'bg-amber-700/95 text-amber-50 border border-amber-500/70' };
  }

  return { icon: Activity, className: 'bg-blue-900/95 text-blue-50 border border-blue-700/70' };
}

function getSourceMeta(source: string): LucideIcon {
  const value = source.toLowerCase();
  if (/call|phone/.test(value)) return PhoneCall;
  if (/whatsapp|message|dm/.test(value)) return MessageCircleMore;
  if (/walk|referr|friend/.test(value)) return UserRoundPlus;
  if (/website|web|google|meta|instagram|facebook|online|ad/.test(value)) return Globe;
  return Sparkles;
}

function getStageMeta(stage: string): LucideIcon {
  const value = stage.toLowerCase();
  if (/trial scheduled|scheduled/.test(value)) return CalendarCheck2;
  if (/trial/.test(value)) return Target;
  if (/proximity|near/.test(value)) return MapPinned;
  if (/not interested|lost/.test(value)) return AlertCircle;
  if (/sold|member|converted/.test(value)) return CheckCircle2;
  return Flag;
}

function LeadBadge({
  label,
  icon: Icon,
  className,
}: {
  label: string;
  icon: LucideIcon;
  className: string;
}) {
  const safeLabel = cleanLooseText(label);
  if (!safeLabel || safeLabel === '-') {
    return <span className="text-xs text-muted-foreground/50">—</span>;
  }

  return (
    <span
      className={cn(
        'inline-flex h-8 w-[168px] max-w-full items-center justify-center gap-1.5 rounded-md px-3 text-[10px] font-semibold shadow-sm whitespace-nowrap',
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{safeLabel}</span>
    </span>
  );
}

export function LeadStatusBadge({ label, className }: { label: string; className?: string }) {
  const meta = getStatusMeta(label);
  return <LeadBadge label={label} icon={meta.icon} className={cn(meta.className, className)} />;
}

export function LeadStageBadge({ label, className }: { label: string; className?: string }) {
  return (
    <LeadBadge
      label={label}
      icon={getStageMeta(label)}
      className={cn('bg-slate-950/95 text-slate-50 border border-slate-700/70', className)}
    />
  );
}

export function LeadSourceBadge({ label, className }: { label: string; className?: string }) {
  return (
    <LeadBadge
      label={label}
      icon={getSourceMeta(label)}
      className={cn('bg-slate-900/95 text-slate-50 border border-slate-700/70', className)}
    />
  );
}

const hoverFields: Array<{ label: string; getValue: (lead: Lead) => string }> = [
  { label: 'Lead ID', getValue: (lead) => lead.id },
  { label: 'Phone', getValue: (lead) => lead.phoneNumber || '—' },
  { label: 'Email', getValue: (lead) => lead.email || '—' },
  { label: 'Associate', getValue: (lead) => lead.associate || '—' },
  { label: 'Center', getValue: (lead) => lead.center || '—' },
  { label: 'Created', getValue: (lead) => lead.createdAt || '—' },
  { label: 'Stage', getValue: (lead) => lead.stageName || '—' },
  { label: 'Status', getValue: (lead) => lead.status || '—' },
  { label: 'Source', getValue: (lead) => lead.sourceName || '—' },
  { label: 'Channel', getValue: (lead) => lead.channel || '—' },
  { label: 'Type', getValue: (lead) => lead.classType || '—' },
  { label: 'LTV', getValue: (lead) => (lead.ltv > 0 ? `₹${lead.ltv.toLocaleString()}` : '—') },
];

export function LeadHoverInfo({ lead }: { lead: Lead }) {
  return (
    <div className="w-full bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.22),transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.98))] p-4 text-slate-100">
      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-[24px] border border-slate-700/70 bg-slate-900/95 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <p className="text-base font-semibold text-slate-50">{lead.fullName}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              {cleanLooseText(lead.email) || cleanLooseText(lead.phoneNumber) || 'No contact details yet'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <LeadStatusBadge label={lead.status} className="min-w-[124px]" />
              <LeadStageBadge label={lead.stageName} className="min-w-[144px]" />
              <LeadSourceBadge label={lead.sourceName} className="min-w-[144px]" />
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-700/70 bg-slate-900/80 p-4 shadow-sm">
            <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">Remarks</p>
            <p className="text-xs leading-relaxed text-slate-100">{cleanLooseText(lead.remarks) || 'No remarks added'}</p>
          </div>
        </div>

        <div className="space-y-4 min-w-0">
          <div className="grid grid-cols-2 gap-3 rounded-[24px] border border-slate-700/70 bg-slate-900/80 p-4 shadow-sm">
            {hoverFields.map((field) => (
              <div key={field.label} className="min-w-0 space-y-1">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{field.label}</p>
                <p className="break-words text-xs leading-relaxed text-slate-100">{field.getValue(lead)}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[24px] border border-slate-700/70 bg-slate-900/80 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Follow Ups</p>
              <p className="text-[10px] text-slate-500">Planner view</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {lead.followUps.map((followUp) => (
                <div key={followUp.index} className="rounded-2xl border border-slate-700/60 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white">FU {followUp.index}</span>
                    <span className="text-[11px] font-mono-data text-slate-400">{cleanLooseText(followUp.date) || 'Not scheduled'}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-200/85">{cleanLooseText(followUp.comment) || 'No feedback yet'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeadIconHint({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export const LeadFieldIcons = {
  source: Building2,
  stage: CircleDashed,
};
