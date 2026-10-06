import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { boardStore, useBoardStore } from '@/store/boardStore';
import { parseBoard } from '@/lib/boardSync';
import { useBoardSync } from '@/context/BoardSyncContext';
import { useAuth } from '@/context/AuthContext';
import { getAccessibleProjects } from '@/lib/projectAccess';
import type { Task } from '@/types';
import {
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  Share2,
} from 'lucide-react';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ExportTab = 'json' | 'csv' | 'markdown';

export const ExportModal: React.FC<ExportModalProps> = ({ open, onOpenChange }) => {
  const [activeTab, setActiveTab] = useState<ExportTab>('markdown');
  const [copied, setCopied] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const { sync } = useBoardSync();

  const { tasks, projects, activeProject } = useBoardStore();
  const { user } = useAuth();

  const accessibleProjects = useMemo(() => getAccessibleProjects(projects, user), [projects, user]);
  const accessibleProjectIds = useMemo(
    () => new Set(accessibleProjects.map((p) => p.id)),
    [accessibleProjects]
  );
  const accessibleTasks = useMemo(
    () => tasks.filter((t) => accessibleProjectIds.has(t.projectId)),
    [tasks, accessibleProjectIds]
  );

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 1. JSON Export generator
  const generateJson = () => {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: user?.username || 'user',
      projects: accessibleProjects,
      tasks: accessibleTasks,
    };
    return JSON.stringify(backupData, null, 2);
  };

  const downloadJson = () => {
    const content = generateJson();
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasky-backup-${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 2. CSV Export generator
  const generateCsv = () => {
    const headers = [
      'ID',
      'Project',
      'Title',
      'Column',
      'Priority',
      'StoryPoints',
      'DueDate',
      'Assignees',
      'Tags',
      'Milestone',
      'GitHubIssue',
      'GitHubPR',
      'PRStatus',
      'Branch',
      'IsBlocked',
      'CreatedAt',
      'UpdatedAt',
    ];

    const columnTitleById = new Map<string, string>();
    const projectTitleById = new Map<string, string>();
    accessibleProjects.forEach((p) => {
      projectTitleById.set(p.id, p.name);
      p.columns.forEach((c) => columnTitleById.set(c.id, c.title));
    });

    const escapeCsv = (val: unknown): string => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = accessibleTasks.map((t) => [
      escapeCsv(t.id),
      escapeCsv(projectTitleById.get(t.projectId) || t.projectId),
      escapeCsv(t.title),
      escapeCsv(columnTitleById.get(t.columnId) || t.columnId),
      escapeCsv(t.priority),
      escapeCsv(t.storyPoints ?? ''),
      escapeCsv(t.dueDate ?? ''),
      escapeCsv(t.assignees.map((a) => a.username).join('; ')),
      escapeCsv(t.tags?.join('; ') ?? ''),
      escapeCsv(t.milestone ?? ''),
      escapeCsv(t.githubIssueNumber ?? ''),
      escapeCsv(t.githubPrNumber ?? ''),
      escapeCsv(t.prStatus ?? ''),
      escapeCsv(t.branchName ?? ''),
      escapeCsv(t.isBlocked ? 'YES' : 'NO'),
      escapeCsv(t.createdAt),
      escapeCsv(t.updatedAt),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  const downloadCsv = () => {
    const content = generateCsv();
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasky-tasks-${todayStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 3. Markdown Changelog / Release Notes generator
  const generateMarkdown = useMemo(() => {
    const proj = activeProject || accessibleProjects[0];
    const projectTasks = activeProject
      ? accessibleTasks.filter((t) => t.projectId === activeProject.id)
      : accessibleTasks;

    const columnTitleById = new Map<string, string>();
    (proj?.columns || []).forEach((c) => columnTitleById.set(c.id, c.title));

    // Group tasks
    const completedTasks: Task[] = [];
    const inProgressTasks: Task[] = [];
    const backlogTasks: Task[] = [];

    projectTasks.forEach((t) => {
      const colTitle = (columnTitleById.get(t.columnId) || t.columnId).toLowerCase();
      if (colTitle.includes('done') || colTitle.includes('ship') || t.columnId === 'done' || t.columnId === 'col-4' || t.columnId === 'col-5') {
        completedTasks.push(t);
      } else if (colTitle.includes('progress') || colTitle.includes('dev') || colTitle.includes('review')) {
        inProgressTasks.push(t);
      } else {
        backlogTasks.push(t);
      }
    });

    const formatLine = (t: Task): string => {
      let line = `- **[${t.priority}]** ${t.title}`;
      if (t.githubPrNumber) line += ` (PR #${t.githubPrNumber})`;
      else if (t.githubIssueNumber) line += ` (#${t.githubIssueNumber})`;
      if (t.storyPoints) line += ` • ${t.storyPoints}pts`;
      if (t.assignees.length > 0) line += ` • @${t.assignees.map((a) => a.username).join(', @')}`;
      if (t.branchName) line += ` \`[${t.branchName}]\``;
      if (t.isBlocked) line += ` ⚠️ Blocked: ${t.blockerReason || 'Impediment'}`;
      return line;
    };

    const lines: string[] = [
      `# Release Notes & Changelog - ${proj?.name || 'Tasky'}`,
      `> Generated on ${new Date().toLocaleDateString(undefined, { dateStyle: 'full' })} by @${user?.username || 'user'}`,
      '',
      '## 🚀 Shipped & Completed',
      completedTasks.length > 0 ? completedTasks.map(formatLine).join('\n') : '_No tasks completed in this cycle._',
      '',
      '## 🔨 In Active Development',
      inProgressTasks.length > 0 ? inProgressTasks.map(formatLine).join('\n') : '_No tasks currently in progress._',
      '',
      '## 📋 Backlog & Upcoming',
      backlogTasks.length > 0 ? backlogTasks.map(formatLine).join('\n') : '_Backlog is empty._',
      '',
      '---',
      `*Exported from Tasky • ${projectTasks.length} total tickets tracked*`,
    ];

    return lines.join('\n');
  }, [activeProject, accessibleProjects, accessibleTasks, user]);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([generateMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasky-changelog-${todayStr}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4 text-primary" />
            <span>Export & Backup Suite</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Export your workspace data to JSON backup, CSV spreadsheet, or release markdown
          </DialogDescription>
        </DialogHeader>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-3 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('markdown')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'markdown'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Markdown Changelog</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'csv'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>CSV Spreadsheet</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'json'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <FileJson className="h-3.5 w-3.5" />
            <span>JSON Full Backup</span>
          </button>
        </div>

        <div className="rounded-lg border p-3 space-y-2">
          <label htmlFor="board-backup" className="text-sm font-medium">Import projects from a Tasky JSON backup</label>
          <p className="text-xs text-muted-foreground">On the old Tasky site, choose Export → JSON Full Backup. Import that file here once to share your existing projects.</p>
          <input id="board-backup" type="file" accept=".json,application/json" className="text-xs w-full" onChange={async event => {
            const file = event.target.files?.[0];
            if (!file) return;
            try {
              if (file.size > 700_000) throw new Error('Backup is too large.');
              const imported = parseBoard(JSON.parse(await file.text()));
              const current = boardStore.getState();
              const duplicate = imported.projects.some(p => current.projects.some(existing => existing.id === p.id)) || imported.tasks.some(t => current.tasks.some(existing => existing.id === t.id));
              if (duplicate) throw new Error('This backup contains projects or tasks already present. Import stopped to protect existing edits.');
              boardStore.replaceBoard({ projects: [...current.projects, ...imported.projects.map(p => ({ ...p, owner: user?.role === 'super-admin' ? p.owner || user.username : user?.username }))], tasks: [...current.tasks, ...imported.tasks] });
              await sync();
              setImportMessage('Projects imported and shared successfully.');
            } catch (error) { setImportMessage(error instanceof Error ? error.message : 'Import failed.'); }
            event.target.value = '';
          }} />
          {importMessage && <p role="status" className="text-xs">{importMessage}</p>}
        </div>

        {/* Tab Content */}
        <div className="pt-2">
          {activeTab === 'markdown' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Changelog Preview
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyMarkdown}
                    className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-emerald-500 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Markdown</span>
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={downloadMarkdown}
                    className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .md</span>
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/40 p-3 max-h-72 overflow-y-auto font-mono text-[11px] whitespace-pre-wrap leading-relaxed select-all text-foreground/90">
                {generateMarkdown}
              </div>
            </div>
          )}

          {activeTab === 'csv' && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                  <span>Tabular CSV Spreadsheet Export</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Export all {accessibleTasks.length} accessible tickets into a standard CSV file compatible with Excel, Google Sheets, Notion, and Jira.
                </p>
                <div className="text-[11px] text-muted-foreground/80 pt-1">
                  Includes: ID, Project, Title, Column, Priority, Story Points, Due Date, Assignees, Tags, Milestone, PR Info, and Timestamps.
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={downloadCsv} className="gap-2 text-xs">
                  <Download className="h-3.5 w-3.5" />
                  <span>Download tasky-tasks-{todayStr}.csv</span>
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileJson className="h-5 w-5 text-blue-500" />
                  <span>Full JSON Schema State Backup</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Export a complete JSON backup containing all projects, column structures, tickets, subtasks, discussion comments, and repository bindings.
                </p>
                <div className="text-[11px] text-muted-foreground/80 pt-1">
                  Backed up: {accessibleProjects.length} Projects • {accessibleTasks.length} Tasks
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={downloadJson} className="gap-2 text-xs">
                  <Download className="h-3.5 w-3.5" />
                  <span>Download tasky-backup-{todayStr}.json</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
