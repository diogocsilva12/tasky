# Themes, persistent sign-in, project members and retrospectives

## Changes

- Connected existing HSL design tokens to Tailwind 4 theme utilities. Added four light palettes and retained six dark palettes. Dialogs and inputs are opaque, use explicit foreground colors and honor the selected color scheme.
- Added optional 30-day remembered sign-in. A separate server secret encrypts the GitHub token using AES-256-GCM in a Secure, HttpOnly, SameSite=Strict cookie. Session restoration supplies the token only to the same-origin app; logout clears the cookie. No token is stored persistently in localStorage.
- Changed the GitHub verification action to a native link. Clipboard failure is handled independently.
- Added a searchable multi-select for approved users who can access the project. Selecting users inserts comma-separated usernames and removes duplicates.
- Added one editable retrospective per project, containing the user-rated outcome, notes, organizational practices and observed completion metrics. An interpretable statistical model compares success frequencies with Beta(1,1) smoothing; each comparison requires at least three projects with the practice and three without. It reports associations, never causal conclusions. No synthetic outcomes or external AI services are used. Practices reflect the state at review time.

## Verification

155 automated tests passed; TypeScript and Vite production build passed. Browser checks passed for task dialogs in all ten palettes, project dialogs in all four light palettes, a mobile task dialog, user search, multiple selection and deselection. Screenshots were visually inspected for the light and midnight task forms. All verification fixtures were isolated from production workspace data.

## Use

Use the palette button for themes, the login checkbox to remember a session, and the assignee arrow/search field to select people. Project reviews live under Executive Dashboard & Resume → Learn from our organization. Project owners and administrators can record outcomes. Shared project permissions continue to apply.

Production checks passed on https://tasky-silk-two.vercel.app: encrypted HttpOnly cookie creation, automatic login restoration in a fresh browser context, cookie deletion on sign-out, and opening GitHub in a new tab with clipboard access unavailable. These checks did not change any project or task records.
