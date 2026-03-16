import type { Lead, AssociateStats } from '@/types/leads';
import { isOverdue } from '@/hooks/useLeadsData';
import { TrendingUp, Users, AlertTriangle, UserCheck, Target } from 'lucide-react';

interface Props {
  leads: Lead[];
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

export function AssociateOverview({ leads }: Props) {
  const stats = computeAssociateStats(leads);
  const totalLeads = leads.length;
  const needsAction = leads.filter(l => l.followUps.some(f => isOverdue(f.date, l.status))).length;
  const totalConverted = leads.filter(l => l.conversionStatus === 'Converted').length;
  const totalLost = leads.filter(l => l.status === 'Lost').length;
  const overallConvRate = totalLeads > 0 ? ((totalConverted / totalLeads) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard icon={Users} label="Total Leads" value={totalLeads} />
        <SummaryCard icon={AlertTriangle} label="Needs Action" value={needsAction} variant="warning" />
        <SummaryCard icon={UserCheck} label="Converted" value={totalConverted} variant="success" />
        <SummaryCard icon={TrendingUp} label="Lost" value={totalLost} variant="destructive" />
        <SummaryCard icon={Target} label="Conv. Rate" value={`${overallConvRate}%`} variant="info" />
      </div>

      {/* Associate Table */}
      <div className="glass-strong rounded-2xl shadow-elevated overflow-hidden">
        <div className="px-5 py-3 border-b border-border/30">
          <h3 className="text-sm font-semibold text-foreground">Associate Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="gradient-subtle">
                {['Associate', 'Leads', 'Converted', 'Lost', 'Active', 'Conv. Rate', 'Avg FU', 'Overdue', 'Total LTV'].map(h => (
                  <th key={h} className="h-11 px-5 text-left align-middle font-semibold text-muted-foreground border-b border-border/40 text-[11px] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map(s => (
                <tr key={s.name} className="group transition-all duration-150 hover:bg-primary/[0.02]">
                  <td className="px-5 py-3.5 text-sm font-medium text-foreground border-b border-border/15">{s.name}</td>
                  <td className="px-5 py-3.5 text-sm font-mono text-foreground border-b border-border/15">{s.totalLeads}</td>
                  <td className="px-5 py-3.5 text-sm font-mono text-accent-converted font-medium border-b border-border/15">{s.converted}</td>
                  <td className="px-5 py-3.5 text-sm font-mono text-accent-overdue border-b border-border/15">{s.lost}</td>
                  <td className="px-5 py-3.5 text-sm font-mono text-foreground border-b border-border/15">{s.active}</td>
                  <td className="px-5 py-3.5 border-b border-border/15">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-20 bg-border/40 rounded-full overflow-hidden">
                        <div className="h-full rounded-full gradient-primary" style={{ width: `${Math.min(s.conversionRate, 100)}%` }} />
                      </div>
                      <span className="text-xs font-mono font-medium text-foreground">{s.conversionRate.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-mono text-muted-foreground border-b border-border/15">{s.avgFollowUps.toFixed(1)}</td>
                  <td className={`px-5 py-3.5 text-sm font-mono border-b border-border/15 ${s.overdueFollowUps > 0 ? 'text-accent-overdue font-semibold' : 'text-muted-foreground'}`}>
                    {s.overdueFollowUps > 0 && <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-overdue mr-1.5 animate-pulse-overdue" />}
                    {s.overdueFollowUps}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-mono text-foreground font-medium border-b border-border/15">₹{s.totalLtv.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, variant }: { icon: any; label: string; value: number | string; variant?: 'success' | 'destructive' | 'warning' | 'info' }) {
  const colorMap = {
    success: { icon: 'text-accent-converted', bg: 'bg-accent-converted/10', value: 'text-accent-converted' },
    destructive: { icon: 'text-accent-overdue', bg: 'bg-accent-overdue/10', value: 'text-accent-overdue' },
    warning: { icon: 'text-accent-warning', bg: 'bg-accent-warning/10', value: 'text-accent-warning' },
    info: { icon: 'text-accent-info', bg: 'bg-accent-info/10', value: 'text-accent-info' },
  };
  const colors = colorMap[variant || 'info'] || { icon: 'text-foreground', bg: 'bg-muted', value: 'text-foreground' };

  return (
    <div className="glass-strong rounded-2xl shadow-card p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`h-8 w-8 rounded-xl ${colors.bg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${colors.icon}`} />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold font-mono ${colors.value}`}>{value}</p>
    </div>
  );
}
