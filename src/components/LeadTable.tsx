import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsDownUp, ChevronsUpDown, ChevronDown, ChevronRight as ChevronRightIcon, Layers3, PanelLeftClose, PanelLeftOpen, Search, RotateCcw, SlidersHorizontal, Sparkles, CalendarRange, Pin, PinOff, Eye, EyeOff } from 'lucide-react';
import type { DatePreset, FilterState, GroupableLeadKey, Lead, LeadOptionSets } from '@/types/leads';
import { parseDateStr } from '@/types/leads';
import { FollowUpTimeline } from './FollowUpTimeline';
import { LeadDrillDown } from './LeadDrillDown';
import { computeAssociateStats } from './AssociateOverview';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import {
  buildCountSummary,
  cleanLooseText,
  GROUPABLE_COLUMNS,
  flattenGroupedLeads,
  getElapsedDaysLabel,
  getCurrentWeekRangeLabel,
  type LeadRenderDataRow,
} from '@/lib/lead-utils';
import { LeadHoverInfo } from './LeadDisplay';
import { Button } from '@/components/ui/button';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { Input } from '@/components/ui/input';
import { defaultFilters } from '@/types/leads';

interface Props {
  leads: Lead[];
  allLeads: Lead[];
  options: LeadOptionSets;
  filters?: FilterState;
  onFiltersChange?: (filters: FilterState) => void;
  density?: 'comfortable' | 'compact';
}

type SortKey = 'fullName' | 'createdAt' | 'associate' | 'status' | 'stageName' | 'sourceName' | 'remarks';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [100, 200, 500];

const DATE_PRESET_OPTIONS: Array<{ value: DatePreset; label: string }> = [
  { value: 'all', label: 'All time' },
  { value: '7days', label: 'Last 7 days' },
  { value: 'lastWeek', label: 'Last week' },
  { value: 'thisWeek', label: 'This week' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'thisQuarter', label: 'This quarter' },
  { value: 'lastQuarter', label: 'Last quarter' },
  { value: 'thisYear', label: 'This year' },
  { value: 'lastYear', label: 'Last year' },
  { value: 'custom', label: 'Custom period' },
];

const TABLE_COLUMNS: Array<{ key: string; label: string; width: number; sortKey?: SortKey }> = [
  { key: 'rowNumber', label: '#', width: 72 },
  { key: 'fullName', label: 'Lead', width: 250, sortKey: 'fullName' },
  { key: 'createdAt', label: 'Date', width: 140, sortKey: 'createdAt' },
  { key: 'associate', label: 'Associate', width: 150, sortKey: 'associate' },
  { key: 'sourceName', label: 'Source', width: 160, sortKey: 'sourceName' },
  { key: 'stageName', label: 'Stage', width: 190, sortKey: 'stageName' },
  { key: 'remarks', label: 'Remarks', width: 340 },
  { key: 'followUps', label: 'Follow-ups', width: 200 },
  { key: 'center', label: 'Center', width: 220 },
  { key: 'type', label: 'Type', width: 140 },
  { key: 'ltv', label: 'LTV', width: 120 },
];

const QUICK_PERIOD_OPTIONS: Array<{ label: string; value: DatePreset }> = [
  { label: 'All time', value: 'all' },
  { label: 'This week', value: 'thisWeek' },
  { label: 'Last week', value: 'lastWeek' },
  { label: 'This month', value: 'thisMonth' },
  { label: 'Last month', value: 'lastMonth' },
  { label: 'This quarter', value: 'thisQuarter' },
  { label: 'Last quarter', value: 'lastQuarter' },
  { label: 'This year', value: 'thisYear' },
  { label: 'Last year', value: 'lastYear' },
  { label: 'Custom period', value: 'custom' },
];

export function LeadTable({ leads, allLeads, options, filters, onFiltersChange, density = 'comfortable' }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [groupKeys, setGroupKeys] = useState<GroupableLeadKey[]>([]);
  const [groupToAdd, setGroupToAdd] = useState<GroupableLeadKey | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<string[]>([]);
  const [isStageSummaryCollapsed, setIsStageSummaryCollapsed] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isQuickFiltersVisible, setIsQuickFiltersVisible] = useState(true);
  const [isQuickFiltersPinned, setIsQuickFiltersPinned] = useState(true);
  const [isSidebarInteracting, setIsSidebarInteracting] = useState(false);
  const [columnWidths, setColumnWidths] = useState<number[]>(() => TABLE_COLUMNS.map((column) => column.width));
  const resizeStateRef = useRef<{ index: number; startX: number; startWidth: number } | null>(null);
  const sidebarRef = useRef<HTMLElement | null>(null);

  const sorted = useMemo(() => {
    const result = [...leads];
    result.sort((a, b) => {
      const valA = getSortValue(a, sortKey);
      const valB = getSortValue(b, sortKey);
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [leads, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const associateStats = useMemo(() => computeAssociateStats(allLeads), [allLeads]);
  const weekRangeLabel = useMemo(() => getCurrentWeekRangeLabel(), []);
  const renderedRows = useMemo(() => flattenGroupedLeads(sorted, groupKeys), [groupKeys, sorted]);
  const groupRows = useMemo(() => renderedRows.filter((row) => row.type === 'group'), [renderedRows]);
  const visibleRows = useMemo(() => {
    let visibleLeadCounter = 0;

    return renderedRows
      .filter((row) => !row.parentGroupIds.some((id) => collapsedGroupIds.includes(id)))
      .map((row) => {
        if (row.type === 'group') return row;
        visibleLeadCounter += 1;
        return { ...row, rowNumber: visibleLeadCounter };
      });
  }, [collapsedGroupIds, renderedRows]);
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const pagedRows = useMemo(() => visibleRows.slice((page - 1) * pageSize, page * pageSize), [page, pageSize, visibleRows]);
  const displayedLeads = useMemo(
    () => pagedRows.filter((row): row is LeadRenderDataRow => row.type === 'lead').map((row) => row.lead),
    [pagedRows],
  );
  const displayedStageSummary = useMemo(() => buildCountSummary(displayedLeads, 'stageName'), [displayedLeads]);
  const displayedSourceSummary = useMemo(() => buildCountSummary(displayedLeads, 'sourceName'), [displayedLeads]);
  const activeFilterCount = useMemo(() => {
    if (!filters) return 0;

    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'search') return Boolean(value);
      if (key === 'datePreset') return value !== 'all';
      if (Array.isArray(value)) return value.length > 0;
      return value !== 'all';
    }).length;
  }, [filters]);
  const quickCenters = useMemo(() => options.centers, [options.centers]);
  const centerScopedAssociates = useMemo(() => {
    if (!filters || filters.center === 'all') {
      return options.associates;
    }

    return Array.from(
      new Set(
        allLeads
          .filter((lead) => cleanLooseText(lead.center) === cleanLooseText(filters.center))
          .map((lead) => lead.associate)
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [allLeads, filters, options.associates]);
  const quickAssociates = useMemo(() => centerScopedAssociates, [centerScopedAssociates]);

  useEffect(() => {
    setPage(1);
  }, [leads, groupKeys, pageSize, sortKey, sortDir]);

  useEffect(() => {
    setCollapsedGroupIds([]);
  }, [groupKeys]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (!filters || !onFiltersChange) return;
    if (filters.center === 'all' || filters.associate === 'all') return;
    if (centerScopedAssociates.includes(filters.associate)) return;

    onFiltersChange({ ...filters, associate: 'all' });
  }, [centerScopedAssociates, filters, onFiltersChange]);

  useEffect(() => {
    if (isSidebarCollapsed || isSidebarPinned || isSidebarInteracting) return;

    const timer = window.setTimeout(() => {
      setIsSidebarCollapsed(true);
    }, 9000);

    return () => window.clearTimeout(timer);
  }, [isSidebarCollapsed, isSidebarInteracting, isSidebarPinned]);

  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState) return;

      const delta = event.clientX - resizeState.startX;
      setColumnWidths((current) => {
        const next = [...current];
        next[resizeState.index] = Math.max(72, resizeState.startWidth + delta);
        return next;
      });
    };

    const stopResize = () => {
      resizeStateRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', stopResize);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', stopResize);
    };
  }, []);

  const addGroup = () => {
    if (!groupToAdd || groupKeys.includes(groupToAdd)) return;
    setGroupKeys((current) => [...current, groupToAdd]);
    setGroupToAdd('');
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroupIds((current) => current.includes(groupId)
      ? current.filter((id) => id !== groupId)
      : [...current, groupId]);
  };

  const collapseAllGroups = () => setCollapsedGroupIds(groupRows.map((row) => row.id));
  const expandAllGroups = () => setCollapsedGroupIds([]);

  const startColumnResize = (index: number, event: React.MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
    resizeStateRef.current = {
      index,
      startX: event.clientX,
      startWidth: columnWidths[index],
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const availableGroupColumns = GROUPABLE_COLUMNS.filter(({ key }) => !groupKeys.includes(key));
  const rowHeightClass = 'h-10 max-h-10';
  const summaryRowsToShow = isStageSummaryCollapsed ? 5 : Math.max(displayedStageSummary.length, displayedSourceSummary.length);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 text-primary" />
      : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  return (
    <>
      <div className="glass-strong flex h-full w-full min-h-0 overflow-hidden shadow-elevated">
        <aside
          ref={sidebarRef}
          onMouseEnter={() => setIsSidebarInteracting(true)}
          onMouseLeave={() => setIsSidebarInteracting(false)}
          onFocusCapture={() => setIsSidebarInteracting(true)}
          onBlurCapture={(event) => {
            if (!sidebarRef.current?.contains(event.relatedTarget as Node | null)) {
              setIsSidebarInteracting(false);
            }
          }}
          className={`flex min-h-0 shrink-0 flex-col overflow-hidden border-r border-border/40 bg-slate-950/[0.96] text-slate-100 transition-[width] duration-300 ${isSidebarCollapsed ? 'w-[78px]' : 'w-[360px]'}`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            {!isSidebarCollapsed ? (
              <div>
                <p className="text-sm font-semibold text-white">Insights & filters</p>
                <p className="mt-1 text-[11px] text-slate-400">Counts, search, filters, and grouping in one premium rail.</p>
              </div>
            ) : (
              <div className="mx-auto rounded-2xl bg-white/5 p-2">
                <Sparkles className="h-4 w-4 text-sky-300" />
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarCollapsed((current) => !current)}
              className="h-9 w-9 rounded-xl p-0 text-slate-200 hover:bg-white/10 hover:text-white"
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
            {!isSidebarCollapsed && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarPinned((current) => !current)}
                className="h-9 w-9 rounded-xl p-0 text-slate-200 hover:bg-white/10 hover:text-white"
              >
                {isSidebarPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {isSidebarCollapsed ? (
            <div className="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-hidden px-2 py-3">
              <div className="flex w-full min-w-0 flex-col items-center rounded-xl border border-white/10 bg-white/5 px-1.5 py-2 text-center shadow-sm">
                <p className="max-w-full truncate text-[9px] uppercase tracking-[0.22em] text-slate-500">Rows</p>
                <p className="mt-1 max-w-full truncate font-mono-data text-sm font-semibold text-white">{sorted.length}</p>
              </div>
              <div className="flex w-full min-w-0 flex-col items-center rounded-xl border border-white/10 bg-white/5 px-1.5 py-2 text-center shadow-sm">
                <p className="max-w-full truncate text-[9px] uppercase tracking-[0.22em] text-slate-500">Page</p>
                <p className="mt-1 max-w-full truncate font-mono-data text-sm font-semibold text-white">{page}/{totalPages}</p>
              </div>
              <div className="mt-auto flex h-20 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.03] px-1 text-[8px] font-semibold uppercase tracking-[0.24em] text-slate-600 [writing-mode:vertical-rl] rotate-180">
                Rail
              </div>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-4">
                {filters && onFiltersChange && (
                  <section className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-sky-300" />
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Filters</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2.5 py-1 text-[10px] font-mono-data text-white">
                          {activeFilterCount} active
                        </span>
                        {activeFilterCount > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onFiltersChange(defaultFilters)}
                            className="h-8 rounded-xl px-2 text-[11px] text-slate-200 hover:bg-white/10 hover:text-white"
                          >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Search</label>
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          <Input
                            value={filters.search}
                            onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
                            placeholder="Name, phone, email, ID"
                            className="h-10 rounded-xl border-white/10 bg-slate-900/80 pl-10 text-sm text-slate-100 placeholder:text-slate-500"
                          />
                        </div>
                      </div>

                      <SidebarSelect
                        label="Period"
                        value={filters.datePreset}
                        onChange={(value) => onFiltersChange({ ...filters, datePreset: value as DatePreset })}
                        options={DATE_PRESET_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
                      />
                      {filters.datePreset === 'custom' && (
                        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-3">
                          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            <CalendarRange className="h-3.5 w-3.5 text-sky-300" /> Custom range
                          </div>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <FormDateInput
                              label="From"
                              value={filters.customDateFrom}
                              onChange={(value) => onFiltersChange({ ...filters, customDateFrom: value })}
                            />
                            <FormDateInput
                              label="To"
                              value={filters.customDateTo}
                              onChange={(value) => onFiltersChange({ ...filters, customDateTo: value })}
                            />
                          </div>
                        </div>
                      )}
                      <SidebarSelect
                        label="Associate"
                        value={filters.associate}
                        onChange={(value) => onFiltersChange({ ...filters, associate: value })}
                        options={[{ label: 'All associates', value: 'all' }, ...centerScopedAssociates.map((associate) => ({ label: associate, value: associate }))]}
                      />
                      <SidebarSelect
                        label="Center"
                        value={filters.center}
                        onChange={(value) => onFiltersChange({ ...filters, center: value })}
                        options={[{ label: 'All centers', value: 'all' }, ...options.centers.map((center) => ({ label: center, value: center }))]}
                      />
                      <SidebarMultiSelect label="Stage" options={options.stageNames} selected={filters.stageName} onChange={(stageName) => onFiltersChange({ ...filters, stageName })} />
                      <SidebarMultiSelect label="Source" options={options.sourceNames} selected={filters.sourceName} onChange={(sourceName) => onFiltersChange({ ...filters, sourceName })} />
                      <SidebarMultiSelect label="Status" options={options.statuses} selected={filters.status} onChange={(status) => onFiltersChange({ ...filters, status })} />
                      <SidebarMultiSelect label="Channel" options={options.channels} selected={filters.channel} onChange={(channel) => onFiltersChange({ ...filters, channel })} />
                      <SidebarMultiSelect label="Conversion" options={options.conversionStatuses} selected={filters.conversionStatus} onChange={(conversionStatus) => onFiltersChange({ ...filters, conversionStatus })} />
                      <SidebarMultiSelect label="Trial status" options={options.trialStatuses} selected={filters.trialStatus} onChange={(trialStatus) => onFiltersChange({ ...filters, trialStatus })} />
                    </div>
                  </section>
                )}

                <section className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Layers3 className="h-4 w-4 text-sky-300" />
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Grouping</p>
                    </div>
                    <select
                      value={pageSize}
                      onChange={(event) => setPageSize(Number(event.target.value))}
                      className="h-7 rounded-lg border border-white/10 bg-slate-900/80 px-2 text-[10px] font-medium text-slate-100"
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>{size}/page</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <SidebarSelect
                      label="Add grouping"
                      value={groupToAdd}
                      onChange={(value) => setGroupToAdd(value as GroupableLeadKey | '')}
                      options={[{ label: 'Select grouping', value: '' }, ...availableGroupColumns.map((column) => ({ label: column.label, value: column.key }))]}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" onClick={addGroup} disabled={!groupToAdd} className="rounded-xl bg-sky-500 text-slate-950 hover:bg-sky-400">Add</Button>
                      {groupKeys.length > 0 && (
                        <Button type="button" variant="outline" onClick={() => setGroupKeys([])} className="rounded-xl border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">Clear</Button>
                      )}
                      {groupRows.length > 0 && (
                        <>
                          <Button type="button" variant="outline" onClick={expandAllGroups} className="rounded-xl border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
                            <ChevronsDownUp className="mr-1.5 h-4 w-4" /> Expand
                          </Button>
                          <Button type="button" variant="outline" onClick={collapseAllGroups} className="rounded-xl border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
                            <ChevronsUpDown className="mr-1.5 h-4 w-4" /> Collapse
                          </Button>
                        </>
                      )}
                    </div>
                    {groupKeys.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {groupKeys.map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setGroupKeys((current) => current.filter((item) => item !== key))}
                            className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[11px] font-medium text-sky-200"
                          >
                            {GROUPABLE_COLUMNS.find((column) => column.key === key)?.label} ×
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Counts</p>
                      <p className="mt-1 text-[11px] text-slate-400">For visible rows on the current page.</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-xl px-2 text-[11px] text-slate-200 hover:bg-white/10 hover:text-white"
                      onClick={() => setIsStageSummaryCollapsed((current) => !current)}
                    >
                      {isStageSummaryCollapsed ? 'More' : 'Less'}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <SummaryCountTable title="Stages" rows={displayedStageSummary} rowLimit={summaryRowsToShow} dark />
                    <SummaryCountTable title="Sources" rows={displayedSourceSummary} rowLimit={summaryRowsToShow} dark />
                  </div>
                </section>
              </div>
            </div>
          )}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-background/35">
          <div className="border-b border-border/30 px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSidebarCollapsed((current) => !current)}
                  className="rounded-xl"
                >
                  {isSidebarCollapsed ? <PanelLeftOpen className="mr-1.5 h-4 w-4" /> : <PanelLeftClose className="mr-1.5 h-4 w-4" />} Sidebar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSidebarPinned((current) => !current)}
                  className="rounded-xl"
                >
                  {isSidebarPinned ? <Pin className="mr-1.5 h-4 w-4" /> : <PinOff className="mr-1.5 h-4 w-4" />}
                  {isSidebarPinned ? 'Pinned' : 'Auto-collapse'}
                </Button>
                <div>
                  <p className="text-sm font-semibold text-foreground">Lead workspace</p>
                  <p className="text-[10px] text-muted-foreground">{sorted.length} filtered leads • {visibleRows.length} visible rows • Week {weekRangeLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="rounded-full border border-border/40 bg-background/80 px-2.5 py-1 font-mono-data font-medium text-foreground">Pg {page}/{totalPages}</span>
                <span className="rounded-full border border-border/40 bg-background/80 px-2.5 py-1 font-mono-data font-medium text-foreground">Rows {pagedRows.length}</span>
                <span className="rounded-full border border-border/50 bg-background/80 px-2.5 py-1 font-medium text-foreground">
                  {density === 'compact' ? 'Compact mode' : 'Detailed mode'}
                </span>
              </div>
            </div>

            {filters && onFiltersChange && (
              <div className={`mt-4 rounded-2xl border border-border/40 bg-background/70 px-3 py-3 shadow-sm ${isQuickFiltersPinned ? 'sticky top-3 z-20 backdrop-blur' : ''}`}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground">Quick filters</p>
                    <p className="text-[10px] text-muted-foreground">Fast period, center, and associate switches.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setIsQuickFiltersPinned((current) => !current)}>
                      {isQuickFiltersPinned ? <Pin className="mr-1.5 h-4 w-4" /> : <PinOff className="mr-1.5 h-4 w-4" />}
                      {isQuickFiltersPinned ? 'Pinned' : 'Pin'}
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setIsQuickFiltersVisible((current) => !current)}>
                      {isQuickFiltersVisible ? <EyeOff className="mr-1.5 h-4 w-4" /> : <Eye className="mr-1.5 h-4 w-4" />}
                      {isQuickFiltersVisible ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </div>

                {isQuickFiltersVisible && (
                  <div className="space-y-2.5">
                    <QuickFilterRow
                      label="Period"
                      options={QUICK_PERIOD_OPTIONS}
                      activeValue={filters.datePreset}
                      onSelect={(value) => onFiltersChange({ ...filters, datePreset: value as DatePreset })}
                      activeClassName="border-blue-700 bg-blue-900 text-white shadow-sm"
                    />
                    {filters.datePreset === 'custom' && (
                      <div className="grid gap-2 md:grid-cols-2">
                        <FormDateInput
                          label="From"
                          value={filters.customDateFrom}
                          onChange={(value) => onFiltersChange({ ...filters, customDateFrom: value })}
                        />
                        <FormDateInput
                          label="To"
                          value={filters.customDateTo}
                          onChange={(value) => onFiltersChange({ ...filters, customDateTo: value })}
                        />
                      </div>
                    )}
                    <QuickFilterRow
                      label="Center"
                      options={[{ label: 'All centers', value: 'all' }, ...quickCenters.map((item) => ({ label: item, value: item }))]}
                      activeValue={filters.center}
                      onSelect={(value) => onFiltersChange({ ...filters, center: value, associate: 'all' })}
                      activeClassName="border-blue-700 bg-blue-900 text-white shadow-sm"
                    />
                    <QuickFilterRow
                      label="Associate"
                      options={[{ label: 'All associates', value: 'all' }, ...quickAssociates.map((item) => ({ label: item, value: item }))]}
                      activeValue={filters.associate}
                      onSelect={(value) => onFiltersChange({ ...filters, associate: value })}
                      activeClassName="border-blue-700 bg-blue-900 text-white shadow-sm"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-separate border-spacing-0" style={{ minWidth: `${columnWidths.reduce((sum, width) => sum + width, 0)}px` }}>
            <colgroup>
              {columnWidths.map((width, index) => (
                <col key={TABLE_COLUMNS[index].key} style={{ width: `${width}px` }} />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-10 lead-table-head">
              <tr className="lead-table-header">
                {TABLE_COLUMNS.map((column, index) => (
                  <th
                    key={column.key}
                    onClick={column.sortKey ? () => toggleSort(column.sortKey!) : undefined}
                    style={{ width: `${columnWidths[index]}px`, minWidth: `${columnWidths[index]}px` }}
                    className={`group/column relative h-10 px-4 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground whitespace-nowrap ${column.sortKey ? 'cursor-pointer select-none transition-colors' : ''}`}
                  >
                    <span className="inline-flex items-center gap-1 pr-4">
                      {column.label} {column.sortKey ? <SortIcon col={column.sortKey} /> : null}
                    </span>
                    {index < TABLE_COLUMNS.length && (
                      <span
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={`Resize ${column.label} column`}
                        onMouseDown={(event) => startColumnResize(index, event)}
                        className="absolute right-0 top-1/2 h-6 w-2 -translate-y-1/2 cursor-col-resize rounded-full bg-transparent transition-colors before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:-translate-x-1/2 before:bg-white/18 hover:bg-white/8 hover:before:bg-sky-300"
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row) => {
                if (row.type === 'group') {
                  const collapsed = collapsedGroupIds.includes(row.id);
                  return (
                    <tr key={row.id} className="h-10 cursor-pointer bg-slate-950/[0.95] text-slate-50 hover:bg-slate-900">
                      <td className="border-b border-slate-800 px-4 py-2 align-middle text-xs font-mono text-slate-300 whitespace-nowrap">{row.groupNumber}</td>
                      <td colSpan={10} className="border-b border-slate-800 px-4 py-2 align-middle" onClick={() => toggleGroup(row.id)}>
                        <div className="flex items-center justify-between" style={{ paddingLeft: `${row.depth * 18}px` }}>
                          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200/90">
                            {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            {GROUPABLE_COLUMNS.find((column) => column.key === row.groupKey)?.label}: {row.label}
                          </span>
                          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-slate-100">{row.count}</span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <LeadDataRow
                    key={row.id}
                    row={row}
                    density={density}
                    rowHeightClass={rowHeightClass}
                    onSelect={setSelectedLead}
                  />
                );
              })}
            </tbody>
          </table>
          </div>

          <div className="flex items-center justify-between border-t border-border/30 px-5 py-2.5">
          <p className="text-[11px] text-muted-foreground">Showing <span className="font-mono-data font-semibold text-foreground">{pagedRows.length}</span> rows on this page.</p>
          <div className="flex items-center gap-1.5">
            <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg px-2.5 text-[11px]" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <div className="rounded-lg border border-border/40 bg-background/80 px-2.5 py-1.5 text-[11px] font-mono-data text-muted-foreground">
              {page}/{totalPages}
            </div>
            <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg px-2.5 text-[11px]" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
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
            <div className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-[88]" onClick={() => setSelectedLead(null)} />
            <LeadDrillDown
              lead={selectedLead}
              allLeads={allLeads}
              options={options}
              associateStats={associateStats.find(a => a.name === selectedLead.associate)}
              onClose={() => setSelectedLead(null)}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function getSortValue(lead: Lead, key: SortKey): string | number {
  if (key === 'createdAt') {
    return parseDateStr(String(lead[key]))?.getTime() || 0;
  }

  return String(lead[key] || '').toLowerCase();
}

function LeadDataRow({
  row,
  density,
  rowHeightClass,
  onSelect,
}: {
  row: LeadRenderDataRow;
  density: 'comfortable' | 'compact';
  rowHeightClass: string;
  onSelect: (lead: Lead) => void;
}) {
  const { lead } = row;
  const emptyRemarks = !lead.remarks || lead.remarks === '-';
  const dateLabel = getElapsedDaysLabel(lead.createdAt);
  const centerPreview = cleanLooseText(lead.center) || '—';
  const typePreview = cleanLooseText(lead.classType) || '—';
  const sourcePreview = cleanLooseText(lead.sourceName) || '—';
  const channelPreview = cleanLooseText(lead.channel) || 'No channel';
  const stagePreview = cleanLooseText(lead.stageName) || '—';
  const statusPreview = cleanLooseText(lead.status) || '—';
  const ltvPreview = lead.ltv > 0 ? `₹${lead.ltv.toLocaleString()}` : '—';

  return (
    <tr
      onClick={() => onSelect(lead)}
      className={`group cursor-pointer border-b border-border/20 bg-white/75 transition-colors duration-150 odd:bg-background/88 even:bg-slate-50/78 hover:bg-slate-100 ${rowHeightClass}`}
    >
      <td className="px-4 py-2 align-middle text-xs font-mono text-muted-foreground whitespace-nowrap">{row.rowNumber}</td>
      <td className="px-4 py-2 align-middle">
        <HoverCard openDelay={2200} closeDelay={180}>
          <HoverCardTrigger asChild>
            <div className="cursor-default" style={{ paddingLeft: `${row.depth * 16}px` }}>
              <div className="truncate text-sm font-semibold leading-tight text-foreground">{lead.fullName}</div>
            </div>
          </HoverCardTrigger>
          <HoverCardContent side="right" align="start" sideOffset={12} collisionPadding={20} className="z-[120] w-[min(980px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-visible rounded-[28px] border border-slate-700/70 bg-slate-950/98 p-0 shadow-[0_32px_90px_-32px_rgba(2,6,23,0.95)]">
            <LeadHoverInfo lead={lead} />
          </HoverCardContent>
        </HoverCard>
      </td>
      <td className="px-4 py-2 align-middle">
        <span className="block truncate text-xs font-mono-data text-foreground whitespace-nowrap">{`${lead.createdAt || '—'} · ${dateLabel}`}</span>
      </td>
      <td className="px-4 py-2 align-middle">
        <span className="block truncate text-xs font-medium text-foreground whitespace-nowrap">{lead.associate || '—'}</span>
      </td>
      <td className="px-4 py-2 align-middle">
        <span className="block truncate text-xs font-semibold text-foreground">{sourcePreview}</span>
      </td>
      <td className="px-4 py-2 align-middle">
        <span className="block truncate text-xs font-semibold text-foreground">{`${stagePreview}${statusPreview ? ` · ${statusPreview}` : ''}`}</span>
      </td>
      <td className="px-4 py-2 align-middle">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`block max-w-[320px] truncate cursor-default text-[11px] leading-none ${emptyRemarks ? 'italic text-muted-foreground/40' : 'text-muted-foreground'}`}>
              {emptyRemarks ? 'No remarks' : lead.remarks}
            </span>
          </TooltipTrigger>
          {!emptyRemarks && (
            <TooltipContent side="top" className="max-w-[420px] p-3">
              <p className="text-xs leading-relaxed text-foreground">{lead.remarks}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </td>
      <td className="px-4 py-2 align-middle">
        <FollowUpTimeline followUps={lead.followUps} status={lead.status} compact />
      </td>
      <td className="px-4 py-2 align-middle">
        <span className="block truncate text-xs text-foreground">{`${centerPreview}${cleanLooseText(lead.trialStatus) ? ` · ${cleanLooseText(lead.trialStatus)}` : ''}`}</span>
      </td>
      <td className="px-4 py-2 align-middle">
        <span className="block truncate text-xs font-medium text-foreground">{`${typePreview} · ${lead.visits} visits`}</span>
      </td>
      <td className="px-4 py-2 align-middle">
        <span className="block truncate text-xs font-semibold text-foreground font-mono-data">{`${ltvPreview} · ${lead.purchasesMade} purchases`}</span>
      </td>
    </tr>
  );
}

function ControlBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="shrink-0 space-y-1">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function SummaryCountTable({
  title,
  rows,
  rowLimit,
  dark = false,
}: {
  title: string;
  rows: Array<{ label: string; count: number; share: number }>;
  rowLimit: number;
  dark?: boolean;
}) {
  const visibleRows = rows.slice(0, rowLimit);

  return (
    <div className={`overflow-hidden rounded-2xl border ${dark ? 'border-white/10 bg-slate-900/70' : 'border-border/30 bg-background/70'}`}>
      <div className={`border-b px-3 py-2 ${dark ? 'border-white/10' : 'border-border/20'}`}>
        <h4 className={`text-[11px] font-semibold uppercase tracking-wider ${dark ? 'text-slate-300' : 'text-muted-foreground'}`}>{title}</h4>
      </div>
      <table className="min-w-full text-sm">
        <thead className={dark ? 'bg-white/5' : 'bg-muted/25'}>
          <tr>
            <th className={`px-3 py-2 text-left text-[10px] uppercase tracking-wider font-semibold ${dark ? 'text-slate-400' : 'text-muted-foreground'}`}>Label</th>
            <th className={`px-3 py-2 text-right text-[10px] uppercase tracking-wider font-semibold ${dark ? 'text-slate-400' : 'text-muted-foreground'}`}>Count</th>
            <th className={`px-3 py-2 text-right text-[10px] uppercase tracking-wider font-semibold ${dark ? 'text-slate-400' : 'text-muted-foreground'}`}>Share</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.length > 0 ? visibleRows.map((row) => (
            <tr key={row.label} className={`border-t ${dark ? 'border-white/10' : 'border-border/20'}`}>
              <td className={`px-3 py-2 text-xs ${dark ? 'text-slate-100' : 'text-foreground'}`}>{row.label}</td>
              <td className={`px-3 py-2 text-right text-xs font-semibold ${dark ? 'text-white' : 'text-foreground'}`}>{row.count}</td>
              <td className={`px-3 py-2 text-right text-xs ${dark ? 'text-slate-400' : 'text-muted-foreground'}`}>{row.share.toFixed(1)}%</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={3} className={`px-3 py-4 text-center text-xs ${dark ? 'text-slate-400' : 'text-muted-foreground'}`}>No rows on this page yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SidebarStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2.5 shadow-sm">
      <p className="truncate text-[9px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-1 truncate font-mono-data text-base font-semibold text-white">{value}</p>
    </div>
  );
}

function QuickFilterRow({
  label,
  options,
  activeValue,
  onSelect,
  activeClassName,
}: {
  label: string;
  options: Array<{ label: string; value: string }>;
  activeValue: string;
  onSelect: (value: string) => void;
  activeClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <span className="min-w-[76px] text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <div className="lead-table-quick-strip flex gap-2 overflow-x-auto pb-1">
        {options.map((option) => {
          const active = option.value === activeValue;
          return (
            <button
              key={`${label}-${option.value}`}
              type="button"
              onClick={() => onSelect(option.value)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${active
                ? (activeClassName ?? 'border-blue-700 bg-blue-900 text-white shadow-sm')
                : 'border-border/50 bg-background/85 text-muted-foreground hover:border-sky-200/60 hover:text-foreground'}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FormDateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1.5">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <Input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-xl border-border/40 bg-background/80 px-3 text-sm text-foreground"
      />
    </label>
  );
}

function SidebarSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-slate-100"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function SidebarMultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</label>
      <MultiSelectDropdown
        label={label}
        options={options}
        selected={selected}
        onChange={onChange}
        allLabel="All"
        buttonClassName="h-10 w-full justify-between rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm font-normal text-slate-100"
      />
    </div>
  );
}
