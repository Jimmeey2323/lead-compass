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

export type ViewMode = 'table' | 'associate' | 'kanban';

export interface FilterState {
  associate: string;
  status: string;
  center: string;
  channel: string;
  conversionStatus: string;
  trialStatus: string;
  search: string;
  dateRange: { from: string; to: string };
}

export const defaultFilters: FilterState = {
  associate: 'all',
  status: 'all',
  center: 'all',
  channel: 'all',
  conversionStatus: 'all',
  trialStatus: 'all',
  search: '',
  dateRange: { from: '', to: '' },
};
