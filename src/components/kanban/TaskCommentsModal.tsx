import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useBoardStore } from '@/store/boardStore';
import { useAuth } from '@/context/AuthContext';
import type { Priority } from '@/types';
import {
  MessageSquare,
  Send,
  Trash2,
  GitBranch,
  GitPullRequest,
} from 'lucide-react';

interface TaskCommentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
}

const PRIORITY_BADGES: Record<Priority, { label: string; class: string }> = {
  P0: { label: 'P0 Critical', class: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30' },
  P1: { label: 'P1 High', class: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30' },
  P2: { label: 'P2 Medium', class: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  P3: { label: 'P3 Low', class: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  P4: { label: 'P4 Backlog', class: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
};

export const TaskCommentsModal: React.FC<TaskCommentsModalProps> = ({
  open,
  onOpenChange,
  taskId,
}) => {
  const { tasks, addComment, deleteComment, projects } = useBoardStore();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const task = tasks.find((t) => t.id === taskId);
  const parentProject = task ? projects.find((p) => p.id === task.projectId) : undefined;
  const comments = task?.comments || [];

  // Scroll to bottom when comments change or dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        textareaRef.current?.focus();
      }, 100);
    }
  }, [open, comments.length]);

  if (!task) return null;

  const handlePostComment = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;

    const author = user?.username || 'diogocsilva12';
    const avatarUrl = user?.avatarUrl || `https://github.com/${author}.png`;

    addComment(task.id, trimmed, author, avatarUrl);
    setCommentText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePostComment();
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden bg-card/95 backdrop-blur-md border border-border/70 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <DialogHeader className="p-4 pb-3 border-b border-border/70 bg-muted/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  PRIORITY_BADGES[task.priority]?.class || ''
                }`}
              >
                {PRIORITY_BADGES[task.priority]?.label || task.priority}
              </span>
              {task.githubIssueNumber && (
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50">
                  #{task.githubIssueNumber}
                </span>
              )}
              {task.githubPrNumber && (
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/30 flex items-center gap-1">
                  <GitPullRequest className="h-2.5 w-2.5" />
                  <span>PR #{task.githubPrNumber}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold text-foreground">{comments.length}</span>
              <span>{comments.length === 1 ? 'comment' : 'comments'}</span>
            </div>
          </div>

          <DialogTitle className="text-sm font-semibold tracking-tight text-foreground line-clamp-1 mt-1.5 text-left">
            {task.title}
          </DialogTitle>

          <DialogDescription className="text-[11px] text-muted-foreground flex items-center gap-2 text-left">
            <span>{parentProject?.name || 'Tasky'}</span>
            {task.branchName && (
              <>
                <span>•</span>
                <span className="font-mono flex items-center gap-0.5">
                  <GitBranch className="h-2.5 w-2.5" />
                  <span>{task.branchName}</span>
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Conversation Stream Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-[220px] max-h-[380px] bg-background/40">
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h4 className="text-xs font-semibold text-foreground">No discussion in this thread yet</h4>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
                Start the conversation with your team, document architectural decisions, or leave progress notes.
              </p>
            </div>
          ) : (
            comments.map((comment) => {
              const isCurrentUser =
                user?.username &&
                comment.author.toLowerCase() === user.username.toLowerCase();

              return (
                <div key={comment.id} className="space-y-1 group animate-in fade-in-50 duration-150">
                  {/* Comment Author & Metadata */}
                  <div className="flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5 border border-border/80">
                        <AvatarImage src={comment.avatarUrl} alt={comment.author} />
                        <AvatarFallback className="text-[8px] font-bold bg-muted">
                          {comment.author.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                        <span>@{comment.author}</span>
                        {isCurrentUser && (
                          <span className="text-[9px] font-normal text-primary bg-primary/10 px-1 py-0.2 rounded border border-primary/20">
                            you
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatTimestamp(comment.createdAt)}
                      </span>
                    </div>

                    {/* Delete action */}
                    <button
                      type="button"
                      onClick={() => deleteComment(task.id, comment.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 rounded-md transition-all cursor-pointer"
                      title="Delete comment"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Comment Bubble Content */}
                  <div className="ml-7 p-3 rounded-xl border border-border/60 bg-card/85 backdrop-blur-xs text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap shadow-xs">
                    {comment.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Composer Footer */}
        <form
          onSubmit={handlePostComment}
          className="p-3 border-t border-border/70 bg-card/70 backdrop-blur-md space-y-2"
        >
          <div className="flex gap-2 items-start">
            <Avatar className="h-7 w-7 mt-0.5 border border-border shrink-0 hidden sm:inline-flex">
              <AvatarImage src={user?.avatarUrl} alt={user?.username} />
              <AvatarFallback className="text-[9px] font-bold">
                {user?.username?.slice(0, 2).toUpperCase() || 'ME'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                placeholder="Write a reply or leave a note... (Enter to send, Shift+Enter for new line)"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                className="text-xs resize-none pr-14 min-h-[56px] rounded-xl bg-background/80 focus:bg-background"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!commentText.trim()}
                className="absolute right-1.5 bottom-1.5 h-7 px-2.5 text-xs gap-1 cursor-pointer"
              >
                <Send className="h-3 w-3" />
                <span>Send</span>
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
            <span>Press ↵ to post comment</span>
            <span>Supports multiline text</span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
