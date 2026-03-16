import type { FollowUp } from '@/types/leads';
import { isOverdue, isMissingFeedback } from '@/hooks/useLeadsData';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, AlertCircle, Clock, Minus } from 'lucide-react';

interface Props {
  followUps: FollowUp[];
  status: string;
  compact?: boolean;
}

export function FollowUpTimeline({ followUps, status, compact = false }: Props) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {followUps.map((fu, i) => {
          const hasDate = !!fu.date && fu.date !== '-';
          const hasComment = !!fu.comment && fu.comment !== '-';
          const completed = hasDate && hasComment;
          const overdue = hasDate && isOverdue(fu.date, status) && !hasComment;
          const missing = isMissingFeedback(fu);

          let iconEl: React.ReactNode;
          let bgClass = '';

          if (completed) {
            bgClass = 'bg-accent-converted/15 text-accent-converted';
            iconEl = <Check className="h-2.5 w-2.5" />;
          } else if (overdue) {
            bgClass = 'bg-accent-overdue/15 text-accent-overdue animate-pulse-overdue';
            iconEl = <AlertCircle className="h-2.5 w-2.5" />;
          } else if (missing) {
            bgClass = 'bg-accent-warning/15 text-accent-warning';
            iconEl = <Clock className="h-2.5 w-2.5" />;
          } else if (hasDate) {
            bgClass = 'bg-accent-info/15 text-accent-info';
            iconEl = <Clock className="h-2.5 w-2.5" />;
          } else {
            bgClass = 'bg-muted/50 text-muted-foreground/40';
            iconEl = <Minus className="h-2.5 w-2.5" />;
          }

          const tooltipContent = hasDate
            ? `FU${fu.index}: ${fu.date}${hasComment ? ` — ${fu.comment.substring(0, 80)}${fu.comment.length > 80 ? '...' : ''}` : ' — No comment'}`
            : `FU${fu.index}: Not scheduled`;

          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div className={`h-6 w-6 rounded-md flex items-center justify-center ${bgClass} cursor-default`}>
                  {iconEl}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[320px] text-xs leading-relaxed">
                <p>{tooltipContent}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    );
  }

  // Full timeline with lines
  return (
    <div className="flex items-center gap-0.5">
      {followUps.map((fu, i) => {
        const hasDate = !!fu.date && fu.date !== '-';
        const hasComment = !!fu.comment && fu.comment !== '-';
        const completed = hasDate && hasComment;
        const overdue = hasDate && isOverdue(fu.date, status) && !hasComment;
        const missing = isMissingFeedback(fu);

        let dotClass = 'h-3 w-3 rounded-full flex items-center justify-center ';
        let lineClass = 'h-0.5 w-3 ';

        if (completed) {
          dotClass += 'bg-accent-converted text-primary-foreground';
        } else if (overdue) {
          dotClass += 'bg-accent-overdue animate-pulse-overdue';
        } else if (missing) {
          dotClass += 'bg-accent-warning';
        } else if (hasDate) {
          dotClass += 'bg-accent-info';
        } else {
          dotClass += 'bg-border';
        }

        lineClass += completed ? 'bg-accent-converted' : 'bg-border';

        return (
          <div key={i} className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={dotClass}>
                  {completed && <Check className="h-2 w-2 text-primary-foreground" />}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[320px] text-xs">
                <p className="font-medium mb-0.5">Follow Up {fu.index}</p>
                {hasDate && <p className="text-muted-foreground">{fu.date}</p>}
                {hasComment && <p className="mt-1">{fu.comment}</p>}
                {!hasDate && <p className="text-muted-foreground italic">Not scheduled</p>}
                {hasDate && !hasComment && <p className="text-accent-warning italic">Missing feedback</p>}
              </TooltipContent>
            </Tooltip>
            {i < followUps.length - 1 && <div className={lineClass} />}
          </div>
        );
      })}
    </div>
  );
}
