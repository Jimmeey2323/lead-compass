import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AnimatePresence } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Lead, FilterState } from '@/types/leads';
import { parseDateStr, getDateRange } from '@/types/leads';
import { FollowUpTimeline } from './FollowUpTimeline';
import { LeadDrillDown } from './LeadDrillDown';
import { computeAssociateStats } from './AssociateOverview';

interface Props {
  leads: Lead[];
  filters: FilterState;
}

type SortKey = 'fullName' | 'createdAt' | 'associate' | 'status' | 'stageName' | 'sourceName' | 'ltv' | 'center';
type SortDir = 'asc' | 'desc';

function applyFilters(leads: Lead[], filters: FilterState): Lead[] {
  const dateRange = getDateRange(filters.datePreset);

  return leads.filter(l => {
    if (filters.associate !== 'all' && l.associate !== filters.associate) return false;
    if (filters.status !== 'all' && l.status !== filters.status) return false;
    if (filters.center !== 'all' && l.center !== filters.center) return false;
    if (filters.channel !== 'all' && l.channel !== filters.channel) return false;
    if (filters.conversionStatus !== 'all' && l.conversionStatus !== filters.conversionStatus) return false;
    if (filters.trialStatus !== 'all' && l.trialStatus !== filters.trialStatus) return false;

    if (dateRange) {
      const created = parseDateStr(l.createdAt);
      if (!created || created < dateRange.from || created > dateRange.to) return false;
    }

    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (
        !l.fullName.toLowerCase().includes(s) &&
        !l.email.toLowerCase().includes(s) &&
        !l.phoneNumber.includes(s) &&
        !l.id.includes(s) &&
        !l.associate.toLowerCase().includes(s)
      ) return false;
    }
    return true;
  });
}

const ROW_HEIGHT = 52;

export function LeadTable({ leads, filters }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const result = applyFilters(leads, filters);
    result.sort((a, b) => {
      let valA: any = a[sortKey];
      let valB: any = b[sortKey];
      if (sortKey === 'ltv') {
        valA = Number(valA); valB = Number(valB);
      } else if (sortKey === 'createdAt') {
        valA = parseDateStr(String(valA))?.getTime() || 0;
        valB = parseDateStr(String(valB))?.getTime() || 0;
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [leads, filters, sortKey, sortDir]);

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const associateStats = useMemo(() => computeAssociateStats(leads), [leads]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 text-primary" />
      : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  const stageBadge = (stage: string) => {
    if (!stage || stage === '-') return 'bg-muted text-muted-foreground';
    if (stage.includes('Completed')) return 'bg-accent-converted/10 text-accent-converted border-accent-converted/20';
    if (stage.includes('Scheduled')) return 'bg-accent-info/10 text-accent-info border-accent-info/20';
    if (stage.includes('Not Interested')) return 'bg-muted text-muted-foreground border-border/40';
    return 'bg-primary/8 text-primary border-primary/15';
  };

  const statusColor = (status: string) => {
    if (status === 'Lost') return 'text-accent-overdue';
    if (status === 'Trial Completed') return 'text-accent-converted';
    if (status === 'Trial Scheduled') return 'text-accent-info';
    return 'text-muted-foreground';
  };

  return (
    <>
      <div className="glass-strong rounded-2xl shadow-elevated overflow-hidden">
        {/* Summary Bar */}
        <div className="px-5 py-3 border-b border-border/30 flex items-center justify-between bg-gradient-to-r from-background/50 to-transparent">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{filtered.length}</span>
            <span className="text-sm text-muted-foreground">lead{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <span>Converted <strong className="text-accent-converted ml-1">{filtered.filter(l => l.conversionStatus === 'Converted').length}</strong></span>
            <span>Lost <strong className="text-accent-overdue ml-1">{filtered.filter(l => l.status === 'Lost').length}</strong></span>
            <span>Active <strong className="text-foreground ml-1">{filtered.filter(l => l.status !== 'Lost' && l.conversionStatus !== 'Converted').length}</strong></span>
          </div>
        </div>

        {/* Scrollable table area */}
        <div ref={parentRef} className="overflow-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
          <table className="w-full border-collapse" style={{ minWidth: '1280px', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '180px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '130px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '200px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '70px' }} />
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="gradient-subtle border-b border-border/40">
                {([
                  ['fullName', 'Lead'],
                  ['createdAt', 'Date'],
                  ['associate', 'Associate'],
                  ['center', 'Center'],
                  ['sourceName', 'Source'],
                  ['stageName', 'Stage'],
                  ['status', 'Status'],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className="h-10 px-3 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none whitespace-nowrap"
                  >
                    <span className="inline-flex items-center gap-1">
                      {label} <SortIcon col={key} />
                    </span>
                  </th>
                ))}
                <th className="h-10 px-3 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground whitespace-nowrap">Remarks</th>
                <th className="h-10 px-3 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground whitespace-nowrap">Follow-ups</th>
                <th
                  onClick={() => toggleSort('ltv')}
                  className="h-10 px-3 text-right text-[10px] uppercase tracking-widest font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none whitespace-nowrap"
                >
                  <span className="inline-flex items-center justify-end gap-1">
                    LTV <SortIcon col="ltv" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Spacer for virtual scroll */}
              <tr><td colSpan={10} style={{ height: `${rowVirtualizer.getVirtualItems()[0]?.start ?? 0}px`, padding: 0, border: 'none' }} /></tr>
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const lead = filtered[virtualRow.index];
                const emptyRemarks = !lead.remarks || lead.remarks === '-';

                return (
                  <tr
                    key={lead.id + '-' + virtualRow.index}
                    onClick={() => setSelectedLead(lead)}
                    className="cursor-pointer transition-colors hover:bg-primary/[0.03] border-b border-border/15 group"
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    {/* Lead Name */}
                    <td className="px-3 overflow-hidden">
                      <div className="truncate text-sm font-medium text-foreground leading-tight">{lead.fullName}</div>
                      <div className="truncate text-[10px] font-mono text-muted-foreground/70 mt-0.5">{lead.phoneNumber}</div>
                    </td>
                    {/* Date */}
                    <td className="px-3">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{lead.createdAt || '—'}</span>
                    </td>
                    {/* Associate */}
                    <td className="px-3 overflow-hidden">
                      <span className="text-xs text-foreground truncate block">{lead.associate}</span>
                    </td>
                    {/* Center */}
                    <td className="px-3 overflow-hidden">
                      <span className="text-xs text-muted-foreground truncate block">{lead.center ? lead.center.split(',')[0].trim() : '—'}</span>
                    </td>
                    {/* Source */}
                    <td className="px-3 overflow-hidden">
                      <span className="text-xs text-muted-foreground truncate block">{lead.sourceName || '—'}</span>
                    </td>
                    {/* Stage */}
                    <td className="px-3 overflow-hidden">
                      <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-md border truncate max-w-full ${stageBadge(lead.stageName)}`}>
                        {lead.stageName || '—'}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-3 overflow-hidden">
                      <span className={`text-xs font-medium ${statusColor(lead.status)} truncate block`}>
                        {lead.status}
                      </span>
                    </td>
                    {/* Remarks */}
                    <td className="px-3 overflow-hidden">
                      <span className={`text-[11px] leading-snug truncate block ${emptyRemarks ? 'italic text-accent-warning/60' : 'text-muted-foreground'}`}>
                        {emptyRemarks ? 'No remarks' : lead.remarks}
                      </span>
                    </td>
                    {/* Follow-ups */}
                    <td className="px-3">
                      <FollowUpTimeline followUps={lead.followUps} status={lead.status} compact />
                    </td>
                    {/* LTV */}
                    <td className="px-3 text-right">
                      <span className={`text-xs font-mono ${lead.ltv > 0 ? 'text-accent-converted font-semibold' : 'text-muted-foreground/50'}`}>
                        {lead.ltv > 0 ? `₹${lead.ltv.toLocaleString()}` : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {/* Bottom spacer */}
              <tr><td colSpan={10} style={{ height: `${rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end ?? 0)}px`, padding: 0, border: 'none' }} /></tr>
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-16 text-center">
            <p className="text-sm text-muted-foreground">No leads match your filters.</p>
          </div>
        )}
      </div>

      {/* Drill-down */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <div className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-40" onClick={() => setSelectedLead(null)} />
            <LeadDrillDown
              lead={selectedLead}
              associateStats={associateStats.find(a => a.name === selectedLead.associate)}
              onClose={() => setSelectedLead(null)}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
