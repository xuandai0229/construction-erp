# 💻 Code Examples & Implementation Guide

## 1. Using the Data Service

### Initialize Data
```typescript
import { ProjectService } from '@/app/project.service';

// On app load
ProjectService.initializeData();

// Get all projects
const projects = ProjectService.getAllProjects();
console.log(projects);
```

### Get Single Project
```typescript
const project = ProjectService.getProjectById('1');
if (project) {
  console.log(project.name); // "Cao ốc văn phòng ABC"
}
```

### Create New Project
```typescript
const newProject = ProjectService.createProject({
  name: 'Tòa nhà thương mại Landmark',
  code: 'PRJ-2024-013',
  investor: 'Công ty CP Xây dựng HCM',
  projectType: 'Tòa nhà thương mại',
  totalValue: 250000000000,
  startDate: '2024-07-01',
  endDate: '2026-07-01',
  status: 'active',
  progress: 0,
  image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=300&fit=crop'
});

console.log(newProject.id); // Generated ID
```

### Update Project
```typescript
ProjectService.updateProject('1', {
  progress: 75,
  status: 'active'
});
```

### Delete Project
```typescript
const deleted = ProjectService.deleteProject('1');
if (deleted) {
  console.log('Project deleted successfully');
}
```

### Get Statistics
```typescript
const stats = ProjectService.getProjectStats();
console.log(stats);
// Output:
// {
//   totalProjects: 12,
//   activeProjects: 8,
//   completedProjects: 2,
//   pausedProjects: 1,
//   totalValue: 1295000000000
// }
```

---

## 2. Component Examples

### Using ProjectFilters
```typescript
import ProjectFilters from '@/app/ProjectFilters';

export default function MyComponent() {
  const handleSearchChange = (value: string) => {
    console.log('Search:', value);
    // Apply search filter
  };

  const handleStatusChange = (value: string) => {
    console.log('Status:', value);
    // Filter by status
  };

  return (
    <ProjectFilters
      onSearchChange={handleSearchChange}
      onStatusChange={handleStatusChange}
      onInvestorChange={(v) => console.log('Investor:', v)}
      onTypeChange={(v) => console.log('Type:', v)}
      onDateRangeChange={(start, end) => 
        console.log('Date range:', start, end)
      }
    />
  );
}
```

### Using ProjectStats
```typescript
import ProjectStats from '@/app/ProjectStats';

const stats = {
  totalProjects: 12,
  activeProjects: 8,
  completedProjects: 2,
  pausedProjects: 1,
  totalValue: 1295000000000
};

export default function Dashboard() {
  return <ProjectStats stats={stats} />;
}
```

### Using ProjectPagination
```typescript
import ProjectPagination from '@/app/ProjectPagination';
import { useState } from 'react';

export default function MyTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalItems = 150;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <ProjectPagination
      currentPage={currentPage}
      totalPages={totalPages}
      itemsPerPage={itemsPerPage}
      totalItems={totalItems}
      onPageChange={setCurrentPage}
      onItemsPerPageChange={setItemsPerPage}
    />
  );
}
```

---

## 3. Utility Functions

### Format Currency
```typescript
import { formatCurrency, formatCurrencyFull } from '@/app/utils';

const value = 50000000000;

console.log(formatCurrency(value));        // "50B VND"
console.log(formatCurrencyFull(value));    // "50,000,000,000₫"
```

### Format Date
```typescript
import { formatDate } from '@/app/utils';

const dateString = '2024-01-15';
console.log(formatDate(dateString));  // "15/01/2024"
```

### Calculate Days Remaining
```typescript
import { calculateDaysRemaining } from '@/app/utils';

const endDate = '2025-12-31';
const daysLeft = calculateDaysRemaining(endDate);
console.log(daysLeft);  // Number of days until end date
```

---

## 4. Filter Implementation Examples

### Real-time Search Filter
```typescript
const [searchTerm, setSearchTerm] = useState('');

useEffect(() => {
  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );
  setFilteredProjects(filtered);
}, [searchTerm, projects]);
```

### Status Filter
```typescript
const [statusFilter, setStatusFilter] = useState('');

useEffect(() => {
  let filtered = projects;
  
  if (statusFilter) {
    filtered = filtered.filter(p => p.status === statusFilter);
  }
  
  setFilteredProjects(filtered);
}, [statusFilter, projects]);
```

### Date Range Filter
```typescript
const [dateRange, setDateRange] = useState({ start: '', end: '' });

useEffect(() => {
  let filtered = projects;
  
  if (dateRange.start) {
    filtered = filtered.filter(p => 
      new Date(p.startDate) >= new Date(dateRange.start)
    );
  }
  
  if (dateRange.end) {
    filtered = filtered.filter(p => 
      new Date(p.endDate) <= new Date(dateRange.end)
    );
  }
  
  setFilteredProjects(filtered);
}, [dateRange, projects]);
```

### Combined Filters
```typescript
useEffect(() => {
  let filtered = projects;

  // Search
  if (searchTerm) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Status
  if (statusFilter) {
    filtered = filtered.filter(p => p.status === statusFilter);
  }

  // Investor
  if (investorFilter) {
    filtered = filtered.filter(p =>
      p.investor.toLowerCase().includes(investorFilter.toLowerCase())
    );
  }

  // Type
  if (typeFilter) {
    filtered = filtered.filter(p =>
      p.projectType.toLowerCase().includes(typeFilter.toLowerCase())
    );
  }

  // Date Range
  if (dateRange.start) {
    filtered = filtered.filter(p =>
      new Date(p.startDate) >= new Date(dateRange.start)
    );
  }
  if (dateRange.end) {
    filtered = filtered.filter(p =>
      new Date(p.endDate) <= new Date(dateRange.end)
    );
  }

  setFilteredProjects(filtered);
  setCurrentPage(1);
}, [
  projects,
  searchTerm,
  statusFilter,
  investorFilter,
  typeFilter,
  dateRange
]);
```

---

## 5. Pagination Logic

### Calculate Visible Items
```typescript
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const visibleItems = filteredProjects.slice(startIndex, endIndex);
```

### Calculate Total Pages
```typescript
const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
```

### Generate Page Numbers
```typescript
const getPageNumbers = () => {
  const pages: (number | string)[] = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage <= 3) {
      for (let i = 1; i <= maxVisible; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    }
  }

  return pages;
};
```

---

## 6. Type Definitions

### Project Interface
```typescript
interface Project {
  id: string;                                    // Unique ID
  name: string;                                  // Project name
  code: string;                                  // Project code
  investor: string;                              // Investor company
  projectType: string;                           // Type of project
  totalValue: number;                            // Contract value
  startDate: string;                             // ISO format date
  endDate: string;                               // ISO format date
  status: 'active' | 'completed' | 'paused';    // Project status
  progress: number;                              // 0-100 percentage
  image: string;                                 // Image URL
}
```

### Filter State
```typescript
interface FilterState {
  searchTerm: string;
  statusFilter: string;
  investorFilter: string;
  typeFilter: string;
  dateRange: {
    start: string;
    end: string;
  };
}
```

### Stats Data
```typescript
interface StatsData {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  pausedProjects: number;
  totalValue: number;
}
```

---

## 7. Status Badge Logic

```typescript
const getStatusBadge = (status: string) => {
  const statusMap = {
    active: {
      bg: 'bg-emerald-950/50 border border-emerald-700/50',
      text: 'text-emerald-300',
      label: 'Đang thi công'
    },
    completed: {
      bg: 'bg-blue-950/50 border border-blue-700/50',
      text: 'text-blue-300',
      label: 'Hoàn thành'
    },
    paused: {
      bg: 'bg-amber-950/50 border border-amber-700/50',
      text: 'text-amber-300',
      label: 'Tạm dừng'
    }
  };

  const config = statusMap[status] || statusMap.active;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};
```

---

## 8. Progress Bar Color Logic

```typescript
const getProgressColor = (progress: number) => {
  if (progress >= 75) return 'bg-emerald-500';      // Green
  if (progress >= 50) return 'bg-blue-500';         // Blue
  if (progress >= 25) return 'bg-amber-500';        // Orange
  return 'bg-red-500';                              // Red
};

// Usage
<div className={`h-full transition-all duration-300 ${getProgressColor(project.progress)}`}
     style={{ width: `${project.progress}%` }}>
</div>
```

---

## 9. Complete useEffect Example

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Project, ProjectService } from '@/app/project.service';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [investorFilter, setInvestorFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Load data on mount
  useEffect(() => {
    ProjectService.initializeData();
    const data = ProjectService.getAllProjects();
    setProjects(data);
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = projects;

    // Apply all filters...
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // ... more filters

    setFilteredProjects(filtered);
    setCurrentPage(1); // Reset to page 1
  }, [projects, searchTerm, statusFilter, investorFilter, typeFilter, dateRange]);

  return (
    <div>
      {/* UI components */}
    </div>
  );
}
```

---

## 10. Common Patterns

### Add/Edit Project Modal
```typescript
// Not implemented in current version
// Add this to create a modal for adding/editing projects

const [showModal, setShowModal] = useState(false);
const [formData, setFormData] = useState<Omit<Project, 'id'>>({
  name: '',
  code: '',
  investor: '',
  projectType: '',
  totalValue: 0,
  startDate: '',
  endDate: '',
  status: 'active',
  progress: 0,
  image: ''
});

const handleAddProject = () => {
  const newProject = ProjectService.createProject(formData);
  setProjects([...projects, newProject]);
  setShowModal(false);
};
```

### Export to CSV
```typescript
// Export projects to CSV format

const exportToCSV = () => {
  const headers = ['ID', 'Name', 'Code', 'Investor', 'Status', 'Progress'];
  const rows = filteredProjects.map(p => [
    p.id,
    p.name,
    p.code,
    p.investor,
    p.status,
    `${p.progress}%`
  ]);

  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'projects.csv';
  a.click();
};
```

### Sorting
```typescript
// Sort projects by a field

const sortBy = (field: keyof Project, order: 'asc' | 'desc') => {
  const sorted = [...filteredProjects].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });

  setFilteredProjects(sorted);
};
```

---

## 📝 Implementation Checklist

- [ ] Clone/download the project
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Test in browser
- [ ] Customize colors if needed
- [ ] Add/edit projects via console
- [ ] Export data for backup
- [ ] Deploy to Vercel or hosting

---

**Happy coding!** 🚀
