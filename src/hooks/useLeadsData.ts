import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Lead, FollowUp } from '@/types/leads';

function parseRow(row: string[]): Lead {
  const followUps: FollowUp[] = [];
  for (let i = 0; i < 4; i++) {
    const dateIdx = 12 + i * 2;
    const commentIdx = 13 + i * 2;
    followUps.push({
      date: row[dateIdx] || '',
      comment: row[commentIdx] || '',
      index: i + 1,
    });
  }

  return {
    id: row[0] || '',
    fullName: row[1] || '',
    phoneNumber: row[2] || '',
    email: row[3] || '',
    createdAt: row[4] || '',
    sourceId: row[5] || '',
    sourceName: row[6] || '',
    memberId: row[7] || '',
    convertedAt: row[8] || '',
    stageName: row[9] || '',
    associate: row[10] || '',
    remarks: row[11] || '',
    followUps,
    center: row[20] || '',
    classType: row[21] || '',
    hostId: row[22] || '',
    status: row[23] || '',
    channel: row[24] || '',
    period: row[25] || '',
    purchasesMade: parseInt(row[26]) || 0,
    ltv: parseFloat(row[27]) || 0,
    visits: parseInt(row[28]) || 0,
    trialStatus: row[29] || '',
    conversionStatus: row[30] || '',
    retentionStatus: row[31] || '',
  };
}

async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase.functions.invoke('fetch-leads');
  if (error) throw error;
  
  const rows: string[][] = data.values || [];
  // Skip header row
  if (rows.length <= 1) return [];
  return rows.slice(1).map(parseRow);
}

export function useLeadsData() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: fetchLeads,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function isOverdue(dateStr: string, status: string): boolean {
  if (!dateStr || dateStr === '-') return false;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return false;
  const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  return date < new Date() && status !== 'Converted' && status !== 'Lost';
}

export function isMissingFeedback(followUp: FollowUp): boolean {
  return !!followUp.date && followUp.date !== '-' && (!followUp.comment || followUp.comment === '-');
}
