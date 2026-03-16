import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AnimatePresence } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Lead } from '@/types/leads';
import { parseDateStr } from '@/types/leads';
import { FollowUpTimeline } from './FollowUpTimeline';
import { LeadDrillDown } from './LeadDrillDown';
import { computeAssociateStats } from './AssociateOverview';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  leads: Lead[];
}

type SortKey = 'fullName' | 'createdAt' | 'associate' | 'status' | 'stageName' | 'sourceName' | 'ltv' | 'center';
type SortDir = 'asc' | 'desc';

const ROW_HEIGHT = 48;

export function LeadTable({ leads }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => {
    const result = [...leads];
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
  }, [leads, sortKey, sortDir]);

  const rowVirtualizer = useVirtualizer({
    count: sorted.length,
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

  return (
    <>
      <div className="glass-strong rounded-2xl shadow-elevated overflow-hidden">
        {/* Summary Bar */}
        <div className="px-5 py-3 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{sorted.length}</span>
            <span className="text-sm text-muted-foreground">lead{sorted.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <span>Converted <strong className="text-accent-converted ml-1">{sorted.filter(l => l.conversionStatus === 'Converted').length}</strong></span>
            <span>Lost <strong className="text-accent-overdue ml-1">{sorted.filter(l => l.status === 'Lost').length}</strong></span>
            <span>Active <strong className="text-foreground ml-1">{sorted.filter(l => l.status !== 'Lost' && l.conversionStatus !== 'Converted').length}</strong></span>
          </div>
        </div>

        <div ref={parentRef} className="overflow-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
          <table className="w-full border-collapse" style={{ minWidth: '1400px' }}>
            <colgroup>
              <col style={{ width: '200px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '130px' }} />
              <col style={{ width: '130px' }} />
              <col style={{ width: '130px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '220px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '90px' }} />
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
                    className="h-10 px-4 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none whitespace-nowrap"
                  >
                    <span className="inline-flex items-center gap-1">
                      {label} <SortIcon col={key} />
                    </span>
                  </th>
                ))}
                <th className="h-10 px-4 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground whitespace-nowrap">Remarks</th>
                <th className="h-10 px-4 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground whitespace-nowrap">Follow-ups</th>
                <th
                  onClick={() => toggleSort('ltv')}
                  className="h-10 px-4 text-right text-[10px] uppercase tracking-widest font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none whitespace-nowrap"
                >
                  <span className="inline-flex items-center justify-end gap-1">
                    LTV <SortIcon col="ltv" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={10} style={{ height: `${rowVirtualizer.getVirtualItems()[0]?.start ?? 0}px`, padding: 0, border: 'none' }} /></tr>
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const lead = sorted[virtualRow.index];
                const emptyRemarks = !lead.remarks || lead.remarks === '-';

                return (
                  <tr
                    key={lead.id + '-' + virtualRow.index}
                    onClick={() => setSelectedLead(lead)}
                    className="cursor-pointer transition-colors hover:bg-primary/[0.03] border-b border-border/15 group"
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    {/* Lead Name — hover tooltip with phone, email, source */}
                    <td className="px-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="truncate text-sm font-medium text-foreground leading-tight cursor-default">
                            {lead.fullName}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[320px] p-3 space-y-1.5">
                          <p className="text-xs font-semibold text-foreground">{lead.fullName}</p>
                          <div className="space-y-1 text-[11px] text-muted-foreground">
                            <p>📱 {lead.phoneNumber || '—'}</p>
                            <p>📧 {lead.email || '—'}</p>
                            <p>📍 {lead.sourceName || '—'}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    {/* Date */}
                    <td className="px-4">
                      <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">{lead.createdAt || '—'}</span>
                    </td>
                    {/* Associate */}
                    <td className="px-4">
                      <span className="text-xs text-foreground whitespace-nowrap">{lead.associate}</span>
                    </td>
                    {/* Center */}
                    <td className="px-4">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{lead.center ? lead.center.split(',')[0].trim() : '—'}</span>
                    </td>
                    {/* Source */}
                    <td className="px-4">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{lead.sourceName || '—'}</span>
                    </td>
                    {/* Stage — uniform blue gradient badge */}
                    <td className="px-4">
                      {lead.stageName && lead.stageName !== '-' ? (
                        <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-md text-[10px] font-semibold whitespace-nowrap gradient-primary text-primary-foreground shadow-sm">
                          {lead.stageName}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>
                    {/* Status — uniform blue gradient badge */}
                    <td className="px-4">
                      <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-md text-[10px] font-semibold whitespace-nowrap gradient-primary text-primary-foreground shadow-sm">
                        {lead.status}
                      </span>
                    </td>
                    {/* Remarks */}
                    <td className="px-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={`text-[11px] leading-snug truncate block max-w-[200px] cursor-default ${emptyRemarks ? 'italic text-muted-foreground/40' : 'text-muted-foreground'}`}>
                            {emptyRemarks ? 'No remarks' : lead.remarks}
                          </span>
                        </TooltipTrigger>
                        {!emptyRemarks && (
                          <TooltipContent side="top" className="max-w-[400px] p-3">
                            <p className="text-xs leading-relaxed text-foreground">{lead.remarks}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </td>
                    {/* Follow-ups */}
                    <td className="px-4">
                      <FollowUpTimeline followUps={lead.followUps} status={lead.status} compact />
                    </td>
                    {/* LTV */}
                    <td className="px-4 text-right">
                      <span className={`text-xs font-mono ${lead.ltv > 0 ? 'text-accent-converted font-semibold' : 'text-muted-foreground/50'}`}>
                        {lead.ltv > 0 ? `₹${lead.ltv.toLocaleString()}` : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              <tr><td colSpan={10} style={{ height: `${rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end ?? 0)}px`, padding: 0, border: 'none' }} /></tr>
            </tbody>
          </table>
        </div>

        {sorted.length === 0 && (
          <div className="p-16 text-center">
            <p className="text-sm text-muted-foreground">No leads match your filters.</p>
          </div>
        )}
      </div>

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
