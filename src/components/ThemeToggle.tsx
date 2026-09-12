import { useTheme } from '@/components/theme-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Palette, Check } from 'lucide-react';
import type { Theme } from '@/types';

const themes: { id: Theme; label: string; dotClass: string }[] = [
  { id: 'dark', label: 'Dark Modern', dotClass: 'bg-zinc-800' },
  { id: 'light', label: 'Minimalist Light', dotClass: 'bg-zinc-200 border border-zinc-400' },
  { id: 'slate', label: 'Deep Slate', dotClass: 'bg-sky-500' },
  { id: 'midnight', label: 'Midnight Navy', dotClass: 'bg-indigo-500' },
  { id: 'zinc', label: 'Zinc Monochrome', dotClass: 'bg-zinc-500' },
  { id: 'cyberpunk', label: 'Cyberpunk Violet', dotClass: 'bg-pink-500' },
  { id: 'monokai', label: 'Monokai Code', dotClass: 'bg-lime-500' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Change Theme">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className="flex items-center justify-between text-xs cursor-pointer py-1.5"
          >
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${t.dotClass}`} />
              <span>{t.label}</span>
            </div>
            {theme === t.id && <Check className="h-3.5 w-3.5 opacity-80" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
