export interface Project {
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

const STORAGE_KEY = 'erp_projects';

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Cao ốc văn phòng ABC',
    code: 'PRJ-2024-001',
    investor: 'Công ty TNHH ABC',
    projectType: 'Cao ốc văn phòng',
    totalValue: 50000000000,
    startDate: '2024-01-01',
    endDate: '2025-03-31',
    status: 'active',
    progress: 56,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    name: 'Khu căn hộ Sunrise City',
    code: 'PRJ-2024-002',
    investor: 'Công ty CP Đầu tư Sunrise',
    projectType: 'Khu căn hộ',
    totalValue: 120000000000,
    startDate: '2024-05-15',
    endDate: '2026-05-15',
    status: 'active',
    progress: 32,
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    name: 'Nhà máy sản xuất XYZ',
    code: 'PRJ-2024-003',
    investor: 'Công ty TNHH XYZ',
    projectType: 'Nhà máy',
    totalValue: 80000000000,
    startDate: '2024-01-02',
    endDate: '2025-01-31',
    status: 'active',
    progress: 68,
    image: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400&h=300&fit=crop',
  },
  {
    id: '4',
    name: 'Trường học tiêu chuẩn DEF',
    code: 'PRJ-2024-004',
    investor: 'Sở Giáo dục & Đào tạo',
    projectType: 'Trường học',
    totalValue: 30000000000,
    startDate: '2024-10-01',
    endDate: '2025-10-01',
    status: 'completed',
    progress: 100,
    image: 'https://images.unsplash.com/photo-1427786033209-3b6a20e9b8c3?w=400&h=300&fit=crop',
  },
  {
    id: '5',
    name: 'Trung tâm thương mại Grí',
    code: 'PRJ-2024-005',
    investor: 'Công ty CP Thương mại Grí',
    projectType: 'Trung tâm TM',
    totalValue: 95000000000,
    startDate: '2024-02-20',
    endDate: '2026-02-20',
    status: 'active',
    progress: 25,
    image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=400&h=300&fit=crop',
  },
  {
    id: '6',
    name: 'Khu nghỉ dưỡng Paradise',
    code: 'PRJ-2024-006',
    investor: 'Công ty CP Du lịch Paradise',
    projectType: 'Khu nghỉ dưỡng',
    totalValue: 200000000000,
    startDate: '2023-01-06',
    endDate: '2025-01-06',
    status: 'paused',
    progress: 40,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
  },
  {
    id: '7',
    name: 'Nhà xưởng sản xuất 2',
    code: 'PRJ-2024-007',
    investor: 'Công ty TNHH Sản xuất 2',
    projectType: 'Nhà máy',
    totalValue: 60000000000,
    startDate: '2024-05-04',
    endDate: '2025-05-04',
    status: 'active',
    progress: 45,
    image: 'https://images.unsplash.com/photo-1582268611223-2d19cf7e1e4f?w=400&h=300&fit=crop',
  },
  {
    id: '8',
    name: 'Khu đô thị Green Park',
    code: 'PRJ-2024-008',
    investor: 'Công ty CP BDS Green',
    projectType: 'Khu đô thị',
    totalValue: 150000000000,
    startDate: '2023-01-03',
    endDate: '2026-01-03',
    status: 'active',
    progress: 18,
    image: 'https://images.unsplash.com/photo-1486428622519-e21cc028cb29?w=400&h=300&fit=crop',
  },
  {
    id: '9',
    name: 'Bệnh viện đa khoa HLK',
    code: 'PRJ-2024-009',
    investor: 'Sở Y tế',
    projectType: 'Bệnh viện',
    totalValue: 70000000000,
    startDate: '2024-12-01',
    endDate: '2025-12-01',
    status: 'completed',
    progress: 100,
    image: 'https://images.unsplash.com/photo-1512678854913-510b3d32f2ad?w=400&h=300&fit=crop',
  },
  {
    id: '10',
    name: 'Cầu dân chung cư LMN',
    code: 'PRJ-2024-010',
    investor: 'Ban quản lý chung cư LMN',
    projectType: 'Cầu tạo',
    totalValue: 15000000000,
    startDate: '2024-01-05',
    endDate: '2025-01-05',
    status: 'active',
    progress: 60,
    image: 'https://images.unsplash.com/photo-1494145904049-0dca7dc20726?w=400&h=300&fit=crop',
  },
  {
    id: '11',
    name: 'Cơ sở sản xuất nước',
    code: 'PRJ-2024-011',
    investor: 'Công ty CP Nước sạch',
    projectType: 'Nhà máy',
    totalValue: 45000000000,
    startDate: '2024-03-10',
    endDate: '2025-09-10',
    status: 'active',
    progress: 72,
    image: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400&h=300&fit=crop',
  },
  {
    id: '12',
    name: 'Tòa nhà biểu tượng',
    code: 'PRJ-2024-012',
    investor: 'Công ty CP Kiến trúc',
    projectType: 'Cao ốc VVIP',
    totalValue: 300000000000,
    startDate: '2024-06-15',
    endDate: '2027-12-15',
    status: 'active',
    progress: 15,
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=300&fit=crop',
  },
];

export class ProjectService {
  static initializeData(): void {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_PROJECTS));
    }
  }

  static getAllProjects(): Project[] {
    this.initializeData();
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : MOCK_PROJECTS;
  }

  static getProjectById(id: string): Project | undefined {
    const projects = this.getAllProjects();
    return projects.find((p) => p.id === id);
  }

  static createProject(project: Omit<Project, 'id'>): Project {
    const projects = this.getAllProjects();
    const newProject: Project = {
      ...project,
      id: Math.max(...projects.map((p) => parseInt(p.id)), 0) + 1 + '',
    };
    projects.push(newProject);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return newProject;
  }

  static updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const projects = this.getAllProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    projects[index] = { ...projects[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return projects[index];
  }

  static deleteProject(id: string): boolean {
    const projects = this.getAllProjects();
    const filtered = projects.filter((p) => p.id !== id);
    if (filtered.length === projects.length) return false;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }

  static getProjectStats() {
    const projects = this.getAllProjects();
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const completedProjects = projects.filter((p) => p.status === 'completed').length;
    const pausedProjects = projects.filter((p) => p.status === 'paused').length;
    const totalValue = projects.reduce((sum, p) => sum + p.totalValue, 0);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      pausedProjects,
      totalValue,
    };
  }
}
