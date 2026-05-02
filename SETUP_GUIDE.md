# BuildERP Construction Management System - Setup & Installation Guide

## 📋 Overview

This is a **production-ready construction ERP system** built with Next.js 16 + React 19 + TypeScript + Tailwind CSS. It uses localStorage for Phase 1 data storage with architecture designed for easy database migration.

## ⚡ Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Directory Structure
```bash
npm run setup
```
This will create the necessary Next.js route directories.

### Step 3: Start Development Server
```bash
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## 📁 Complete File Structure

```
construction-erp/
│
├── 📄 Root Configuration Files
│   ├── package.json                 # Dependencies & scripts
│   ├── package-lock.json           
│   ├── tsconfig.json               # TypeScript paths (important!)
│   ├── next.config.ts              # Next.js config
│   ├── tailwind.config.mjs          # Tailwind CSS config
│   ├── postcss.config.mjs           # PostCSS config
│   └── eslint.config.mjs           # ESLint config
│
├── 📄 Core Services (Root)
│   ├── types.ts                    # ✅ Type definitions
│   ├── services.projectService.ts  # ✅ Project CRUD operations
│   └── services.wbsService.ts      # ✅ WBS tree operations
│
├── 📁 app/ (Next.js App Router)
│   ├── layout.tsx                  # ✅ Root layout (dark theme)
│   ├── page.tsx                    # ✅ Home page (redirects to dashboard)
│   ├── globals.css                 # ✅ Global styles
│   ├── favicon.ico                 # ✅ Favicon
│   │
│   ├── 🧩 Shared Components (in app root)
│   ├── sidebar.tsx                 # ✅ Navigation sidebar
│   ├── dashboard-page.tsx          # ✅ Dashboard component
│   ├── projects-page.tsx           # ✅ Projects list component
│   ├── project-wbs-page.tsx        # ✅ Project WBS detail component
│   ├── wbs-page.tsx                # ✅ WBS hub component
│   ├── costs-page.tsx              # ✅ Costs placeholder
│   ├── debts-page.tsx              # ✅ Debts placeholder
│   ├── reports-page.tsx            # ✅ Reports placeholder
│   ├── projects-route.tsx          # ✅ Projects route adapter
│   ├── project-form.tsx            # ✅ Project creation modal
│   ├── wbs-form.tsx                # ✅ WBS item modal
│   └── wbs-tree.tsx                # ✅ WBS tree component
│   │
│   ├── 📁 (projects)/              # Route group
│   │   └── page.tsx                # Projects list page
│   │
│   ├── 📁 project/[id]/            # Dynamic project route
│   │   └── page.tsx                # Project WBS management
│   │
│   ├── 📁 wbs/
│   │   └── page.tsx                # WBS hub
│   │
│   ├── 📁 costs/
│   │   └── page.tsx                # Costs page
│   │
│   ├── 📁 debts/
│   │   └── page.tsx                # Debts page
│   │
│   └── 📁 reports/
│       └── page.tsx                # Reports page
│
├── 📁 public/
│   └── (static assets)
│
├── 📄 Documentation
├── README_IMPLEMENTATION.md        # ✅ Full implementation guide
├── FILE_ORGANIZATION.md            # ✅ Manual organization guide
├── SETUP_GUIDE.md                  # ✅ This file
└── setup-dirs.js                   # ✅ Automatic setup script
```

---

## 🔧 Automatic Setup (Recommended)

Run this command to automatically create all directories and route files:

```bash
npm run setup
```

This executes `setup-dirs.js` which:
1. Creates all required directories
2. Creates page.tsx files that import from components
3. Maintains clean import paths

---

## 🔍 File Details

### Core Services

#### `types.ts`
Defines TypeScript interfaces:
- `Project` - Project data structure
- `WBSItem` - Work breakdown structure item
- `NavigationItem` - Navigation menu type

#### `services.projectService.ts`
Project data management:
```typescript
projectService.getProjects()          // Get all projects
projectService.addProject(data)       // Create new project
projectService.getProject(id)         // Get single project
projectService.updateProject(id, data) // Update project
projectService.deleteProject(id)      // Delete project
```

#### `services.wbsService.ts`
WBS tree management:
```typescript
wbsService.getWBSItems(projectId)        // Get all items
wbsService.addWBSItem(projectId, name, parentId) // Add item
wbsService.getWBSTree(projectId)        // Get hierarchical tree
wbsService.updateWBSItem(projectId, id, data)
wbsService.deleteWBSItem(projectId, id) // Delete with children
```

### Components

#### `sidebar.tsx`
Navigation sidebar with 6 menu items:
- 📊 Tổng quan (Overview)
- 📁 Dự án (Projects)
- 🏗️ Hạng mục công trình (WBS)
- 💰 Chi phí (Costs)
- 📋 Công nợ (Debts)
- 📈 Báo cáo (Reports)

Features: Collapsible, responsive, active state tracking

#### `dashboard-page.tsx`
Overview dashboard with:
- Quick stat cards
- Getting started guide
- Project creation shortcut

#### `projects-page.tsx`
Project management:
- List all projects (grid view)
- Create new project modal
- Delete project with confirmation
- Project details card (investor, value, status, created date)

#### `project-wbs-page.tsx`
Project WBS management:
- Display WBS tree for selected project
- Add root items
- Add nested items
- Delete items (with children)
- Expand/collapse nodes

#### `wbs-tree.tsx`
Recursive tree component:
- Indented display based on depth
- Expand/collapse arrows
- Add child button (on hover)
- Delete button (on hover)
- Visual hierarchy

#### Modals

**project-form.tsx**: Create project with fields:
- Project name
- Investor name
- Total value (VND)
- Status (active/completed/archived)

**wbs-form.tsx**: Add WBS item with:
- Item name
- Parent item indication

---

## 🚀 Running the Application

### Development
```bash
npm run dev
```
Server runs on http://localhost:3000

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

---

## 📊 Features

### ✅ Implemented (Phase 1)

- [x] Project CRUD operations
- [x] WBS tree structure (unlimited nesting)
- [x] localStorage data persistence
- [x] Dark theme dashboard
- [x] Responsive design
- [x] TypeScript type safety
- [x] Service layer architecture
- [x] Modal forms
- [x] Tree expand/collapse
- [x] Vietnamese language UI

### 🎯 Future Features (Phase 2+)

- [ ] Budget management & tracking
- [ ] Actual vs planned cost analysis
- [ ] Revenue tracking
- [ ] Debt management
- [ ] Advanced reporting
- [ ] PDF/Excel export
- [ ] User authentication
- [ ] Supabase/Database integration
- [ ] Multi-user collaboration
- [ ] Project templates

---

## 🌐 Navigation Routes

After setup, access these routes:

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Overview & quick stats |
| `/projects` | Projects List | View all projects (route group) |
| `/project/[id]` | Project Detail | WBS management for project |
| `/wbs` | WBS Hub | WBS management center |
| `/costs` | Costs | Cost management (placeholder) |
| `/debts` | Debts | Debt management (placeholder) |
| `/reports` | Reports | Project reports (placeholder) |

---

## 💾 Data Storage

### localStorage Keys
```
construction-erp:projects          // Array of projects
construction-erp:wbs:{projectId}  // Array of WBS items for project
```

### Example Data
```typescript
// Project
{
  id: "proj-1234567890-abc123",
  name: "Office Building A",
  investor: "ABC Corporation",
  total_value: 50000000000,           // 50 billion VND
  status: "active",
  created_at: "2024-01-15T10:30:00Z"
}

// WBS Item
{
  id: "wbs-1234567890-abc456",
  project_id: "proj-1234567890-abc123",
  name: "Foundation",
  parent_id: null,                    // Root item
  level: 0,
  created_at: "2024-01-15T10:35:00Z"
}
```

---

## 🔄 Architecture: Database Migration

### Current Architecture (localStorage)
```
UI Components
    ↓
Service Layer (abstractation)
    ↓
localStorage
```

### To Migrate to Database (Supabase, etc.)
Only change the service implementation:
```
UI Components (UNCHANGED)
    ↓
Service Layer (REWRITE)
    ↓
Database / Supabase
```

**Benefits:**
- No UI changes needed
- Type-safe interface maintained
- Gradual migration possible
- Easy rollback

---

## 🛠 Troubleshooting

### "Cannot find module '@/types'"
- Verify tsconfig.json paths are correct
- Run `npm run setup` to create directories

### "localStorage is not defined"
- Error occurs during SSR (server-side rendering)
- Solution: Already handled with `typeof window` checks
- If issue persists, wrap components with `'use client'`

### Dark theme not applying
- Verify `app/globals.css` is imported in layout.tsx
- Check Tailwind config includes app directory
- Verify `dark` class is on `<html>` element

### "Module not found" errors
- Run `npm install` again
- Delete `.next` folder: `rm -rf .next`
- Run `npm run dev` again

---

## 📝 Code Examples

### Creating a Project Programmatically
```typescript
import { projectService } from '@/services.projectService';

const newProject = projectService.addProject({
  name: 'New Construction',
  investor: 'XYZ Company',
  total_value: 100000000000,
  status: 'active'
});

console.log(newProject.id); // Auto-generated ID
```

### Adding WBS Items
```typescript
import { wbsService } from '@/services.wbsService';

// Add root item
const root = wbsService.addWBSItem(projectId, 'Foundation', null);

// Add child item
const child = wbsService.addWBSItem(projectId, 'Pile Foundation', root.id);

// Get tree
const tree = wbsService.getWBSTree(projectId);
```

### Component Usage
```typescript
'use client';

import { wbsService } from '@/services.wbsService';
import WBSTree from './wbs-tree';

export default function MyComponent({ projectId }) {
  const tree = wbsService.getWBSTree(projectId);
  
  return (
    <WBSTree 
      items={tree}
      onAddChild={(parentId) => {/* ... */}}
      onDelete={(id) => {/* ... */}}
      projectId={projectId}
    />
  );
}
```

---

## 🎨 Styling System

### Color Scheme (Dark Theme)
- **Background**: `bg-slate-900` (darkest)
- **Sidebar**: `from-slate-900 to-slate-800` (gradient)
- **Cards**: `bg-slate-800` with `border-slate-700`
- **Accent**: `bg-blue-600` for primary actions
- **Success**: `text-green-400`
- **Error**: `bg-red-900`
- **Text**: `text-slate-300`, `text-slate-400`

### Responsive Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- Grid adapts: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

---

## 📚 Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.2.4 | App Router, Server Components |
| React | 19.2.4 | UI components |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Styling |
| Node.js | Latest | Runtime |

---

## 🔐 Security Notes

- **No sensitive data**: Phase 1 uses localStorage only
- **Server components**: App Router reduces client-side code
- **TypeScript strict mode**: Catches type errors early
- **CSP ready**: Can add Content Security Policy headers
- **No external APIs**: Phase 1 is fully local

For production with real data:
1. Add authentication layer
2. Implement encryption for sensitive fields
3. Use HTTPS
4. Add rate limiting
5. Implement audit logs

---

## 📞 Support & Documentation

- **Implementation Guide**: `README_IMPLEMENTATION.md`
- **File Organization**: `FILE_ORGANIZATION.md`
- **Main README**: `README.md`

---

## ✅ Ready to Use!

Your BuildERP system is now ready. Start the dev server and:

1. ✅ Create your first project
2. ✅ Add WBS items for work breakdown
3. ✅ Explore the dashboard
4. ✅ Test data persistence (refresh page, data stays!)

**Happy building!** 🏗️
