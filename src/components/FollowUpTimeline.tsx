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
      <div className="flex items-center gap-1">
        {followUps.map((fu, i) => {
          const hasDate = !!fu.date && fu.date !== '-';
          const hasComment = !!fu.comment && fu.comment !== '-';
          const completed = hasDate && hasComment;
          const overdue = hasDate && isOverdue(fu.date, status) && !hasComment;
          const missing = isMissingFeedback(fu);

          let ringClass = 'border-border/40 bg-muted/30';
          let iconEl: React.ReactNode = <Minus className="h-2.5 w-2.5 text-muted-foreground/30" />;

          if (completed) {
            ringClass = 'border-accent-converted/40 bg-accent-converted/10';
            iconEl = <Check className="h-2.5 w-2.5 text-accent-converted" />;
          } else if (overdue) {
            ringClass = 'border-accent-overdue/40 bg-accent-overdue/10 animate-pulse-overdue';
            iconEl = <AlertCircle className="h-2.5 w-2.5 text-accent-overdue" />;
          } else if (missing) {
            ringClass = 'border-accent-warning/40 bg-accent-warning/10';
            iconEl = <Clock className="h-2.5 w-2.5 text-accent-warning" />;
          } else if (hasDate) {
            ringClass = 'border-primary/30 bg-primary/8';
            iconEl = <Clock className="h-2.5 w-2.5 text-primary" />;
          }

          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-default transition-all hover:scale-110 ${ringClass}`}>
                  {iconEl}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[360px] p-3 space-y-1.5">
                <p className="text-xs font-semibold text-foreground">Follow Up {fu.index}</p>
                {hasDate ? (
                  <>
                    <p className="text-[11px] text-muted-foreground font-mono">{fu.date}</p>
                    {hasComment ? (
                      <p className="text-[11px] text-foreground leading-relaxed border-t border-border/30 pt-1.5 mt-1.5">{fu.comment}</p>
                    ) : (
                      <p className="text-[11px] text-accent-warning italic">No feedback recorded</p>
                    )}
                  </>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">Not yet scheduled</p>
                )}
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
          dotClass += 'bg-primary';
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
              <TooltipContent side="top" className="max-w-[360px] p-3 space-y-1.5">
                <p className="text-xs font-semibold text-foreground">Follow Up {fu.index}</p>
                {hasDate && <p className="text-[11px] text-muted-foreground font-mono">{fu.date}</p>}
                {hasComment && <p className="text-[11px] text-foreground leading-relaxed border-t border-border/30 pt-1.5 mt-1.5">{fu.comment}</p>}
                {!hasDate && <p className="text-[11px] text-muted-foreground italic">Not scheduled</p>}
                {hasDate && !hasComment && <p className="text-[11px] text-accent-warning italic">Missing feedback</p>}
              </TooltipContent>
            </Tooltip>
            {i < followUps.length - 1 && <div className={lineClass} />}
          </div>
        );
      })}
    </div>
  );
}
