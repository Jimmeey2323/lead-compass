import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Search, X, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import type { FilterState, Lead } from '@/types/leads';
import { defaultFilters } from '@/types/leads';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  leads: Lead[];
}

function getUnique(leads: Lead[], key: keyof Lead): string[] {
  const values = new Set(leads.map(l => String(l[key])).filter(Boolean));
  return Array.from(values).sort();
}

export function LeadFilters({ filters, onChange, leads }: Props) {
  const [expanded, setExpanded] = useState(false);

  const activeCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'search') return !!v;
    if (k === 'dateRange') return !!(v as any).from || !!(v as any).to;
    return v !== 'all';
  }).length;

  const update = (key: keyof FilterState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const reset = () => onChange(defaultFilters);

  const associates = getUnique(leads, 'associate');
  const statuses = getUnique(leads, 'status');
  const centers = getUnique(leads, 'center');
  const channels = getUnique(leads, 'channel');
  const conversionStatuses = getUnique(leads, 'conversionStatus');
  const trialStatuses = getUnique(leads, 'trialStatus');

  return (
    <div className="shadow-card rounded-xl bg-card">
      {/* Search + Toggle */}
      <div className="flex items-center gap-3 p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone..."
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            className="pl-9 h-9 text-data border-none bg-surface"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="gap-1.5 h-9 text-data"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full bg-primary text-primary-foreground">
              {activeCount}
            </Badge>
          )}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={reset} className="h-9 text-data gap-1 text-accent-overdue">
            <X className="h-3 w-3" /> Clear
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 px-3 pb-3 border-t border-border pt-3">
              <FilterSelect label="Associate" value={filters.associate} options={associates} onChange={(v) => update('associate', v)} />
              <FilterSelect label="Status" value={filters.status} options={statuses} onChange={(v) => update('status', v)} />
              <FilterSelect label="Center" value={filters.center} options={centers} onChange={(v) => update('center', v)} />
              <FilterSelect label="Channel" value={filters.channel} options={channels} onChange={(v) => update('channel', v)} />
              <FilterSelect label="Conversion" value={filters.conversionStatus} options={conversionStatuses} onChange={(v) => update('conversionStatus', v)} />
              <FilterSelect label="Trial Status" value={filters.trialStatus} options={trialStatuses} onChange={(v) => update('trialStatus', v)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-header uppercase tracking-wider font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 rounded-md bg-surface border-none text-data text-foreground px-2 focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="all">All</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
