export interface FollowUp {
  date: string;
  comment: string;
  index: number;
}

export interface Lead {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  createdAt: string;
  sourceId: string;
  sourceName: string;
  memberId: string;
  convertedAt: string;
  stageName: string;
  associate: string;
  remarks: string;
  followUps: FollowUp[];
  center: string;
  classType: string;
  hostId: string;
  status: string;
  channel: string;
  period: string;
  purchasesMade: number;
  ltv: number;
  visits: number;
  trialStatus: string;
  conversionStatus: string;
  retentionStatus: string;
}

export interface AssociateStats {
  name: string;
  totalLeads: number;
  converted: number;
  lost: number;
  active: number;
  conversionRate: number;
  avgFollowUps: number;
  overdueFollowUps: number;
  totalLtv: number;
}

export type ViewMode = 'table' | 'associate';

export type DatePreset = 'all' | '7days' | 'lastWeek' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter';

export interface FilterState {
  associate: string;
  status: string;
  center: string;
  channel: string;
  conversionStatus: string;
  trialStatus: string;
  search: string;
  datePreset: DatePreset;
}

export const defaultFilters: FilterState = {
  associate: 'all',
  status: 'all',
  center: 'all',
  channel: 'all',
  conversionStatus: 'all',
  trialStatus: 'all',
  search: '',
  datePreset: 'all',
};

export function parseDateStr(dateStr: string): Date | null {
  if (!dateStr || dateStr === '-') return null;
  // Try DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    if (!isNaN(d.getTime())) return d;
  }
  // Try YYYY-MM-DD
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export function getDateRange(preset: DatePreset): { from: Date; to: Date } | null {
  if (preset === 'all') return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (preset) {
    case '7days': {
      const from = new Date(today);
      from.setDate(from.getDate() - 7);
      return { from, to: today };
    }
    case 'thisWeek': {
      const day = today.getDay();
      const from = new Date(today);
      from.setDate(from.getDate() - (day === 0 ? 6 : day - 1));
      return { from, to: today };
    }
    case 'lastWeek': {
      const day = today.getDay();
      const thisMonday = new Date(today);
      thisMonday.setDate(thisMonday.getDate() - (day === 0 ? 6 : day - 1));
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(lastMonday.getDate() - 7);
      const lastSunday = new Date(thisMonday);
      lastSunday.setDate(lastSunday.getDate() - 1);
      return { from: lastMonday, to: lastSunday };
    }
    case 'thisMonth': {
      return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today };
    }
    case 'lastMonth': {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from, to };
    }
    case 'thisQuarter': {
      const qStart = Math.floor(today.getMonth() / 3) * 3;
      return { from: new Date(today.getFullYear(), qStart, 1), to: today };
    }
    case 'lastQuarter': {
      const qStart = Math.floor(today.getMonth() / 3) * 3;
      const from = new Date(today.getFullYear(), qStart - 3, 1);
      const to = new Date(today.getFullYear(), qStart, 0);
      return { from, to };
    }
    default: return null;
  }
}
