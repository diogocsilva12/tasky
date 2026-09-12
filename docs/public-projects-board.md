# All public projects board

Add a top-level Kanban view containing all tasks from public projects in the local Tasky store. Projects without explicit visibility follow the existing public default. Private projects are excluded regardless of user role.

Group known status aliases into Backlog, To Do, In Progress, Review, and Done in workflow order; merge unknown custom columns by normalized title and retain empty columns. Project checkboxes support selecting one, multiple, or no public projects; All projects resets selection. Counts and task filter options follow the selected projects. Keep tasks whose columns are missing visible under Unassigned. Cards retain their original project, column, repository context, and task actions. Editing uses the source project's task dialog. Drops resolve the destination against the task's own project; unsupported or ambiguous destinations do not mutate tasks. Reordering within a unified status preserves the current source stage.

Reuse existing filters across the public task set and show project names linking to individual boards. Verify public/default/private selection, shared column IDs, custom and missing columns, filters, and source-project move resolution. Run the full test suite and production build.
