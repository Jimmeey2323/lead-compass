import { CheckSquare, ChevronDown, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Props {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  allLabel?: string;
  buttonClassName?: string;
}

export function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  allLabel = 'All',
  buttonClassName,
}: Props) {
  const uniqueOptions = Array.from(new Set(options.filter(Boolean)));
  const allSelected = uniqueOptions.length > 0 && selected.length === uniqueOptions.length;
  const noneSelected = selected.length === 0;

  const toggle = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter((value) => value !== option)
        : [...selected, option],
    );
  };

  const summary = noneSelected
    ? allLabel
    : selected.length === 1
      ? selected[0]
      : `${selected.length} selected`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className={buttonClassName ?? 'h-10 w-full justify-between rounded-xl border-border/40 bg-background/70 px-3 text-sm font-normal text-foreground'}>
          <span className="truncate text-left">{summary}</span>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[260px] rounded-xl border border-border/50 bg-background/95 p-0 shadow-elevated">
        <div className="border-b border-border/30 px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</p>
        </div>
        <div className="flex items-center justify-between gap-2 border-b border-border/30 px-3 py-2">
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onChange(uniqueOptions)} disabled={allSelected || uniqueOptions.length === 0}>
            <CheckSquare className="mr-1.5 h-3.5 w-3.5" /> Select all
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onChange([])} disabled={noneSelected}>
            <Square className="mr-1.5 h-3.5 w-3.5" /> Deselect all
          </Button>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {uniqueOptions.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">No options available</p>
          ) : (
            uniqueOptions.map((option) => {
              const checked = selected.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggle(option)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary/[0.06]"
                >
                  <Checkbox checked={checked} className="pointer-events-none" />
                  <span className="truncate">{option}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
