import { useId, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import type { Assignee } from '../../types';
import { Input } from '../ui/input';
import { parseAssigneeNames, toggleAssignee } from '../../lib/projectMembers';

export function AssigneePicker({ value, onChange, members, label = 'Assignees' }: { label?: string; value: string; onChange: (value: string) => void; members: Assignee[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const selected = new Set(parseAssigneeNames(value).map(name => name.toLowerCase()));
  const filtered = members.filter(member => `${member.username} ${member.name || ''}`.toLowerCase().includes(query.trim().replace(/^@/, '').toLowerCase()));
  return <div ref={root} className="relative" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <div className="flex gap-1">
      <Input aria-label={label} value={value} onChange={event => onChange(event.target.value)} onFocus={() => setOpen(true)} placeholder="Choose project members or type a username" className="text-sm" />
      <button type="button" aria-label={label === 'Assignees' ? 'Choose project members' : 'Choose reviewers'} aria-expanded={open} aria-controls={id} onClick={() => { setOpen(!open); setQuery(''); }} className="rounded-md border border-input px-2 hover:bg-accent"><ChevronDown className="h-4 w-4" /></button>
    </div>
    {open && <div className="mt-2 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg p-2" onKeyDown={event => {
      if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); root.current?.querySelector<HTMLButtonElement>('button[aria-label]')?.focus(); }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const options = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') || []);
        if (!options.length) return;
        const index = options.indexOf(document.activeElement as HTMLButtonElement);
        options[(index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length]?.focus();
      }
    }}>
      <div className="flex items-center gap-2 px-1 pb-2"><Search className="h-4 w-4 text-muted-foreground" /><Input aria-label={label === 'Assignees' ? 'Search project members' : 'Search reviewers'} placeholder="Search project members…" value={query} onChange={event => setQuery(event.target.value)} className="h-8 shadow-none" /></div>
      <div id={id} role="listbox" aria-label={label} aria-multiselectable="true" className="max-h-44 overflow-y-auto space-y-1">
        {filtered.map(member => <button type="button" role="option" aria-selected={selected.has(member.username.toLowerCase())} key={member.username.toLowerCase()} onClick={() => onChange(toggleAssignee(value, member.username))} className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none">
          <img src={member.avatarUrl || `https://github.com/${encodeURIComponent(member.username)}.png`} alt="" className="h-7 w-7 rounded-full bg-muted" />
          <span className="flex-1">{member.username}{member.name && <span className="block text-xs text-muted-foreground">{member.name}</span>}</span>
          {selected.has(member.username.toLowerCase()) && <Check className="h-4 w-4 text-primary" />}
        </button>)}
        {filtered.length === 0 && <p className="p-2 text-xs text-muted-foreground">No matching project members.</p>}
      </div>
      <p className="px-2 pt-2 text-xs text-muted-foreground">Select several people. Names are separated by commas automatically.</p>
    </div>}
  </div>;
}
