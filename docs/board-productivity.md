# Board productivity

Show the creator avatar separately from assignees on every task card. New local tasks record the signed-in user; imported GitHub issues use the issue author. Legacy tasks without authors display an unknown creator instead of inferred attribution.

All Projects supports named saved views (project selection plus filters), shortcuts for My tasks, Blocked, and Overdue, and remembered selection per user/browser. Quick creation opens a project picker followed by the existing task form, scoped to public projects.

Task mutations record actor, timestamp, and changed values in per-task activity history. Undo reverses the most recent local task operation, keeps an activity entry, and supports a bounded session stack. Project/schema/import changes and user changes clear undo to avoid restoring stale data. These features use existing local storage; they do not claim a remote audit trail or implement the currently simulated sync.

Verify attribution, GitHub author mapping, saved view persistence and shortcuts, public project creation scope, task changes and undo including deletion, history persistence and user isolation. Run full tests and production build before committing and pushing.
