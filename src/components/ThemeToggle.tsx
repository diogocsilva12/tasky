import { useTheme } from '@/components/theme-provider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Palette, Check, Sun, Moon } from 'lucide-react';
import { THEMES } from '@/lib/themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" title="Change Theme"><Palette className="h-4 w-4" /><span className="sr-only">Change theme</span></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56 p-2">
      <DropdownMenuLabel className="flex items-center gap-2 text-xs"><Sun className="h-3.5 w-3.5" /> Light themes</DropdownMenuLabel>
      {THEMES.filter(t => t.mode === 'light').map(t => <DropdownMenuItem key={t.id} onClick={() => setTheme(t.id)} className="justify-between py-2 text-sm"><span className="flex items-center gap-3"><span className="h-4 w-4 rounded-full border border-black/15" style={{ backgroundColor: t.swatch }} />{t.label}</span>{theme === t.id && <Check className="h-4 w-4" />}</DropdownMenuItem>)}
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="flex items-center gap-2 text-xs"><Moon className="h-3.5 w-3.5" /> Dark themes</DropdownMenuLabel>
      {THEMES.filter(t => t.mode === 'dark').map(t => <DropdownMenuItem key={t.id} onClick={() => setTheme(t.id)} className="justify-between py-2 text-sm"><span className="flex items-center gap-3"><span className="h-4 w-4 rounded-full border border-white/15" style={{ backgroundColor: t.swatch }} />{t.label}</span>{theme === t.id && <Check className="h-4 w-4" />}</DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}
