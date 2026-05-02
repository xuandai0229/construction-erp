# Manual File Organization for Next.js App Router

Due to technical constraints in the automated file creation, some directories need to be created manually. Here's the complete file structure and what to do:

## Step 1: Create Directory Structure

Create these directories in your project:
```
app/
  ├── (projects)/
  ├── project/
  │   └── [id]/
  └── (placeholder routes)/
```

## Step 2: File Organization

### Root Files (Already Created)
- `types.ts` - Type definitions
- `services.projectService.ts` - Project service
- `services.wbsService.ts` - WBS service
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `next.config.ts` - Next config
- `tailwind.config.mjs` - Tailwind config
- `postcss.config.mjs` - PostCSS config

### App Files Structure

Move/organize the files in `/app` as follows:

```
app/
├── layout.tsx ✅ (already in place)
├── page.tsx ✅ (already in place)
├── globals.css ✅ (already in place)
├── favicon.ico ✅ (already in place)
├── sidebar.tsx ✅ (navigation component)
├── project-form.tsx ✅ (modal component)
├── wbs-form.tsx ✅ (modal component)
├── wbs-tree.tsx ✅ (tree component)
│
├── (projects)/              # Route group - won't be in URL
│   └── page.tsx (copy of projects-page.tsx content)
│
├── project/
│   └── [id]/
│       └── page.tsx (copy of project-wbs-page.tsx content)
│
├── wbs/
│   └── page.tsx (copy of wbs-page.tsx content)
│
├── costs/
│   └── page.tsx (copy of costs-page.tsx content)
│
├── debts/
│   └── page.tsx (copy of debts-page.tsx content)
│
└── reports/
    └── page.tsx (copy of reports-page.tsx content)
```

## Step 3: Dashboard Navigation Links

Update the sidebar links to point to:
- `/` - Dashboard
- `/projects` - Projects list (route group)
- `/project/[id]` - Project WBS (dynamic)
- `/wbs` - WBS hub
- `/costs` - Costs
- `/debts` - Debts
- `/reports` - Reports

## Migration Path for Your Editor

Since we're using worktrees, you can:

1. Open this folder in your code editor
2. Create the missing directories manually
3. Move/rename the -page.tsx files to page.tsx inside the appropriate directories
4. Run `npm run dev` to start the dev server

The file content is already created - just needs proper file organization.

## Verification

After organizing files, run:
```bash
npm run dev
```

Then visit:
- http://localhost:3000 - Dashboard
- http://localhost:3000/projects - Projects
- http://localhost:3000/wbs - WBS Hub
- http://localhost:3000/costs - Costs
- http://localhost:3000/debts - Debts
- http://localhost:3000/reports - Reports

All data will be stored in localStorage and persist across page reloads!
