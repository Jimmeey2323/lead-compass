import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Lead, AssociateStats } from '@/types/leads';
import { isOverdue } from '@/hooks/useLeadsData';
import { TrendingUp, Users, AlertTriangle, UserCheck, Target, ChevronRight } from 'lucide-react';
import { LeadDrillDown } from './LeadDrillDown';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  leads: Lead[];
  allLeads: Lead[];
}

export function computeAssociateStats(leads: Lead[]): AssociateStats[] {
  const map = new Map<string, Lead[]>();
  leads.forEach(l => {
    if (!l.associate) return;
    if (!map.has(l.associate)) map.set(l.associate, []);
    map.get(l.associate)!.push(l);
  });

  return Array.from(map.entries()).map(([name, aLeads]) => {
    const converted = aLeads.filter(l => l.conversionStatus === 'Converted').length;
    const lost = aLeads.filter(l => l.status === 'Lost').length;
    const active = aLeads.filter(l => l.status !== 'Lost' && l.conversionStatus !== 'Converted').length;
    const totalFollowUps = aLeads.reduce((sum, l) => sum + l.followUps.filter(f => f.date && f.date !== '-').length, 0);
    const overdueFollowUps = aLeads.reduce((sum, l) => sum + l.followUps.filter(f => isOverdue(f.date, l.status)).length, 0);
    const totalLtv = aLeads.reduce((sum, l) => sum + l.ltv, 0);

    return {
      name, totalLeads: aLeads.length, converted, lost, active,
      conversionRate: aLeads.length > 0 ? (converted / aLeads.length) * 100 : 0,
      avgFollowUps: aLeads.length > 0 ? totalFollowUps / aLeads.length : 0,
      overdueFollowUps, totalLtv,
    };
  }).sort((a, b) => b.totalLeads - a.totalLeads);
}

export function AssociateOverview({ leads, allLeads }: Props) {
  const stats = computeAssociateStats(leads);
  const [expandedAssociate, setExpandedAssociate] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const totalLeads = leads.length;
  const needsAction = leads.filter(l => l.followUps.some(f => isOverdue(f.date, l.status))).length;
  const totalConverted = leads.filter(l => l.conversionStatus === 'Converted').length;
  const totalLost = leads.filter(l => l.status === 'Lost').length;
  const overallConvRate = totalLeads > 0 ? ((totalConverted / totalLeads) * 100).toFixed(1) : '0';

  const associateLeads = useMemo(() => {
    if (!expandedAssociate) return [];
    return leads.filter(l => l.associate === expandedAssociate);
  }, [leads, expandedAssociate]);

  const allAssociateStats = useMemo(() => computeAssociateStats(allLeads), [allLeads]);

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard icon={Users} label="Total Leads" value={totalLeads} />
        <SummaryCard icon={AlertTriangle} label="Needs Action" value={needsAction} />
        <SummaryCard icon={UserCheck} label="Converted" value={totalConverted} />
        <SummaryCard icon={TrendingUp} label="Lost" value={totalLost} />
        <SummaryCard icon={Target} label="Conv. Rate" value={`${overallConvRate}%`} />
      </div>

      {/* Associate Table */}
      <div className="glass-strong rounded-2xl shadow-elevated overflow-hidden">
        <div className="px-5 py-3 border-b border-border/30">
          <h3 className="text-sm font-semibold text-foreground">Associate Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: '900px' }}>
            <thead>
              <tr className="gradient-subtle">
                {['Associate', 'Leads', 'Converted', 'Lost', 'Active', 'Conv. Rate', 'Avg FU', 'Overdue', 'Total LTV', ''].map(h => (
                  <th key={h} className="h-11 px-5 text-left align-middle font-semibold text-muted-foreground border-b border-border/40 text-[10px] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map(s => (
                <>
                  <tr
                    key={s.name}
                    onClick={() => setExpandedAssociate(expandedAssociate === s.name ? null : s.name)}
                    className="group transition-all duration-150 hover:bg-primary/[0.03] cursor-pointer"
                  >
                    <td className="px-5 py-3 text-sm font-medium text-foreground border-b border-border/15 whitespace-nowrap">{s.name}</td>
                    <td className="px-5 py-3 text-sm font-mono text-foreground border-b border-border/15">{s.totalLeads}</td>
                    <td className="px-5 py-3 text-sm font-mono text-accent-converted font-medium border-b border-border/15">{s.converted}</td>
                    <td className="px-5 py-3 text-sm font-mono text-accent-overdue border-b border-border/15">{s.lost}</td>
                    <td className="px-5 py-3 text-sm font-mono text-foreground border-b border-border/15">{s.active}</td>
                    <td className="px-5 py-3 border-b border-border/15">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-20 bg-border/40 rounded-full overflow-hidden">
                          <div className="h-full rounded-full gradient-primary" style={{ width: `${Math.min(s.conversionRate, 100)}%` }} />
                        </div>
                        <span className="text-xs font-mono font-medium text-foreground whitespace-nowrap">{s.conversionRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm font-mono text-muted-foreground border-b border-border/15">{s.avgFollowUps.toFixed(1)}</td>
                    <td className={`px-5 py-3 text-sm font-mono border-b border-border/15 ${s.overdueFollowUps > 0 ? 'text-accent-overdue font-semibold' : 'text-muted-foreground'}`}>
                      {s.overdueFollowUps > 0 && <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-overdue mr-1.5 animate-pulse-overdue" />}
                      {s.overdueFollowUps}
                    </td>
                    <td className="px-5 py-3 text-sm font-mono text-foreground font-medium border-b border-border/15 whitespace-nowrap">₹{s.totalLtv.toLocaleString()}</td>
                    <td className="px-5 py-3 border-b border-border/15">
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedAssociate === s.name ? 'rotate-90' : ''}`} />
                    </td>
                  </tr>

                  {/* Expanded leads for this associate */}
                  {expandedAssociate === s.name && (
                    <tr key={s.name + '-expanded'}>
                      <td colSpan={10} className="p-0 border-b border-border/15">
                        <div className="bg-primary/[0.02] px-5 py-3">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                            {s.name}'s Leads ({associateLeads.length})
                          </p>
                          <div className="overflow-x-auto rounded-xl border border-border/30 bg-background/50">
                            <table className="w-full">
                              <thead>
                                <tr className="gradient-subtle">
                                  {['Name', 'Date', 'Stage', 'Status', 'Source', 'Remarks', 'LTV'].map(h => (
                                    <th key={h} className="h-9 px-4 text-left text-[10px] uppercase tracking-wider font-semibold text-muted-foreground border-b border-border/30 whitespace-nowrap">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {associateLeads.map(lead => (
                                  <tr
                                    key={lead.id}
                                    onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); }}
                                    className="cursor-pointer hover:bg-primary/[0.03] transition-colors"
                                  >
                                    <td className="px-4 py-2.5 border-b border-border/15">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="text-sm font-medium text-foreground whitespace-nowrap cursor-default">{lead.fullName}</span>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="max-w-[300px] p-3 space-y-1.5">
                                          <p className="text-xs font-semibold">{lead.fullName}</p>
                                          <div className="space-y-1 text-[11px] text-muted-foreground">
                                            <p>📱 {lead.phoneNumber || '—'}</p>
                                            <p>📧 {lead.email || '—'}</p>
                                            <p>📍 {lead.sourceName || '—'}</p>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono border-b border-border/15 whitespace-nowrap">{lead.createdAt}</td>
                                    <td className="px-4 py-2.5 border-b border-border/15">
                                      {lead.stageName && lead.stageName !== '-' ? (
                                        <span className="inline-flex items-center h-5 px-2 rounded text-[10px] font-semibold gradient-primary text-primary-foreground whitespace-nowrap">{lead.stageName}</span>
                                      ) : <span className="text-xs text-muted-foreground/40">—</span>}
                                    </td>
                                    <td className="px-4 py-2.5 border-b border-border/15">
                                      <span className="inline-flex items-center h-5 px-2 rounded text-[10px] font-semibold gradient-primary text-primary-foreground whitespace-nowrap">{lead.status}</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-muted-foreground border-b border-border/15 whitespace-nowrap">{lead.sourceName || '—'}</td>
                                    <td className="px-4 py-2.5 border-b border-border/15">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="text-[11px] text-muted-foreground truncate block max-w-[180px] cursor-default">{lead.remarks && lead.remarks !== '-' ? lead.remarks : '—'}</span>
                                        </TooltipTrigger>
                                        {lead.remarks && lead.remarks !== '-' && (
                                          <TooltipContent side="top" className="max-w-[400px] p-3">
                                            <p className="text-xs leading-relaxed">{lead.remarks}</p>
                                          </TooltipContent>
                                        )}
                                      </Tooltip>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs font-mono text-foreground font-medium border-b border-border/15 whitespace-nowrap">
                                      {lead.ltv > 0 ? `₹${lead.ltv.toLocaleString()}` : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drill-down panel */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <div className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-40" onClick={() => setSelectedLead(null)} />
            <LeadDrillDown
              lead={selectedLead}
              associateStats={allAssociateStats.find(a => a.name === selectedLead.associate)}
              onClose={() => setSelectedLead(null)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <div className="glass-strong rounded-2xl shadow-card p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
    </div>
  );
}
