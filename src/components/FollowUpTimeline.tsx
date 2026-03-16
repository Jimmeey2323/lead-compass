import type { FollowUp } from '@/types/leads';
import { isOverdue, isMissingFeedback } from '@/hooks/useLeadsData';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  followUps: FollowUp[];
  status: string;
}

export function FollowUpTimeline({ followUps, status }: Props) {
  return (
    <div className="flex items-center gap-1">
      {followUps.map((fu, i) => {
        const hasDate = !!fu.date && fu.date !== '-';
        const hasComment = !!fu.comment && fu.comment !== '-';
        const completed = hasDate && hasComment;
        const overdue = hasDate && isOverdue(fu.date, status) && !hasComment;
        const missing = isMissingFeedback(fu);

        let dotClass = 'h-2.5 w-2.5 rounded-full border-2 ';
        let lineClass = 'h-0.5 w-4 ';

        if (completed) {
          dotClass += 'bg-accent-converted border-accent-converted';
        } else if (overdue) {
          dotClass += 'bg-accent-overdue border-accent-overdue animate-pulse-overdue';
        } else if (missing) {
          dotClass += 'bg-accent-warning border-accent-warning';
        } else if (hasDate) {
          dotClass += 'bg-accent-info border-accent-info';
        } else {
          dotClass += 'bg-transparent border-muted-foreground/30';
        }

        if (i < followUps.length - 1) {
          const nextHasDate = followUps[i + 1]?.date && followUps[i + 1]?.date !== '-';
          lineClass += completed ? 'bg-accent-converted' : nextHasDate ? 'bg-border' : 'bg-border/40';
        }

        const tooltipContent = hasDate
          ? `FU${fu.index}: ${fu.date}${hasComment ? ` — ${fu.comment}` : ' — No comment'}`
          : `FU${fu.index}: Not scheduled`;

        return (
          <div key={i} className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={dotClass} />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[300px] text-xs">
                <p>{tooltipContent}</p>
              </TooltipContent>
            </Tooltip>
            {i < followUps.length - 1 && <div className={lineClass} />}
          </div>
        );
      })}
    </div>
  );
}
