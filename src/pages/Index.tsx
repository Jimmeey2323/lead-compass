import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLeadsData } from '@/hooks/useLeadsData';
import { LeadTable } from '@/components/LeadTable';
import { LeadFilters } from '@/components/LeadFilters';
import { AssociateOverview } from '@/components/AssociateOverview';
import { LeadBoard } from '@/components/LeadBoard';
import { LeadComparison } from '@/components/LeadComparison';
import { defaultFilters, parseDateStr, getDateRange } from '@/types/leads';
import type { FilterState, ViewMode, Lead } from '@/types/leads';
import { RefreshCw, LayoutList, Users, Loader2, Zap, Rows3, GitCompareArrows, Building2, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildLeadOptions, cleanLooseText, getCurrentWeekRangeLabel } from '@/lib/lead-utils';

const DEFAULT_CENTER_TOKENS = ['kwality house', 'kemps corner'];

function findDefaultCenterOption(centers: string[]): string | null {
  if (!centers.length) return null;

  return centers.find((center) => {
    const normalized = cleanLooseText(center).toLowerCase();
    return DEFAULT_CENTER_TOKENS.every((token) => normalized.includes(token));
  }) ?? null;
}

function applyFilters(leads: Lead[], filters: FilterState): Lead[] {
  const dateRange = getDateRange(filters.datePreset, filters.customDateFrom, filters.customDateTo);

  return leads.filter(l => {
    if (filters.associate !== 'all' && l.associate !== filters.associate) return false;
    if (filters.status.length > 0 && !filters.status.includes(l.status)) return false;
    if (filters.stageName.length > 0 && !filters.stageName.includes(l.stageName)) return false;
    if (filters.center !== 'all' && cleanLooseText(l.center).toLowerCase() !== cleanLooseText(filters.center).toLowerCase()) return false;
    if (filters.sourceName.length > 0 && !filters.sourceName.includes(l.sourceName)) return false;
    if (filters.channel.length > 0 && !filters.channel.includes(l.channel)) return false;
    if (filters.conversionStatus.length > 0 && !filters.conversionStatus.includes(l.conversionStatus)) return false;
    if (filters.trialStatus.length > 0 && !filters.trialStatus.includes(l.trialStatus)) return false;

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
  const hasAppliedInitialCenterRef = useRef(false);

  const filteredLeads = useMemo(() => applyFilters(leads, filters), [leads, filters]);
  const options = useMemo(() => buildLeadOptions(leads), [leads]);
  const weekRangeLabel = useMemo(() => getCurrentWeekRangeLabel(), []);
  const isTableWorkspace = view === 'table' || view === 'compact';

  useEffect(() => {
    if (hasAppliedInitialCenterRef.current || options.centers.length === 0) return;

    hasAppliedInitialCenterRef.current = true;
    const matchedCenter = findDefaultCenterOption(options.centers);
    if (!matchedCenter) return;

    setFilters((current) => ({
      ...current,
      center: matchedCenter,
    }));
  }, [options.centers]);

  const views: Array<{ key: ViewMode; label: string; icon: typeof LayoutList }> = [
    { key: 'table', label: 'Detailed', icon: LayoutList },
    { key: 'compact', label: 'Compact', icon: Rows3 },
    { key: 'stage-board', label: 'Stage Board', icon: Workflow },
    { key: 'center-board', label: 'Center Board', icon: Building2 },
    { key: 'associate', label: 'Associates', icon: Users },
    { key: 'comparison', label: 'Comparison', icon: GitCompareArrows },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative gradient orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[300px] -right-[200px] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[200px] -left-[200px] w-[500px] h-[500px] rounded-full bg-accent-purple/5 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-30 glass-strong border-b border-border/30">
        <div className={`${isTableWorkspace ? 'w-full px-4 md:px-6' : 'mx-auto max-w-[1680px] px-4 md:px-6'} flex h-16 items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-sm">
                <Zap className="h-4.5 w-4.5 text-primary-foreground" />
              </div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="text-base font-bold tracking-tight text-foreground"
                >
                  <motion.span
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    className="bg-[linear-gradient(90deg,rgba(14,165,233,1),rgba(99,102,241,1),rgba(236,72,153,1),rgba(14,165,233,1))] bg-[length:200%_100%] bg-clip-text text-transparent"
                  >
                    Lead Management - 2026
                  </motion.span>
                </motion.h1>
                {leads.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    {filteredLeads.length} of {leads.length} leads • Week {weekRangeLabel}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex glass-panel rounded-xl p-1 shadow-sm">
                {views.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setView(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      view === key
                        ? 'bg-blue-900 text-white shadow-sm ring-1 ring-blue-700/60'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
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

      {isTableWorkspace && (
        <div className="pointer-events-none fixed inset-x-0 top-[4.3rem] z-40 flex justify-end px-4 md:px-6">
          <div className="pointer-events-auto mt-2 flex items-center gap-2 rounded-2xl border border-border/40 bg-background/76 p-2 shadow-elevated backdrop-blur-xl">
            <span className="rounded-xl bg-primary/8 px-3 py-1.5 text-[11px] font-medium text-foreground">
              {filters.datePreset === 'lastWeek' ? 'Last week' : filters.datePreset === 'thisWeek' ? 'This week' : 'Custom view'}
            </span>
            <span className="hidden rounded-xl bg-background/80 px-3 py-1.5 text-[11px] text-muted-foreground md:inline-flex">
              {filters.center === 'all' ? 'All centers' : filters.center}
            </span>
          </div>
        </div>
      )}

      <main className={`relative z-10 ${isTableWorkspace ? 'h-[calc(100vh-4rem)] w-full overflow-hidden px-0 py-0' : 'mx-auto max-w-[1680px] space-y-5 px-4 py-5 md:px-6'}`}>
        {error && (
          <div className="glass-strong rounded-2xl border border-accent-overdue/20 p-4 shadow-sm">
            <p className="text-sm text-accent-overdue">
              {error instanceof Error ? error.message : 'Connection to Google Sheets interrupted. Retrying...'}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-primary/15" />
              <div className="absolute inset-[5px] animate-spin rounded-full border-2 border-transparent border-t-primary border-r-primary/70" />
              <div className="absolute inset-[14px] rounded-full border border-primary/10" />
              <Loader2 className="h-4.5 w-4.5 animate-spin text-primary/80" />
            </div>
            <p className="text-sm font-medium text-foreground/90">Loading leads from Google Sheets...</p>
            <p className="mt-1 text-xs text-muted-foreground">Warming up the dashboard—just a brisk little spin.</p>
          </div>
        )}

        {!isLoading && leads.length > 0 && (
          <>
            {!isTableWorkspace && <LeadFilters filters={filters} onChange={setFilters} leads={leads} />}
            {view === 'table' && <LeadTable leads={filteredLeads} allLeads={leads} options={options} filters={filters} onFiltersChange={setFilters} density="comfortable" />}
            {view === 'compact' && <LeadTable leads={filteredLeads} allLeads={leads} options={options} filters={filters} onFiltersChange={setFilters} density="compact" />}
            {view === 'stage-board' && <LeadBoard leads={filteredLeads} allLeads={leads} options={options} groupBy="stageName" title="Stage board" />}
            {view === 'center-board' && <LeadBoard leads={filteredLeads} allLeads={leads} options={options} groupBy="center" title="Center board" />}
            {view === 'associate' && <AssociateOverview leads={filteredLeads} allLeads={leads} options={options} />}
            {view === 'comparison' && <LeadComparison leads={filteredLeads} />}
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
