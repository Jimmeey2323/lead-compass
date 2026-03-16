import { useState, useMemo } from 'react';
import { useLeadsData } from '@/hooks/useLeadsData';
import { LeadTable } from '@/components/LeadTable';
import { LeadFilters } from '@/components/LeadFilters';
import { AssociateOverview } from '@/components/AssociateOverview';
import { defaultFilters, parseDateStr, getDateRange } from '@/types/leads';
import type { FilterState, ViewMode, Lead } from '@/types/leads';
import { RefreshCw, LayoutList, Users, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

const Index = () => {
  const { data: leads = [], isLoading, error, refetch, isFetching } = useLeadsData();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [view, setView] = useState<ViewMode>('table');

  const filteredLeads = useMemo(() => applyFilters(leads, filters), [leads, filters]);

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative gradient orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[300px] -right-[200px] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[200px] -left-[200px] w-[500px] h-[500px] rounded-full bg-accent-purple/5 blur-[120px]" />
      </div>

      {/* Top Bar */}
      <header className="sticky top-0 z-30 glass-strong border-b border-border/30">
        <div className="max-w-[1680px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
              <Zap className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight">Lead Pipeline</h1>
              {leads.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  {filteredLeads.length} of {leads.length} leads
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex glass-panel rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setView('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  view === 'table'
                    ? 'gradient-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutList className="h-3.5 w-3.5" /> Table
              </button>
              <button
                onClick={() => setView('associate')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  view === 'associate'
                    ? 'gradient-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-3.5 w-3.5" /> Associates
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9 gap-1.5 text-xs rounded-xl border-border/50 hover:bg-primary/5 hover:border-primary/30"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1680px] mx-auto px-4 md:px-6 py-5 space-y-5 relative z-10">
        {error && (
          <div className="glass-strong rounded-2xl border border-accent-overdue/20 p-4 shadow-sm">
            <p className="text-sm text-accent-overdue">
              {error instanceof Error ? error.message : 'Connection to Google Sheets interrupted. Retrying...'}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg mb-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Loading leads from Google Sheets...</p>
          </div>
        )}

        {!isLoading && leads.length > 0 && (
          <>
            <LeadFilters filters={filters} onChange={setFilters} leads={leads} />
            {view === 'table' && <LeadTable leads={filteredLeads} />}
            {view === 'associate' && <AssociateOverview leads={filteredLeads} allLeads={leads} />}
          </>
        )}

        {!isLoading && !error && leads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No leads found. Check your Google Sheets connection.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
