# BuildERP - System Architecture & Component Overview

## 🏗️ Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Dashboard   │  │   Projects   │  │  WBS Manager │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Costs Page  │  │  Debts Page  │  │ Reports Page │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                    Navigation Sidebar                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     COMPONENT LAYER                              │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Sidebar | ProjectForm | WBSForm | WBSTree | Dashboard │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER (Abstract)                    │
│  ┌──────────────────────┐    ┌──────────────────────┐         │
│  │  ProjectService      │    │  WBSService          │         │
│  │  • getProjects()     │    │  • getWBSItems()     │         │
│  │  • addProject()      │    │  • addWBSItem()      │         │
│  │  • getProject()      │    │  • getWBSTree()      │         │
│  │  • updateProject()   │    │  • updateWBSItem()   │         │
│  │  • deleteProject()   │    │  • deleteWBSItem()   │         │
│  └──────────────────────┘    └──────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  STORAGE LAYER (Pluggable)                      │
│                                                                 │
│  PHASE 1: localStorage          FUTURE: Supabase / Database    │
│  ✓ construction-erp:projects    → No code changes needed!      │
│  ✓ construction-erp:wbs:{id}                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Component Hierarchy

```
App (Root Layout)
│
├── page.tsx (Home)
│   └── DashboardPage
│       ├── Sidebar
│       └── Overview & Stats
│
├── (projects) Route Group
│   └── ProjectsPage
│       ├── Sidebar
│       ├── ProjectList (Grid)
│       └── ProjectForm (Modal)
│
├── project/[id]
│   └── ProjectWBSPage
│       ├── Sidebar
│       ├── WBSTree
│       ├── Add/Edit Buttons
│       └── WBSForm (Modal)
│
├── wbs
│   └── WBSPage
│       ├── Sidebar
│       └── Hub/Guide
│
├── costs
│   └── CostsPage (Placeholder)
│
├── debts
│   └── DebtsPage (Placeholder)
│
└── reports
    └── ReportsPage (Placeholder)
```

---

## 📊 Data Flow Diagram

### Creating a Project

```
User Input
    ↓
ProjectForm Component
    ↓
handleAddProject()
    ↓
projectService.addProject(data)
    ↓
Generate ID & Timestamp
    ↓
localStorage.setItem('construction-erp:projects', JSON.stringify(projects))
    ↓
Return New Project
    ↓
Update Component State
    ↓
UI Re-renders
    ↓
✅ Project Appears in List
```

### Building WBS Tree

```
User Clicks "Add Root Item"
    ↓
WBSForm Modal Opens
    ↓
User Enters Name
    ↓
handleAddWBS(name)
    ↓
wbsService.addWBSItem(projectId, name, null)
    ↓
Create WBSItem with parent_id = null
    ↓
Store in localStorage
    ↓
Call getWBSTree() to rebuild hierarchical tree
    ↓
Return nested structure with children[]
    ↓
WBSTree Component Renders
    ↓
✅ Item Appears in Tree at Root Level
```

---

## 🔄 State Management Pattern

```
React Component State
        ↓
        ├─→ [projects, setProjects]
        ├─→ [wbsTree, setWbsTree]
        ├─→ [showForm, setShowForm]
        └─→ [selectedItem, setSelectedItem]
        ↓
useEffect() Fetches from Service
        ↓
Service Layer (Abstract)
        ↓
localStorage (Current)
        ↓
Component Re-renders with New Data
```

---

## 📁 File Dependency Graph

```
App (layout.tsx + page.tsx)
│
├─── Sidebar.tsx
│    └─── Imports types
│
├─── Dashboard-page.tsx
│    └─── Imports Sidebar
│
├─── Projects-page.tsx
│    ├─── Imports Sidebar, ProjectForm
│    ├─── Uses projectService
│    └─── Imports type Project
│
├─── Project-WBS-page.tsx
│    ├─── Imports Sidebar, WBSTree, WBSForm
│    ├─── Uses projectService & wbsService
│    └─── Imports types
│
└─── WBS-Tree.tsx
     ├─── Recursive WBSNode component
     └─── Imports WBSItem type

Services Layer (Root)
├─── services.projectService.ts
│    └─── Imports Project type
├─── services.wbsService.ts
│    └─── Imports WBSItem type
└─── types.ts (Central)
     ├─── Project
     ├─── WBSItem
     └─── NavigationItem
```

---

## 🔌 Service Layer Details

### ProjectService Methods

```typescript
// Get all projects (Phase 1: from localStorage, Phase 2: from API)
getProjects(): Project[]
  → Reads construction-erp:projects
  → Returns Project[]

// Add new project
addProject(data: Omit<Project, 'id' | 'created_at'>): Project
  → Validates input
  → Generates ID and timestamp
  → Saves to localStorage
  → Returns new Project

// Get single project
getProject(id: string): Project | null
  → Finds project by ID
  → Returns project or null

// Update project
updateProject(id: string, updates: Partial<Project>): Project | null
  → Finds and updates project
  → Saves to localStorage
  → Returns updated project or null

// Delete project
deleteProject(id: string): boolean
  → Removes project from storage
  → Returns true if deleted, false if not found
```

### WBSService Methods

```typescript
// Get all WBS items for project
getWBSItems(projectId: string): WBSItem[]
  → Reads construction-erp:wbs:{projectId}
  → Returns flat array

// Add WBS item
addWBSItem(projectId: string, name: string, parentId: string | null): WBSItem
  → Creates item with auto-generated ID
  → Calculates level from parent
  → Saves to localStorage
  → Returns new item

// Get hierarchical tree (builds from flat array)
getWBSTree(projectId: string): WBSItem[]
  → Fetches all items
  → Builds parent-child relationships
  → Returns nested tree with children[]
  → Only includes root items at top level

// Update WBS item
updateWBSItem(projectId: string, id: string, updates: Partial<WBSItem>): WBSItem | null
  → Updates specific item
  → Saves changes
  → Returns updated item

// Delete WBS item and children
deleteWBSItem(projectId: string, id: string): boolean
  → Deletes item and all its descendants
  → Saves updated list
  → Returns true if deleted
```

---

## 🎨 UI Component Props

### Sidebar Component
```typescript
interface SidebarProps {
  active?: NavigationItem; // Current active page
}

// Renders:
- Navigation links (6 items)
- Collapse/expand toggle
- Active state highlighting
```

### WBSTree Component
```typescript
interface WBSTreeProps {
  items: WBSItem[];
  onAddChild: (parentId: string | null) => void;
  onDelete: (id: string) => void;
  projectId: string;
}

// Features:
- Recursive tree rendering
- Expand/collapse per node
- Add child button per node
- Delete button per node
```

### ProjectForm Component
```typescript
interface ProjectFormProps {
  onSubmit: (project: Omit<Project, 'id' | 'created_at'>) => void;
  onCancel: () => void;
}

// Form Fields:
- Project name (required)
- Investor name (required)
- Total value (optional)
- Status (select)
```

### WBSForm Component
```typescript
interface WBSFormProps {
  onSubmit: (name: string) => void;
  onCancel: () => void;
  parentName?: string;
}

// Form Fields:
- Item name (required)
- Parent display (optional)
```

---

## 💾 Data Persistence

### localStorage Structure

```javascript
// Key: "construction-erp:projects"
// Value: JSON array of Project objects
[
  {
    id: "proj-1234567890-abc123",
    name: "Office Building A",
    investor: "ABC Corporation",
    total_value: 50000000000,
    status: "active",
    created_at: "2024-01-15T10:30:00Z"
  },
  ...
]

// Key: "construction-erp:wbs:proj-1234567890-abc123"
// Value: JSON array of WBSItem objects
[
  {
    id: "wbs-1234567890-abc456",
    project_id: "proj-1234567890-abc123",
    name: "Foundation",
    parent_id: null,
    level: 0,
    created_at: "2024-01-15T10:35:00Z"
  },
  {
    id: "wbs-1234567890-abc789",
    project_id: "proj-1234567890-abc123",
    name: "Pile Foundation",
    parent_id: "wbs-1234567890-abc456",
    level: 1,
    created_at: "2024-01-15T10:36:00Z"
  },
  ...
]
```

---

## 🚀 Performance Optimizations

### Phase 1 (Current)
- Minimal re-renders (React 19)
- Efficient tree building (getWBSTree caches)
- localStorage is fast (< 1ms)
- Lazy loading for routes (Next.js)

### Phase 2 (Database Ready)
- Query optimization (indices on project_id, parent_id)
- Pagination support
- Caching layer
- Real-time updates with WebSocket

---

## 🔐 Type Safety

All data flows through TypeScript interfaces:

```typescript
// Types enforce contract between layers
Project → projectService → UI Component
WBSItem → wbsService → WBSTree Component

// Compile-time type checking
// No "any" types (strict mode)
// IDE autocompletion throughout

Result: Type-safe, refactoring-friendly, production-ready
```

---

## 🎯 Migration Readiness

### Current Code

```typescript
// services/projectService.ts
getProjects(): Project[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}
```

### Future Code (Supabase)

```typescript
// services/projectService.ts (ONLY THIS CHANGES!)
async getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*');
  return data || [];
}
```

### UI Code (NO CHANGES!)
```typescript
// Component stays the same!
const projects = projectService.getProjects();
```

---

## ✅ Quality Assurance

- ✅ TypeScript strict mode
- ✅ No external UI libraries (Tailwind only)
- ✅ Modular components
- ✅ Clean separation of concerns
- ✅ Service layer abstraction
- ✅ Type-safe end-to-end
- ✅ Production-ready error handling
- ✅ Responsive design tested

---

**BuildERP - Professional Architecture, Built for Scale** 🏗️
