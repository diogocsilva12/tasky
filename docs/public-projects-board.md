# All public projects board

Add a top-level Kanban view containing all tasks from public projects in the local Tasky store. Projects without explicit visibility follow the existing public default. Private projects are excluded regardless of user role.

Merge columns by trimmed, case-insensitive title, retaining custom titles and empty columns. Keep tasks whose columns are missing visible under Unassigned. Cards retain their original project, column, repository context, and task actions. Editing uses the source project's task dialog. Drops resolve the destination against the task's own project; unsupported destinations do not mutate tasks.

Reuse existing filters across the public task set and show project names linking to individual boards. Verify public/default/private selection, shared column IDs, custom and missing columns, filters, and source-project move resolution. Run the full test suite and production build.
