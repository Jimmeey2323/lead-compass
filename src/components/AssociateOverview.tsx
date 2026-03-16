import type { Lead, AssociateStats } from '@/types/leads';
import { isOverdue } from '@/hooks/useLeadsData';
import { TrendingUp, Users, AlertTriangle, UserCheck } from 'lucide-react';

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
    
    const totalFollowUps = aLeads.reduce((sum, l) => {
      return sum + l.followUps.filter(f => f.date && f.date !== '-').length;
    }, 0);
    
    const overdueFollowUps = aLeads.reduce((sum, l) => {
      return sum + l.followUps.filter(f => isOverdue(f.date, l.status)).length;
    }, 0);

    const totalLtv = aLeads.reduce((sum, l) => sum + l.ltv, 0);

    return {
      name,
      totalLeads: aLeads.length,
      converted,
      lost,
      active,
      conversionRate: aLeads.length > 0 ? (converted / aLeads.length) * 100 : 0,
      avgFollowUps: aLeads.length > 0 ? totalFollowUps / aLeads.length : 0,
      overdueFollowUps,
      totalLtv,
    };
  }).sort((a, b) => b.totalLeads - a.totalLeads);
}

export function AssociateOverview({ leads }: Props) {
  const stats = computeAssociateStats(leads);
  const totalLeads = leads.length;
  const needsAction = leads.filter(l => 
    l.followUps.some(f => isOverdue(f.date, l.status))
  ).length;
  const totalConverted = leads.filter(l => l.conversionStatus === 'Converted').length;
  const totalLost = leads.filter(l => l.status === 'Lost').length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={Users} label="Total Leads" value={totalLeads} />
        <SummaryCard icon={AlertTriangle} label="Needs Action" value={needsAction} variant="warning" />
        <SummaryCard icon={UserCheck} label="Converted" value={totalConverted} variant="success" />
        <SummaryCard icon={TrendingUp} label="Lost" value={totalLost} variant="destructive" />
      </div>

      {/* Associate Table */}
      <div className="shadow-card rounded-xl bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              {['Associate', 'Leads', 'Converted', 'Lost', 'Active', 'Conv. Rate', 'Avg FU', 'Overdue', 'Total LTV'].map(h => (
                <th key={h} className="h-10 px-4 text-left align-middle font-medium text-muted-foreground border-b border-border text-header uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map(s => (
              <tr key={s.name} className="group transition-colors hover:bg-surface/50">
                <td className="p-3 text-data font-medium text-foreground border-b border-border/30">{s.name}</td>
                <td className="p-3 text-data font-mono-data border-b border-border/30">{s.totalLeads}</td>
                <td className="p-3 text-data font-mono-data text-accent-converted border-b border-border/30">{s.converted}</td>
                <td className="p-3 text-data font-mono-data text-accent-overdue border-b border-border/30">{s.lost}</td>
                <td className="p-3 text-data font-mono-data border-b border-border/30">{s.active}</td>
                <td className="p-3 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-accent-converted rounded-full" style={{ width: `${Math.min(s.conversionRate, 100)}%` }} />
                    </div>
                    <span className="text-data font-mono-data">{s.conversionRate.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="p-3 text-data font-mono-data border-b border-border/30">{s.avgFollowUps.toFixed(1)}</td>
                <td className={`p-3 text-data font-mono-data border-b border-border/30 ${s.overdueFollowUps > 0 ? 'text-accent-overdue font-semibold' : ''}`}>
                  {s.overdueFollowUps}
                </td>
                <td className="p-3 text-data font-mono-data border-b border-border/30">₹{s.totalLtv.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, variant }: { icon: any; label: string; value: number; variant?: 'success' | 'destructive' | 'warning' }) {
  const colorCls = {
    success: 'text-accent-converted',
    destructive: 'text-accent-overdue',
    warning: 'text-accent-warning',
  }[variant || ''] || 'text-foreground';

  return (
    <div className="shadow-card rounded-xl bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${colorCls}`} />
        <span className="text-header uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-semibold font-mono-data ${colorCls}`}>{value}</p>
    </div>
  );
}
