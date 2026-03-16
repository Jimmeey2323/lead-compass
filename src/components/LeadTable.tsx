import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AnimatePresence } from 'framer-motion';
import { Phone, Mail, UserCheck, ArrowUpDown } from 'lucide-react';
import type { Lead, FilterState } from '@/types/leads';
import { FollowUpTimeline } from './FollowUpTimeline';
import { LeadDrillDown } from './LeadDrillDown';
import { computeAssociateStats } from './AssociateOverview';
import { Badge } from '@/components/ui/badge';

interface Props {
  leads: Lead[];
  filters: FilterState;
}

type SortKey = 'fullName' | 'createdAt' | 'associate' | 'status' | 'ltv' | 'visits';
type SortDir = 'asc' | 'desc';

function applyFilters(leads: Lead[], filters: FilterState): Lead[] {
  return leads.filter(l => {
    if (filters.associate !== 'all' && l.associate !== filters.associate) return false;
    if (filters.status !== 'all' && l.status !== filters.status) return false;
    if (filters.center !== 'all' && l.center !== filters.center) return false;
    if (filters.channel !== 'all' && l.channel !== filters.channel) return false;
    if (filters.conversionStatus !== 'all' && l.conversionStatus !== filters.conversionStatus) return false;
    if (filters.trialStatus !== 'all' && l.trialStatus !== filters.trialStatus) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (
        !l.fullName.toLowerCase().includes(s) &&
        !l.email.toLowerCase().includes(s) &&
        !l.phoneNumber.includes(s) &&
        !l.id.includes(s)
      ) return false;
    }
    return true;
  });
}

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
      if (sortKey === 'ltv' || sortKey === 'visits') {
        valA = Number(valA);
        valB = Number(valB);
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
    estimateSize: () => 52,
    overscan: 20,
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const associateStats = useMemo(() => computeAssociateStats(leads), [leads]);

  const statusBadgeClass = (status: string) => {
    if (status === 'Lost') return 'bg-accent-overdue/10 text-accent-overdue border-accent-overdue/20';
    if (status === 'Trial Completed') return 'bg-accent-converted/10 text-accent-converted border-accent-converted/20';
    if (status === 'Trial Scheduled') return 'bg-accent-info/10 text-accent-info border-accent-info/20';
    return 'bg-surface text-muted-foreground border-border';
  };

  const columns: { key: SortKey; label: string; width: string }[] = [
    { key: 'fullName', label: 'Lead', width: 'min-w-[200px]' },
    { key: 'associate', label: 'Associate', width: 'min-w-[140px]' },
    { key: 'status', label: 'Status', width: 'min-w-[130px]' },
    { key: 'createdAt', label: 'Created', width: 'min-w-[100px]' },
    { key: 'ltv', label: 'LTV', width: 'min-w-[80px]' },
    { key: 'visits', label: 'Visits', width: 'min-w-[70px]' },
  ];

  return (
    <>
      <div className="shadow-card rounded-xl bg-card overflow-hidden">
        {/* Result count */}
        <div className="px-4 py-2 border-b border-border/50 flex items-center justify-between">
          <span className="text-data text-muted-foreground">
            {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Header */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className={`h-10 px-4 text-left align-middle font-medium text-muted-foreground border-b border-border text-header uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors ${col.width}`}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <ArrowUpDown className={`h-3 w-3 ${sortKey === col.key ? 'text-foreground' : 'text-muted-foreground/40'}`} />
                    </div>
                  </th>
                ))}
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground border-b border-border text-header uppercase tracking-wider min-w-[140px]">Follow-ups</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground border-b border-border text-header uppercase tracking-wider min-w-[120px]">Conversion</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground border-b border-border text-header uppercase tracking-wider min-w-[60px]"></th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Virtualized Body */}
        <div ref={parentRef} className="overflow-auto max-h-[calc(100vh-320px)]">
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const lead = filtered[virtualRow.index];
              const hasEmptyRemarks = !lead.remarks;

              return (
                <div
                  key={lead.id}
                  className="absolute top-0 left-0 w-full group cursor-pointer transition-colors hover:bg-surface/50"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex items-center h-full border-b border-border/30">
                    {/* Lead */}
                    <div className="min-w-[200px] px-4 flex-shrink-0">
                      <div className="text-data font-medium text-foreground truncate">{lead.fullName}</div>
                      <div className="text-[11px] font-mono-data text-muted-foreground truncate">{lead.email}</div>
                    </div>
                    {/* Associate */}
                    <div className="min-w-[140px] px-4 text-data truncate flex-shrink-0">{lead.associate}</div>
                    {/* Status */}
                    <div className="min-w-[130px] px-4 flex-shrink-0">
                      <Badge variant="outline" className={`${statusBadgeClass(lead.status)} text-[11px]`}>
                        {lead.status}
                      </Badge>
                    </div>
                    {/* Created */}
                    <div className="min-w-[100px] px-4 text-data font-mono-data flex-shrink-0">{lead.createdAt}</div>
                    {/* LTV */}
                    <div className={`min-w-[80px] px-4 text-data font-mono-data flex-shrink-0 ${lead.ltv > 0 ? 'text-accent-converted font-semibold' : ''}`}>
                      ₹{lead.ltv}
                    </div>
                    {/* Visits */}
                    <div className="min-w-[70px] px-4 text-data font-mono-data flex-shrink-0">{lead.visits}</div>
                    {/* Follow-ups */}
                    <div className="min-w-[140px] px-4 flex-shrink-0">
                      <FollowUpTimeline followUps={lead.followUps} status={lead.status} />
                    </div>
                    {/* Conversion */}
                    <div className="min-w-[120px] px-4 text-data flex-shrink-0">
                      <span className={lead.conversionStatus === 'Converted' ? 'text-accent-converted' : lead.conversionStatus === 'Not Converted' ? 'text-muted-foreground' : ''}>
                        {lead.conversionStatus}
                      </span>
                    </div>
                    {/* Quick Actions */}
                    <div className="min-w-[60px] px-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      <Mail className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-data text-muted-foreground">No leads require immediate follow-up. You're caught up.</p>
          </div>
        )}
      </div>

      {/* Drill-down */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <div className="fixed inset-0 bg-foreground/20 z-40" onClick={() => setSelectedLead(null)} />
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
