import { useState } from 'react';
import { useLeadsData } from '@/hooks/useLeadsData';
import { LeadTable } from '@/components/LeadTable';
import { LeadFilters } from '@/components/LeadFilters';
import { AssociateOverview } from '@/components/AssociateOverview';
import { defaultFilters } from '@/types/leads';
import type { FilterState, ViewMode } from '@/types/leads';
import { RefreshCw, LayoutList, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { data: leads = [], isLoading, error, refetch, isFetching } = useLeadsData();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [view, setView] = useState<ViewMode>('table');

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-heading text-lg">Lead Pipeline</h1>
            {leads.length > 0 && (
              <span className="text-data text-muted-foreground">
                {leads.length} total
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-surface rounded-lg p-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView('table')}
                className={`h-7 px-2.5 rounded-md text-data gap-1 ${view === 'table' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
              >
                <LayoutList className="h-3.5 w-3.5" /> Table
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView('associate')}
                className={`h-7 px-2.5 rounded-md text-data gap-1 ${view === 'associate' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
              >
                <Users className="h-3.5 w-3.5" /> Associates
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 gap-1.5 text-data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-4 space-y-4">
        {/* Error */}
        {error && (
          <div className="shadow-card rounded-xl bg-accent-overdue/5 border border-accent-overdue/20 p-4">
            <p className="text-data text-accent-overdue">
              {error instanceof Error ? error.message : 'Connection to Google Sheets interrupted. Retrying...'}
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-data text-muted-foreground">Loading leads from Google Sheets...</span>
          </div>
        )}

        {/* Content */}
        {!isLoading && leads.length > 0 && (
          <>
            {view === 'table' && (
              <>
                <LeadFilters filters={filters} onChange={setFilters} leads={leads} />
                <LeadTable leads={leads} filters={filters} />
              </>
            )}
            {view === 'associate' && <AssociateOverview leads={leads} />}
          </>
        )}

        {!isLoading && !error && leads.length === 0 && (
          <div className="flex items-center justify-center py-24">
            <p className="text-data text-muted-foreground">No leads found. Check your Google Sheets connection.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
