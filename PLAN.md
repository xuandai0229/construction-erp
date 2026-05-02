# Phase 1 Implementation Plan - Construction ERP

## Current State Analysis

The project has a basic Next.js setup with:
- Next.js 16 + App Router
- Tailwind CSS v4
- React 19
- TypeScript
- Basic project service (incomplete)

## What Needs to Be Built (Phase 1)

### 1. Type Definitions
- Create `/types/index.ts`
- Define Project interface with all required fields
- Define WBS interface with parent_id, children

### 2. Data Layer (Services)
- **Update project.service.ts** - Full CRUD operations
- **Create wbs.service.ts** - WBS tree operations
- Functions: getProjects, addProject, updateProject, deleteProject
- Functions: getWBS, addWBS, updateWBS, deleteWBS, buildTree

### 3. UI Components
- **Sidebar** - Navigation menu with dark theme
- **ProjectList** - Project listing with cards
- **WBS Tree** - Expandable/collapsible tree with indent
- **ProjectCard** - Individual project display

### 4. Pages
- **app/page.tsx** - Main dashboard with sidebar

### 5. Layout
- **app/layout.tsx** - With sidebar layout

## Implementation Order

1. Create types/index.ts
2. Update services/project.service.ts
3. Create services/wbs.service.ts  
4. Create components/Sidebar.tsx
5. Create components/ProjectList.tsx
6. Create components/WBSTree.tsx
7. Update app/layout.tsx
8. Update app/page.tsx
9. Update app/globals.css for dark theme

## File Structure After Implementation

```
app/
├── globals.css
├── layout.tsx
├── page.tsx
├── components/
│   ├── Sidebar.tsx
│   ├── ProjectList.tsx
│   └── WBSTree.tsx
├── types/
│   └── index.ts
├── services/
│   ├── project.service.ts
│   └── wbs.service.ts
```

## Key Features

- Project CRUD with fields: id, name, investor, total_value, status, created_at
- WBS Tree with parent_id support (unlimited nesting)
- Expand/collapse tree nodes
- Add child WBS to any node
- Dark theme ERP-style UI
- localStorage for data persistence
- Architecture ready for Supabase switch
