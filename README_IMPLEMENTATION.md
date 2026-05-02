# BuildERP - Construction Project Management System

## Overview

A professional construction project management system (ERP-style) focused on accounting and project cost control. Built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

## Features (Phase 1)

### ✅ Implemented
- **Project Management**: Create, list, and manage projects with investor details and budget tracking
- **WBS (Work Breakdown Structure)**: Unlimited hierarchical nesting of work items
  - Add root WBS items
  - Add nested child items
  - Expand/collapse tree nodes
  - Delete items with children
- **Dark Dashboard**: Professional ERP-style dark theme interface
- **Responsive Sidebar**: Navigation with collapsible menu
- **localStorage Storage**: Persistent data in browser storage
- **Production-Ready Architecture**: Service layer designed for easy database migration

### 🎯 Architecture

#### Type System (`types.ts`)
```typescript
- Project: id, name, investor, total_value, status, created_at
- WBSItem: id, project_id, name, parent_id, children[], level, created_at
- NavigationItem: type for sidebar menu items
```

#### Service Layer
- **ProjectService** (`services.projectService.ts`)
  - getProjects()
  - addProject()
  - getProject(id)
  - updateProject(id, updates)
  - deleteProject(id)

- **WBSService** (`services.wbsService.ts`)
  - getWBSItems(projectId)
  - addWBSItem(projectId, name, parentId)
  - updateWBSItem(projectId, id, updates)
  - deleteWBSItem(projectId, id)
  - getWBSTree(projectId) - builds hierarchical tree

#### Components
- **Sidebar**: Collapsible navigation with 6 main sections
- **ProjectForm**: Modal form for creating projects
- **WBSForm**: Modal form for adding WBS items
- **WBSTree**: Recursive tree component with expand/collapse
- **ProjectList**: Grid display of all projects
- **Dashboard**: Overview page with quick stats

#### Pages
- `/` - Dashboard (Overview)
- `/projects-page` - Projects list
- `/project/[id]` - Project WBS management
- `/wbs-page` - WBS management hub
- `/costs-page` - Costs (placeholder)
- `/debts-page` - Debts (placeholder)
- `/reports-page` - Reports (placeholder)

## localStorage Structure

```
construction-erp:projects -> Project[]
construction-erp:wbs:{projectId} -> WBSItem[]
```

## File Organization

```
app/
├── layout.tsx              # Root layout with dark theme
├── page.tsx                # Home (redirects to Dashboard)
├── globals.css             # Tailwind CSS setup
├── sidebar.tsx             # Navigation component
├── dashboard-page.tsx      # Dashboard component
├── projects-page.tsx       # Projects list component
├── project-wbs-page.tsx    # Project WBS management component
├── wbs-page.tsx            # WBS hub component
├── costs-page.tsx          # Costs placeholder
├── debts-page.tsx          # Debts placeholder
├── reports-page.tsx        # Reports placeholder
├── project-form.tsx        # Project creation modal
├── wbs-form.tsx            # WBS item creation modal
└── wbs-tree.tsx            # WBS tree display component

/services.projectService.ts  # Project data service
/services.wbsService.ts      # WBS data service
/types.ts                    # TypeScript type definitions

/tsconfig.json               # TypeScript config with path aliases
/package.json                # Dependencies
/tailwind.config.mjs         # Tailwind configuration
/postcss.config.mjs          # PostCSS configuration
```

## How to Run

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open in browser**
   ```
   http://localhost:3000
   ```

4. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## Usage

### Creating a Project
1. Navigate to "Dự án" (Projects) from the sidebar
2. Click "+ New Project"
3. Fill in project details (name, investor, total value, status)
4. Click "Create Project"

### Managing WBS
1. Click on a project card to enter project detail
2. Click "+ Add Root Item" to add top-level WBS item
3. Click "+" button on any item to add child
4. Use "×" button to delete items
5. Click expand/collapse arrow to toggle visibility

### UI Features
- **Dark Theme**: Slate/blue color scheme for reduced eye strain
- **Collapsible Sidebar**: Toggle with arrow button to maximize workspace
- **Responsive Grid**: Projects grid adapts to screen size
- **Tree Indentation**: WBS items show hierarchy with indentation
- **Hover Actions**: Action buttons appear on hover for clean interface

## Architecture: Database Migration Strategy

### Current (localStorage)
```typescript
// Service layer abstracts storage
const projectService.getProjects() // reads from localStorage
```

### Future (Supabase/Database)
```typescript
// Only change service implementation - UI stays the same!
const projectService.getProjects() // reads from Supabase
```

### Key Design Principles
1. **Service Layer Abstraction**: All data operations go through services
2. **Type Safety**: Strong TypeScript types for all data
3. **No UI Dependency on Storage**: Components only call service methods
4. **Async-Ready**: Services use patterns compatible with API calls
5. **Separation of Concerns**: Components never touch localStorage directly

## Phase 2 Plan (Future)

- [ ] Budget & Cost tracking
- [ ] Actual cost vs planned cost analysis
- [ ] Revenue tracking
- [ ] Debt management
- [ ] Advanced reporting & analytics
- [ ] User authentication
- [ ] Multi-user collaboration
- [ ] Supabase/Database integration
- [ ] Export to PDF/Excel
- [ ] Project templates

## Technology Stack

- **Framework**: Next.js 16.2.4 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19.2.4
- **Styling**: Tailwind CSS 4
- **Storage**: Browser localStorage (Phase 1)
- **Icons**: Unicode emoji (lightweight)

## Code Quality

- ✅ TypeScript strict mode
- ✅ No external UI libraries (components built with Tailwind)
- ✅ Modular component structure
- ✅ Service layer pattern
- ✅ Clean separation of concerns
- ✅ Production-ready configuration

## Browser Support

- Chrome/Edge: Latest
- Firefox: Latest
- Safari: Latest
- Requires JavaScript enabled

## Notes

- **Data Persistence**: Data stored in localStorage persists across browser sessions
- **Single Device**: localStorage is per-browser, not synced across devices
- **Storage Limit**: Browser localStorage typically has 5-10MB limit
- **Production Ready**: Service architecture allows seamless database migration

## License

Private - Construction ERP System
