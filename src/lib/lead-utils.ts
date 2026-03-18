import type { Lead, GroupableLeadKey, LeadOptionSets } from '@/types/leads';

const DATE_ARTIFACT_RE = /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+[A-Z][a-z]{2}\s+\d{1,2}\s+\d{4}.*$/;

const CENTER_ALIASES: Array<[RegExp, string]> = [
  [/supreme\s*(?:headquarters|hq).*(bandra)/i, 'Supreme Headquarters, Bandra'],
  [/supreme\s*(?:headquarters|hq).*(juhu)/i, 'Supreme Headquarters, Juhu'],
  [/supreme\s*(?:headquarters|hq).*(andheri)/i, 'Supreme Headquarters, Andheri'],
  [/supreme\s*(?:headquarters|hq).*(powai)/i, 'Supreme Headquarters, Powai'],
  [/supreme\s*(?:headquarters|hq).*(thane)/i, 'Supreme Headquarters, Thane'],
];

const GROUPABLE_VALUE_KEYS: GroupableLeadKey[] = [
  'fullName',
  'createdAt',
  'createdWeek',
  'createdMonth',
  'createdQuarter',
  'createdYear',
  'associate',
  'center',
  'sourceName',
  'stageName',
  'status',
  'remarks',
  'channel',
  'conversionStatus',
  'trialStatus',
  'classType',
];

export const GROUPABLE_COLUMNS: Array<{ key: GroupableLeadKey; label: string }> = [
  { key: 'fullName', label: 'Lead' },
  { key: 'createdAt', label: 'Date' },
  { key: 'createdWeek', label: 'Week Bucket' },
  { key: 'createdMonth', label: 'Month Bucket' },
  { key: 'createdQuarter', label: 'Quarter Bucket' },
  { key: 'createdYear', label: 'Year Bucket' },
  { key: 'associate', label: 'Associate' },
  { key: 'center', label: 'Center' },
  { key: 'sourceName', label: 'Source' },
  { key: 'stageName', label: 'Stage' },
  { key: 'status', label: 'Status' },
  { key: 'remarks', label: 'Remarks' },
  { key: 'channel', label: 'Channel' },
  { key: 'conversionStatus', label: 'Conversion' },
  { key: 'trialStatus', label: 'Trial Status' },
  { key: 'classType', label: 'Type' },
];

export interface LeadRenderGroupRow {
  type: 'group';
  id: string;
  depth: number;
  label: string;
  groupKey: GroupableLeadKey;
  count: number;
  groupNumber: string;
  parentGroupIds: string[];
}

export interface LeadRenderDataRow {
  type: 'lead';
  id: string;
  depth: number;
  lead: Lead;
  rowNumber: number;
  parentGroupIds: string[];
}

export type LeadRenderRow = LeadRenderGroupRow | LeadRenderDataRow;

export function cleanLooseText(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(DATE_ARTIFACT_RE, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .trim();
}

function titleCaseWord(word: string): string {
  if (!word) return '';
  if (/^[A-Z0-9]{2,}$/.test(word)) return word;
  const lower = word.toLowerCase();
  return lower.replace(/(^[a-z])|([-'][a-z])/g, (match) => match.toUpperCase());
}

export function titleCase(value: string | null | undefined): string {
  const cleaned = cleanLooseText(value);
  if (!cleaned) return '';

  return cleaned
    .split(' ')
    .map((word) => titleCaseWord(word))
    .join(' ')
    .replace(/\bAnd\b/g, 'and');
}

export function normalizePersonName(value: string | null | undefined): string {
  const cleaned = cleanLooseText(value);
  if (!cleaned) return '';
  return titleCase(cleaned);
}

export function normalizeCenterName(value: string | null | undefined): string {
  const cleaned = cleanLooseText(value);
  if (!cleaned) return '';

  const alias = CENTER_ALIASES.find(([pattern]) => pattern.test(cleaned));
  if (alias) return alias[1];

  return cleaned
    .split(',')
    .map((part) => titleCase(part.trim()))
    .filter(Boolean)
    .join(', ');
}

export function formatStudioName(value: string | null | undefined): string {
  const center = normalizeCenterName(value);
  if (!center) return '';
  return center.replace('Headquarters', 'HQ');
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const cleaned = normalizePersonName(fullName);
  if (!cleaned) {
    return { firstName: '', lastName: '' };
  }

  const [firstName, ...rest] = cleaned.split(' ');
  return {
    firstName,
    lastName: rest.join(' '),
  };
}

export function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === '-') return null;

  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const normalizedYear = year.length === 2 ? `20${year}` : year;
    const date = new Date(`${normalizedYear}-${month}-${day}`);
    if (!Number.isNaN(date.getTime())) return date;
  }

  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatMomenceDate(dateStr: string): string {
  const date = parseFlexibleDate(dateStr) ?? new Date();
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
}

export function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

export function getElapsedDaysLabel(dateStr: string): string {
  const parsedDate = parseFlexibleDate(dateStr);
  if (!parsedDate) return 'No date';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(parsedDate);
  date.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays > 1) return `${diffDays} days ago`;

  const daysAhead = Math.abs(diffDays);
  return daysAhead === 1 ? 'In 1 day' : `In ${daysAhead} days`;
}

export function getCurrentWeekRangeLabel(reference = new Date()): string {
  const day = reference.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(reference);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(reference.getDate() + mondayOffset);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return `${formatDateLabel(monday)} – ${formatDateLabel(sunday)}`;
}

function getWeekStart(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + mondayOffset);
  return result;
}

function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

function formatMonthBucket(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatQuarterBucket(date: Date): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter} ${date.getFullYear()}`;
}

function formatYearBucket(date: Date): string {
  return String(date.getFullYear());
}

export function getLeadGroupLabel(lead: Lead, key: GroupableLeadKey): string {
  if (!GROUPABLE_VALUE_KEYS.includes(key)) return '—';

  if (key === 'createdAt' || key === 'createdWeek' || key === 'createdMonth' || key === 'createdQuarter' || key === 'createdYear') {
    const parsedDate = parseFlexibleDate(lead.createdAt);
    if (!parsedDate) {
      return cleanLooseText(lead.createdAt) || '—';
    }

    if (key === 'createdAt') {
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(parsedDate);
    }

    if (key === 'createdWeek') {
      const start = getWeekStart(parsedDate);
      const end = getWeekEnd(parsedDate);
      return `${formatDateLabel(start)} – ${formatDateLabel(end)} ${start.getFullYear()}`;
    }

    if (key === 'createdMonth') return formatMonthBucket(parsedDate);
    if (key === 'createdQuarter') return formatQuarterBucket(parsedDate);
    return formatYearBucket(parsedDate);
  }

  const value = lead[key];
  return cleanLooseText(typeof value === 'string' ? value : String(value ?? '')) || '—';
}

export function buildLeadOptions(leads: Lead[]): LeadOptionSets {
  const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));

  return {
    associates: unique(leads.map((lead) => lead.associate)),
    statuses: unique(leads.map((lead) => lead.status)),
    centers: unique(leads.map((lead) => lead.center)),
    channels: unique(leads.map((lead) => lead.channel)),
    conversionStatuses: unique(leads.map((lead) => lead.conversionStatus)),
    trialStatuses: unique(leads.map((lead) => lead.trialStatus)),
    sourceNames: unique(leads.map((lead) => lead.sourceName)),
    stageNames: unique(leads.map((lead) => lead.stageName)),
  };
}

export function getLeadFieldValue(lead: Lead, key: GroupableLeadKey): string {
  return getLeadGroupLabel(lead, key);
}

export function buildStageBreakdown(leads: Lead[]): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();

  for (const lead of leads) {
    const label = cleanLooseText(lead.stageName) || 'Unassigned';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const priorityMatchers = [
    /trial scheduled/i,
    /trial/i,
    /membership sold|converted|sold/i,
    /not interested|lost/i,
    /proximity/i,
  ];

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => {
      const aPriority = priorityMatchers.findIndex((pattern) => pattern.test(a.label));
      const bPriority = priorityMatchers.findIndex((pattern) => pattern.test(b.label));
      const safeA = aPriority === -1 ? Number.MAX_SAFE_INTEGER : aPriority;
      const safeB = bPriority === -1 ? Number.MAX_SAFE_INTEGER : bPriority;
      if (safeA !== safeB) return safeA - safeB;
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label);
    });
}

export function buildMainStageSummary(leads: Lead[]): Array<{ label: string; count: number; share: number }> {
  const stageBuckets = [
    { label: 'Trial Scheduled', pattern: /trial scheduled/i },
    { label: 'Trials', pattern: /(^|\s)trial($|\s)|trial completed|trial done/i },
    { label: 'Membership Sold', pattern: /membership sold|sold|converted/i },
    { label: 'Not Interested', pattern: /not interested|lost/i },
    { label: 'Proximity', pattern: /proximity/i },
  ];

  const total = leads.length || 1;

  return stageBuckets.map((bucket) => {
    const count = leads.filter((lead) => bucket.pattern.test(cleanLooseText(lead.stageName))).length;
    return {
      label: bucket.label,
      count,
      share: (count / total) * 100,
    };
  });
}

export function buildCountSummary(
  leads: Lead[],
  key: Extract<GroupableLeadKey, 'sourceName' | 'stageName'>,
) {
  const counts = new Map<string, number>();

  for (const lead of leads) {
    const label = getLeadGroupLabel(lead, key);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const total = leads.length || 1;

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      share: (count / total) * 100,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label);
    });
}

export function flattenGroupedLeads(leads: Lead[], groupKeys: GroupableLeadKey[]): LeadRenderRow[] {
  const indexed = leads.map((lead) => ({ lead }));

  if (groupKeys.length === 0) {
    return indexed.map(({ lead }, index) => ({
      type: 'lead' as const,
      id: `${lead.id}-${index + 1}`,
      depth: 0,
      lead,
      rowNumber: index + 1,
      parentGroupIds: [],
    }));
  }

  let visibleLeadCounter = 0;

  const walk = (
    entries: Array<{ lead: Lead }>,
    keys: GroupableLeadKey[],
    depth: number,
    path: string,
    parentGroupIds: string[],
    numberPrefix: string,
  ): LeadRenderRow[] => {
    if (keys.length === 0) {
      return entries.map(({ lead }) => {
        visibleLeadCounter += 1;
        return {
          type: 'lead' as const,
          id: `${path}-${lead.id}-${visibleLeadCounter}`,
          depth,
          lead,
          rowNumber: visibleLeadCounter,
          parentGroupIds,
        };
      });
    }

    const [currentKey, ...rest] = keys;
    const grouped = new Map<string, Array<{ lead: Lead }>>();

    for (const entry of entries) {
      const groupValue = getLeadFieldValue(entry.lead, currentKey);
      if (!grouped.has(groupValue)) {
        grouped.set(groupValue, []);
      }
      grouped.get(groupValue)?.push(entry);
    }

    const rows: LeadRenderRow[] = [];
    let groupIndex = 0;

    for (const [label, groupEntries] of grouped.entries()) {
      groupIndex += 1;
      const id = `${path}-${currentKey}-${label}`;
      const groupNumber = numberPrefix ? `${numberPrefix}.${groupIndex}` : String(groupIndex);
      rows.push({
        type: 'group',
        id,
        depth,
        label,
        groupKey: currentKey,
        count: groupEntries.length,
        groupNumber,
        parentGroupIds,
      });
      rows.push(...walk(groupEntries, rest, depth + 1, id, [...parentGroupIds, id], groupNumber));
    }

    return rows;
  };

  return walk(indexed, groupKeys, 0, 'root', [], '');
}

export function buildSourceIdMap(leads: Lead[]): Record<string, number> {
  return leads.reduce<Record<string, number>>((acc, lead) => {
    const label = cleanLooseText(lead.sourceName);
    const id = Number(lead.sourceId);
    if (label && Number.isFinite(id)) {
      acc[label] = id;
    }
    return acc;
  }, {});
}
