export interface Project {
  id: string;
  name: string;
  investor: string;
  total_value: number;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
}

export interface WBSItem {
  id: string;
  project_id: string;
  name: string;
  parent_id: string | null;
  children?: WBSItem[];
  created_at: string;
  level: number;
}

export interface WBSTree {
  [key: string]: WBSItem;
}

export type NavigationItem = 'overview' | 'projects' | 'wbs' | 'costs' | 'debts' | 'reports';
