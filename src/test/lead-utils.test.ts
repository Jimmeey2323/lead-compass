import { describe, expect, it } from 'vitest';
import {
  buildStageBreakdown,
  normalizeCenterName,
  normalizePersonName,
  splitFullName,
} from '@/lib/lead-utils';
import type { Lead } from '@/types/leads';

const baseLead: Lead = {
  id: '1',
  fullName: 'Roshan Adak',
  phoneNumber: '',
  email: '',
  createdAt: '16/03/26',
  sourceId: '3507',
  sourceName: 'Instagram',
  memberId: '',
  convertedAt: '',
  stageId: '',
  stageName: 'Trial Scheduled',
  associate: 'Nadiya Shaikh',
  remarks: '',
  followUps: [],
  center: 'Supreme HQ Bandra',
  classType: '',
  hostId: '',
  status: 'Active',
  channel: '',
  period: '',
  purchasesMade: 0,
  ltv: 0,
  visits: 0,
  trialStatus: '',
  conversionStatus: '',
  retentionStatus: '',
};

describe('lead utils', () => {
  it('normalizes centers and names', () => {
    expect(normalizeCenterName('supreme hq bandra')).toBe('Supreme Headquarters, Bandra');
    expect(normalizePersonName('Bhanu Priya Nahar Wed Sep 26 1990 00:00:00 GMT+0530 (India Standard Time)')).toBe('Bhanu Priya Nahar');
    expect(splitFullName('Bhanu Priya Nahar')).toEqual({ firstName: 'Bhanu', lastName: 'Priya Nahar' });
  });

  it('prioritizes notable stage breakdown entries', () => {
    const breakdown = buildStageBreakdown([
      baseLead,
      { ...baseLead, id: '2', stageName: 'Membership Sold' },
      { ...baseLead, id: '3', stageName: 'Not Interested' },
    ]);

    expect(breakdown.map((entry) => entry.label)).toEqual(['Trial Scheduled', 'Membership Sold', 'Not Interested']);
  });
});
