import { useFormSession } from '@/hooks/useFormSession';
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { boardStore } from '@/store/boardStore';
import type { Column } from '@/types';
import { Columns, Check } from 'lucide-react';

interface ColumnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  columnToEdit?: Column | null;
}

const COLOR_PALETTE = [
  { name: 'Slate', hex: '#64748b' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Rose', hex: '#f43f5e' },
];

export function ColumnModal({
  open,
  onOpenChange,
  projectId,
  columnToEdit,
}: ColumnModalProps) {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [wipLimit, setWipLimit] = useState('');
  const [error, setError] = useState('');

  useFormSession(open, JSON.stringify([projectId, columnToEdit?.id ?? null]), () => {
    if (columnToEdit) {
      setTitle(columnToEdit.title);
      setColor(columnToEdit.color || '#3b82f6');
      setWipLimit(columnToEdit.wipLimit !== undefined ? String(columnToEdit.wipLimit) : '');
    } else {
      setTitle('');
      setColor('#3b82f6');
      setWipLimit('');
    }
    setError('');
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Column title is required');
      return;
    }

    const parsedWip = wipLimit.trim() ? parseInt(wipLimit.trim(), 10) : undefined;
    const wipLimitVal = parsedWip && parsedWip > 0 ? parsedWip : undefined;

    if (columnToEdit) {
      boardStore.updateColumn(projectId, columnToEdit.id, {
        title: title.trim(),
        color,
        wipLimit: wipLimitVal,
      });
    } else {
      boardStore.addColumn(projectId, {
        title: title.trim(),
        color,
        wipLimit: wipLimitVal,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Columns className="h-5 w-5 text-primary" />
            {columnToEdit ? 'Edit Column' : 'Add New Column'}
          </DialogTitle>
          <DialogDescription>
            {columnToEdit
              ? 'Update column name and accent color.'
              : 'Add a new workflow column to this project board.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Column Title <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. In Review, QA, Blocked..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Accent Color</label>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_PALETTE.map((item) => {
                const isSelected = color.toLowerCase() === item.hex.toLowerCase();
                return (
                  <button
                    key={item.hex}
                    type="button"
                    onClick={() => setColor(item.hex)}
                    className="relative flex h-8 w-8 items-center justify-center rounded-md border border-border/40 transition-transform hover:scale-110 cursor-pointer"
                    style={{ backgroundColor: item.hex }}
                    title={item.name}
                  >
                    {isSelected && <Check className="h-4 w-4 text-white drop-shadow-md" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs text-muted-foreground">Custom:</span>
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3b82f6"
                className="h-8 text-xs font-mono max-w-[120px]"
              />
              <div
                className="h-8 w-8 rounded-md border border-border shrink-0"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>

          {/* Work in Progress (WIP) Limit */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Work In Progress (WIP) Limit
              </label>
              <span className="text-[11px] text-muted-foreground">Optional</span>
            </div>
            <Input
              type="number"
              min="1"
              max="99"
              placeholder="e.g. 4 (Leave empty for no limit)"
              value={wipLimit}
              onChange={(e) => setWipLimit(e.target.value)}
              className="h-8 text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Displays a warning badge on the board when this column exceeds the limit.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {columnToEdit ? 'Save Column' : 'Add Column'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
