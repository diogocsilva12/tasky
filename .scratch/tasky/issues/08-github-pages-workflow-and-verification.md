# 08: GitHub Pages Static Deployment Pipeline & Comprehensive Verification

**What to build:**
A production-ready GitHub Actions deployment workflow (`.github/workflows/deploy.yml`) configured for GitHub Pages, base path configuration in Vite, 404 client-side SPA fallback for GitHub Pages, comprehensive unit/integration test suite, and end-to-end build verification.

**Blocked by:** 03: Admin Management Page & Pass-List Gist Engine, 06: Bi-directional GitHub Projects V2 & Issues Synchronization, 07: Executive Landing Page Resume & Productivity Analytics

**Status:** ready-for-agent

- [ ] Configure `vite.config.ts` with relative base path (`base: './'`) for flawless GitHub Pages hosting
- [ ] Implement client-side routing with hash router or SPA 404 fallback for GitHub Pages
- [ ] Create `.github/workflows/deploy.yml` with automated GitHub Pages static artifact publishing
- [ ] Configure Vitest / Testing Library for unit testing core domain stores and sync logic
- [ ] Run full build verification (`npm run build` and `npm test`) ensuring 0 lint/type/build errors
- [ ] Merge all feature worktrees into `main`, verify git status, and generate documentation
