import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AnimatePresence } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown, Phone, Mail } from 'lucide-react';
import type { Lead, FilterState } from '@/types/leads';
import { parseDateStr, getDateRange } from '@/types/leads';
import { FollowUpTimeline } from './FollowUpTimeline';
import { LeadDrillDown } from './LeadDrillDown';
import { computeAssociateStats } from './AssociateOverview';
import { Badge } from '@/components/ui/badge';

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

const columns: { key: SortKey; label: string; className: string }[] = [
  { key: 'fullName', label: 'Lead', className: 'w-[200px] min-w-[200px]' },
  { key: 'associate', label: 'Associate', className: 'w-[130px] min-w-[130px]' },
  { key: 'center', label: 'Center', className: 'w-[140px] min-w-[140px]' },
  { key: 'sourceName', label: 'Source', className: 'w-[130px] min-w-[130px]' },
  { key: 'stageName', label: 'Stage', className: 'w-[130px] min-w-[130px]' },
  { key: 'status', label: 'Status', className: 'w-[120px] min-w-[120px]' },
];

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
    estimateSize: () => 72,
    overscan: 15,
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const associateStats = useMemo(() => computeAssociateStats(leads), [leads]);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      'Lost': 'bg-accent-overdue/10 text-accent-overdue border-accent-overdue/20',
      'Trial Completed': 'bg-accent-converted/10 text-accent-converted border-accent-converted/20',
      'Trial Scheduled': 'bg-accent-info/10 text-accent-info border-accent-info/20',
      'Not Interested - Other': 'bg-muted text-muted-foreground border-border/50',
    };
    return map[status] || 'bg-primary/8 text-primary border-primary/15';
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/30" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  return (
    <>
      <div className="glass-strong rounded-2xl shadow-elevated overflow-hidden">
        {/* Result Count Bar */}
        <div className="px-5 py-3 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">{filtered.length}</span>
            <span className="text-sm text-muted-foreground">lead{filtered.length !== 1 ? 's' : ''} found</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Converted: <strong className="text-accent-converted">{filtered.filter(l => l.conversionStatus === 'Converted').length}</strong></span>
            <span>Lost: <strong className="text-accent-overdue">{filtered.filter(l => l.status === 'Lost').length}</strong></span>
            <span>Active: <strong className="text-foreground">{filtered.filter(l => l.status !== 'Lost' && l.conversionStatus !== 'Converted').length}</strong></span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed" style={{ minWidth: '1200px' }}>
            <thead>
              <tr className="gradient-subtle">
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className={`h-11 px-4 text-left align-middle font-semibold text-muted-foreground border-b border-border/40 text-[11px] uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none ${col.className}`}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      <SortIcon col={col.key} />
                    </div>
                  </th>
                ))}
                <th className="h-11 px-4 text-left align-middle font-semibold text-muted-foreground border-b border-border/40 text-[11px] uppercase tracking-wider w-[180px] min-w-[180px]">Remarks</th>
                <th className="h-11 px-4 text-left align-middle font-semibold text-muted-foreground border-b border-border/40 text-[11px] uppercase tracking-wider w-[140px] min-w-[140px]">Follow-ups</th>
                <th
                  onClick={() => toggleSort('ltv')}
                  className="h-11 px-4 text-right align-middle font-semibold text-muted-foreground border-b border-border/40 text-[11px] uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors w-[80px] min-w-[80px]"
                >
                  <div className="flex items-center justify-end gap-1.5">LTV <SortIcon col="ltv" /></div>
                </th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Virtualized Body */}
        <div ref={parentRef} className="overflow-auto" style={{ maxHeight: 'calc(100vh - 380px)' }}>
          <div className="overflow-x-auto">
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative', minWidth: '1200px' }}>
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const lead = filtered[virtualRow.index];
                const emptyRemarks = !lead.remarks || lead.remarks === '-';

                return (
                  <div
                    key={lead.id + '-' + virtualRow.index}
                    className="absolute top-0 left-0 w-full group cursor-pointer transition-all duration-150 hover:bg-primary/[0.02]"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className="flex items-center h-full border-b border-border/20">
                      {/* Lead Name + Contact */}
                      <div className="w-[200px] min-w-[200px] px-4 flex-shrink-0">
                        <div className="text-sm font-medium text-foreground truncate">{lead.fullName}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-muted-foreground truncate">{lead.phoneNumber}</span>
                        </div>
                      </div>
                      {/* Associate */}
                      <div className="w-[130px] min-w-[130px] px-4 flex-shrink-0">
                        <span className="text-sm text-foreground truncate block">{lead.associate}</span>
                      </div>
                      {/* Center */}
                      <div className="w-[140px] min-w-[140px] px-4 flex-shrink-0">
                        <span className="text-xs text-muted-foreground truncate block">{lead.center ? lead.center.split(',')[0] : '—'}</span>
                      </div>
                      {/* Source */}
                      <div className="w-[130px] min-w-[130px] px-4 flex-shrink-0">
                        <span className="text-xs text-muted-foreground truncate block">{lead.sourceName || '—'}</span>
                      </div>
                      {/* Stage */}
                      <div className="w-[130px] min-w-[130px] px-4 flex-shrink-0">
                        <Badge variant="outline" className={`${statusBadge(lead.stageName)} text-[10px] font-medium px-2 py-0.5 rounded-md`}>
                          {lead.stageName || '—'}
                        </Badge>
                      </div>
                      {/* Status */}
                      <div className="w-[120px] min-w-[120px] px-4 flex-shrink-0">
                        <Badge variant="outline" className={`${statusBadge(lead.status)} text-[10px] font-medium px-2 py-0.5 rounded-md`}>
                          {lead.status}
                        </Badge>
                      </div>
                      {/* Remarks */}
                      <div className="w-[180px] min-w-[180px] px-4 flex-shrink-0">
                        <p className={`text-xs leading-relaxed line-clamp-2 ${emptyRemarks ? 'italic text-accent-warning/70' : 'text-muted-foreground'}`}>
                          {emptyRemarks ? 'No remarks' : lead.remarks}
                        </p>
                      </div>
                      {/* Follow-ups */}
                      <div className="w-[140px] min-w-[140px] px-4 flex-shrink-0">
                        <FollowUpTimeline followUps={lead.followUps} status={lead.status} compact />
                      </div>
                      {/* LTV */}
                      <div className={`w-[80px] min-w-[80px] px-4 flex-shrink-0 text-right ${lead.ltv > 0 ? 'text-accent-converted font-semibold' : 'text-muted-foreground'}`}>
                        <span className="text-sm font-mono">₹{lead.ltv.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="p-16 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No leads match your filters. Try adjusting your criteria.</p>
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

function Search(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  );
}
