# Construction ERP - Project Management System

A professional, production-ready project management page for construction companies built with **Next.js 16** and **Tailwind CSS 4**.

## 🎯 Overview

This is a complete ERP project management system featuring:
- Real-time project statistics and KPI cards
- Advanced filtering and search
- Professional data table with pagination
- Dark theme UI (Dark Enterprise Design)
- LocalStorage data persistence
- Fully responsive design

## 📁 Folder Structure

```
app/
├── layout.tsx                    # Root layout with sidebar
├── page.tsx                      # Main home page (entry point)
├── globals.css                   # Global styles & theme
│
├── projects.tsx                  # Main Projects page component
├── project.service.ts            # Data service with localStorage
├── utils.ts                      # Utility functions (formatting, dates)
│
├── Sidebar.tsx                   # Navigation sidebar (left)
├── ProjectHeader.tsx             # Header with search & date picker (top)
├── ProjectStats.tsx              # KPI cards (5 summary cards)
├── ProjectFilters.tsx            # Advanced filter bar
├── ProjectTable.tsx              # Main data table
├── ProjectRow.tsx                # Single row in table
├── ProjectPagination.tsx         # Pagination controls
│
└── favicon.ico                   # App icon
```

## 🎨 Design System

**Color Palette (Dark Enterprise Theme):**
- Background: `#020617` (Slate-950)
- Card: `#1e293b` (Slate-800)
- Border: `#334155` (Slate-700)
- Text Primary: `#e2e8f0` (Slate-200)
- Text Secondary: `#94a3b8` (Slate-400)
- Accent: Blue-600

## 📊 Component Architecture

### 1. **ProjectHeader** (`ProjectHeader.tsx`)
Top navigation with:
- Search input for projects
- Date picker
- User avatar
- Notification bell

### 2. **ProjectStats** (`ProjectStats.tsx`)
5 KPI cards displaying:
- Tổng số dự án (Total Projects)
- Đang thi công (Active)
- Hoàn thành (Completed)
- Tạm dừng (Paused)
- Tổng giá trị hợp đồng (Total Contract Value)

Features:
- Gradient backgrounds
- Hover animations
- Trend indicators

### 3. **ProjectFilters** (`ProjectFilters.tsx`)
Advanced filter bar with:
- Search by name/code
- Status dropdown filter
- Investor filter
- Project type filter
- Date range (start/end date)
- Action buttons (Add Project, Export Excel)

### 4. **ProjectTable** (`ProjectTable.tsx`)
Professional data table with columns:
1. # (Row number)
2. Dự án (Project name + code + image thumbnail)
3. Chủ đầu tư (Investor)
4. Loại dự án (Project Type)
5. Giá trị hợp đồng (Contract Value)
6. Ngày bắt đầu (Start Date)
7. Ngày kết thúc (End Date)
8. Trạng thái (Status - color-coded badges)
9. Tiến độ (Progress bar with percentage)
10. Thao tác (Actions - View, Edit, More menu)

### 5. **ProjectRow** (`ProjectRow.tsx`)
Single table row component with:
- Project image thumbnail
- Status badge styling (Green/Blue/Yellow)
- Progress bar with color coding
- Action buttons with hover dropdown

### 6. **ProjectPagination** (`ProjectPagination.tsx`)
Bottom pagination with:
- Page numbers with ellipsis
- Previous/Next buttons
- Items per page selector (10/20/50/100)
- Item range display

### 7. **Sidebar** (`Sidebar.tsx`)
Left navigation with:
- Logo & company name
- Menu items with icons
- Active state highlighting
- Logout button

## 💾 Data Service (`project.service.ts`)

**ProjectService Class** - Complete data management:
- `getAllProjects()` - Get all projects from localStorage
- `getProjectById(id)` - Get single project
- `createProject()` - Add new project
- `updateProject()` - Update project data
- `deleteProject()` - Delete project
- `getProjectStats()` - Get KPI statistics

**Project Interface:**
```typescript
interface Project {
  id: string;
  name: string;
  code: string;
  investor: string;
  projectType: string;
  totalValue: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  image: string;
}
```

**Mock Data:**
12 sample projects with realistic Vietnamese company names and data.

## 🛠 Utility Functions (`utils.ts`)

- `formatCurrency(value)` - Format Vietnamese Dong (VND) with compact notation
- `formatCurrencyFull(value)` - Full currency format
- `formatDate(dateString)` - Format dates in Vietnamese
- `calculateDaysRemaining(endDate)` - Calculate remaining days

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
Opens at `http://localhost:3000`

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

## ✨ Features

### ✅ Implemented
- [x] Sidebar navigation with menu items
- [x] Top header with search, date picker, user avatar
- [x] 5 KPI cards with statistics
- [x] Advanced filter bar (search, status, investor, type, date range)
- [x] Professional data table with 10 columns
- [x] Table row with status badges, progress bars, action buttons
- [x] Pagination with page numbers and items per page
- [x] Dark enterprise theme
- [x] Responsive design
- [x] LocalStorage data persistence
- [x] 12 sample projects with realistic data
- [x] Hover effects and animations
- [x] Filter functionality (works in real-time)
- [x] Project statistics calculation

### 🔄 Filtering
- **Search**: Filter by project name or code
- **Status**: Show active, completed, or paused projects
- **Investor**: Filter by investor name
- **Type**: Filter by project type
- **Date Range**: Filter by start and end dates

### 📱 Responsive
- Desktop: Full layout with sidebar + content
- Tablet: Optimized grid layout
- Mobile: Stacked components

## 📦 Dependencies

```json
{
  "next": "16.2.4",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

## 🎯 Production Ready

- ✅ No hardcoded data (using service layer)
- ✅ No backend dependency (localStorage only)
- ✅ Modular component architecture
- ✅ Clean, scalable code structure
- ✅ TypeScript for type safety
- ✅ Proper error handling
- ✅ No external UI libraries (pure Tailwind CSS)
- ✅ Optimized performance
- ✅ Accessibility considerations
- ✅ Semantic HTML

## 🎨 Theme Colors

| Element | Color | Hex |
|---------|-------|-----|
| Background | Slate-950 | #020617 |
| Card | Slate-800 | #1e293b |
| Border | Slate-700 | #334155 |
| Text Primary | Slate-200 | #e2e8f0 |
| Text Secondary | Slate-400 | #94a3b8 |
| Text Muted | Slate-600 | #64748b |

## 📝 File Paths Reference

| File | Path |
|------|------|
| Main Layout | `app/layout.tsx` |
| Home Page | `app/page.tsx` |
| Projects Page | `app/projects.tsx` |
| Project Service | `app/project.service.ts` |
| Utilities | `app/utils.ts` |
| Sidebar | `app/Sidebar.tsx` |
| Header | `app/ProjectHeader.tsx` |
| Stats | `app/ProjectStats.tsx` |
| Filters | `app/ProjectFilters.tsx` |
| Table | `app/ProjectTable.tsx` |
| Table Row | `app/ProjectRow.tsx` |
| Pagination | `app/ProjectPagination.tsx` |
| Styles | `app/globals.css` |

## 🔧 Customization

### Adding New Projects
```typescript
const newProject = ProjectService.createProject({
  name: 'New Project',
  code: 'PRJ-2024-013',
  investor: 'Company Name',
  projectType: 'Type',
  totalValue: 1000000000,
  startDate: '2024-01-01',
  endDate: '2025-01-01',
  status: 'active',
  progress: 0,
  image: 'https://...'
});
```

### Modifying Colors
Update color values in component files or `globals.css`:
- Background: Change `#020617` to your color
- Cards: Change `#1e293b` to your color
- Borders: Change `#334155` to your color

## 📊 Sample Data

The system includes 12 sample projects:
1. Cao ốc văn phòng ABC
2. Khu căn hộ Sunrise City
3. Nhà máy sản xuất XYZ
4. Trường học tiêu chuẩn DEF
5. Trung tâm thương mại Grí
6. Khu nghỉ dưỡng Paradise
7. Nhà xưởng sản xuất 2
8. Khu đô thị Green Park
9. Bệnh viện đa khoa HLK
10. Cầu dân chung cư LMN
11. Cơ sở sản xuất nước
12. Tòa nhà biểu tượng

Each project includes:
- Project name and code
- Investor information
- Project type
- Contract value
- Start/end dates
- Current status
- Progress percentage
- Project image

## 🚀 Ready to Deploy

This project is production-ready and can be:
- Deployed to Vercel (recommended for Next.js)
- Deployed to any Node.js hosting
- Integrated with a backend API
- Extended with additional features

## 📄 License

Professional Construction ERP System

---

**Built with:** Next.js 16 • React 19 • Tailwind CSS 4 • TypeScript 5
