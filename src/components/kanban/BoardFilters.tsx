import { useBoardStore } from '@/store/boardStore';
import type { Priority, Task } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, X, User, RotateCcw, Ban, Tag, Milestone } from 'lucide-react';

const PRIORITIES: { id: Priority | 'ALL'; label: string; dotColor: string }[] = [
  { id: 'ALL', label: 'All', dotColor: 'bg-muted-foreground' },
  { id: 'P0', label: 'P0 Critical', dotColor: 'bg-red-500' },
  { id: 'P1', label: 'P1 High', dotColor: 'bg-orange-500' },
  { id: 'P2', label: 'P2 Medium', dotColor: 'bg-amber-500' },
  { id: 'P3', label: 'P3 Low', dotColor: 'bg-blue-500' },
  { id: 'P4', label: 'P4 Trivial', dotColor: 'bg-emerald-500' },
];

export function BoardFilters({ tasks }: { tasks?: Task[] }) {
  const store = useBoardStore();
  const { filter, setFilter, resetFilter } = store;
  const activeProjectTasks = tasks ?? store.activeProjectTasks;
  const projectAssignees = Array.from(new Map(
    activeProjectTasks.flatMap((task) => task.assignees).map((assignee) => [assignee.username, assignee])
  ).values());
  const projectTags = [...new Set(activeProjectTasks.flatMap((task) => task.tags || []))];
  const projectMilestones = [...new Set(activeProjectTasks.flatMap((task) => task.milestone ? [task.milestone] : []))];

  const hasActiveFilters =
    filter.searchQuery.trim() !== '' ||
    filter.priority !== 'ALL' ||
    filter.assignee !== 'ALL' ||
    (filter.tag && filter.tag !== 'ALL') ||
    (filter.milestone && filter.milestone !== 'ALL') ||
    Boolean(filter.onlyBlocked) || Boolean(filter.onlyOverdue);

  // Calculate count per priority for current project tasks
  const getPriorityCount = (p: Priority | 'ALL') => {
    if (p === 'ALL') return activeProjectTasks.length;
    return activeProjectTasks.filter((t) => t.priority === p).length;
  };

  const blockedCount = activeProjectTasks.filter((t) => t.isBlocked).length;

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-2.5 bg-card/75 backdrop-blur-md border-b border-border/70 sticky top-14 z-20 shadow-xs">
      {/* Left: Search input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Filter tasks by title, branch, #issue..."
          value={filter.searchQuery}
          onChange={(e) => setFilter({ searchQuery: e.target.value })}
          className="pl-8 pr-8 h-8 text-xs bg-background/80"
        />
        {filter.searchQuery && (
          <button
            onClick={() => setFilter({ searchQuery: '' })}
            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Right: Priority pills + Assignee selector + Reset */}
      <div className="flex items-center gap-2 flex-wrap overflow-x-auto">
        {/* Priority Filter Pills */}
        <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/40">
          {PRIORITIES.map(({ id, label, dotColor }) => {
            const isSelected = filter.priority === id;
            const count = getPriorityCount(id);

            return (
              <button
                key={id}
                type="button"
                onClick={() => setFilter({ priority: id })}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                <span>{label.split(' ')[0]}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Blocker Filter Pill */}
        <button
          type="button"
          onClick={() => setFilter({ onlyBlocked: !filter.onlyBlocked })}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
            filter.onlyBlocked
              ? 'bg-destructive text-destructive-foreground border-destructive shadow-xs font-semibold'
              : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
          title="Toggle only blocked tasks"
        >
          <Ban className="h-3 w-3" />
          <span>Blocked</span>
          <span className="text-[10px] opacity-80">({blockedCount})</span>
        </button>

        <button type="button" aria-pressed={Boolean(filter.onlyOverdue)} onClick={() => setFilter({ onlyOverdue: !filter.onlyOverdue })} className="rounded-lg border border-border px-2.5 py-1 text-xs aria-pressed:bg-destructive aria-pressed:text-destructive-foreground">Overdue</button>

        {/* Assignee Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-7 px-2.5 text-xs gap-1.5 border-border/70 ${
                filter.assignee !== 'ALL' ? 'border-primary text-primary bg-primary/5' : ''
              }`}
            >
              <User className="h-3 w-3" />
              <span className="max-w-[100px] truncate">
                {filter.assignee === 'ALL' ? 'Assignee' : `@${filter.assignee}`}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => setFilter({ assignee: 'ALL' })}
              className={`text-xs cursor-pointer ${filter.assignee === 'ALL' ? 'font-semibold text-primary' : ''}`}
            >
              All Assignees
            </DropdownMenuItem>
            {projectAssignees.map((assignee) => (
              <DropdownMenuItem
                key={assignee.username}
                onClick={() => setFilter({ assignee: assignee.username })}
                className={`text-xs cursor-pointer ${
                  filter.assignee === assignee.username ? 'font-semibold text-primary' : ''
                }`}
              >
                @{assignee.username} {assignee.name ? `(${assignee.name})` : ''}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tag Filter Dropdown */}
        {projectTags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-7 px-2.5 text-xs gap-1.5 border-border/70 ${
                  filter.tag && filter.tag !== 'ALL'
                    ? 'border-primary text-primary bg-primary/5'
                    : ''
                }`}
              >
                <Tag className="h-3 w-3" />
                <span className="max-w-[100px] truncate">
                  {!filter.tag || filter.tag === 'ALL' ? 'Tag' : `#${filter.tag}`}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => setFilter({ tag: 'ALL' })}
                className={`text-xs cursor-pointer ${
                  !filter.tag || filter.tag === 'ALL' ? 'font-semibold text-primary' : ''
                }`}
              >
                All Tags
              </DropdownMenuItem>
              {projectTags.map((tag) => (
                <DropdownMenuItem
                  key={tag}
                  onClick={() => setFilter({ tag })}
                  className={`text-xs cursor-pointer ${
                    filter.tag === tag ? 'font-semibold text-primary' : ''
                  }`}
                >
                  #{tag}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Milestone Filter Dropdown */}
        {projectMilestones.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-7 px-2.5 text-xs gap-1.5 border-border/70 ${
                  filter.milestone && filter.milestone !== 'ALL'
                    ? 'border-primary text-primary bg-primary/5'
                    : ''
                }`}
              >
                <Milestone className="h-3 w-3" />
                <span className="max-w-[100px] truncate">
                  {!filter.milestone || filter.milestone === 'ALL'
                    ? 'Milestone'
                    : filter.milestone}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => setFilter({ milestone: 'ALL' })}
                className={`text-xs cursor-pointer ${
                  !filter.milestone || filter.milestone === 'ALL'
                    ? 'font-semibold text-primary'
                    : ''
                }`}
              >
                All Milestones
              </DropdownMenuItem>
              {projectMilestones.map((m) => (
                <DropdownMenuItem
                  key={m}
                  onClick={() => setFilter({ milestone: m })}
                  className={`text-xs cursor-pointer ${
                    filter.milestone === m ? 'font-semibold text-primary' : ''
                  }`}
                >
                  {m}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Reset button when filters are active */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilter}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            title="Clear filters"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
}
