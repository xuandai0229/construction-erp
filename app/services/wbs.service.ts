// ============================================
// WBS SERVICE - WORK BREAKDOWN STRUCTURE
// Tree structure with unlimited nesting
// Uses localStorage for temporary storage
// Architecture ready for Supabase switch
// ============================================

import { WBSItem, WBSTreeNode, WBSResponse } from '@/app/types';

// Storage key pattern: wbs_{project_id}
function getWBSKey(projectId: string): string {
  return `construction_erp_wbs_${projectId}`;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `wbs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all WBS items for a project (flat list)
 */
export function getWBS(projectId: string): WBSItem[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(getWBSKey(projectId));
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Add a new WBS item
 */
export function addWBS(
  projectId: string,
  name: string,
  parentId: string | null = null
): WBSResponse {
  try {
    const items = getWBS(projectId);

    const newItem: WBSItem = {
      id: generateId(),
      project_id: projectId,
      name,
      parent_id: parentId,
      children: [],
      created_at: new Date().toISOString(),
    };

    items.push(newItem);
    localStorage.setItem(getWBSKey(projectId), JSON.stringify(items));

    return {
      success: true,
      data: newItem,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update a WBS item
 */
export function updateWBS(
  projectId: string,
  wbsId: string,
  updates: Partial<Omit<WBSItem, 'id' | 'project_id' | 'created_at'>>
): WBSResponse {
  try {
    const items = getWBS(projectId);
    const index = items.findIndex(item => item.id === wbsId);

    if (index === -1) {
      return {
        success: false,
        error: 'WBS item not found',
      };
    }

    items[index] = {
      ...items[index],
      ...updates,
    };

    localStorage.setItem(getWBSKey(projectId), JSON.stringify(items));

    return {
      success: true,
      data: items[index],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a WBS item and all its children recursively
 */
export function deleteWBS(projectId: string, wbsId: string): WBSResponse {
  try {
    const items = getWBS(projectId);
    
    // Find all descendant IDs
    const getDescendantIds = (parentId: string): string[] => {
      const children = items.filter(item => item.parent_id === parentId);
      let ids: string[] = [];
      children.forEach(child => {
        ids.push(child.id);
        ids = ids.concat(getDescendantIds(child.id));
      });
      return ids;
    };

    const idsToDelete = new Set([wbsId, ...getDescendantIds(wbsId)]);
    const filtered = items.filter(item => !idsToDelete.has(item.id));

    localStorage.setItem(getWBSKey(projectId), JSON.stringify(filtered));

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Build tree structure from flat list
 * Returns array of root nodes with children nested
 */
export function buildWBSTree(projectId: string): WBSTreeNode[] {
  const items = getWBS(projectId);
  
  // Build a map for quick lookup
  const itemMap = new Map<string, WBSItem>();
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // Build children arrays
  const tree: WBSTreeNode[] = [];
  
  items.forEach(item => {
    const node = itemMap.get(item.id)!;
    if (item.parent_id && itemMap.has(item.parent_id)) {
      const parent = itemMap.get(item.parent_id)!;
      parent.children.push(node);
    } else {
      // Root node
      tree.push({
        ...node,
        level: 0,
        isExpanded: true,
      });
    }
  });

  // Add level to each node recursively
  const addLevels = (nodes: WBSTreeNode[], level: number): void => {
    nodes.forEach(node => {
      node.level = level;
      if (node.children.length > 0) {
        addLevels(node.children as WBSTreeNode[], level + 1);
      }
    });
  };

  addLevels(tree, 0);

  // Sort by creation date
  const sortByDate = (nodes: WBSTreeNode[]): void => {
    nodes.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    nodes.forEach(node => {
      if (node.children.length > 0) {
        sortByDate(node.children as WBSTreeNode[]);
      }
    });
  };

  sortByDate(tree);

  return tree;
}

/**
 * Get single WBS item by ID
 */
export function getWBSItem(projectId: string, wbsId: string): WBSItem | null {
  const items = getWBS(projectId);
  return items.find(item => item.id === wbsId) || null;
}

/**
 * Initialize sample WBS data for demo
 */
export function initSampleWBS(projectId: string): void {
  const existing = getWBS(projectId);
  if (existing.length > 0) return;

  const sampleWBS: WBSItem[] = [
    // Root level items for project 1
    {
      id: 'wbs-1-1',
      project_id: projectId,
      name: '1. Công tác chuẩn bị',
      parent_id: null,
      children: [],
      created_at: '2024-01-16T08:00:00Z',
    },
    {
      id: 'wbs-1-2',
      project_id: projectId,
      name: '2. Công tác móng',
      parent_id: null,
      children: [],
      created_at: '2024-01-16T09:00:00Z',
    },
    {
      id: 'wbs-1-3',
      project_id: projectId,
      name: '3. Kết cấu thân',
      parent_id: null,
      children: [],
      created_at: '2024-01-16T10:00:00Z',
    },
    {
      id: 'wbs-1-4',
      project_id: projectId,
      name: '4. Công tác hoàn thiện',
      parent_id: null,
      children: [],
      created_at: '2024-01-16T11:00:00Z',
    },
  ];

  // Add children to "Công tác móng"
  sampleWBS.push({
    id: 'wbs-1-2-1',
    project_id: projectId,
    name: '2.1. Móng cọc',
    parent_id: 'wbs-1-2',
    children: [],
    created_at: '2024-01-17T08:00:00Z',
  });
  sampleWBS.push({
    id: 'wbs-1-2-2',
    project_id: projectId,
    name: '2.2. Móng băng',
    parent_id: 'wbs-1-2',
    children: [],
    created_at: '2024-01-17T09:00:00Z',
  });

  // Add children to "Công tác móng cọc"
  sampleWBS.push({
    id: 'wbs-1-2-1-1',
    project_id: projectId,
    name: '2.1.1. Khoan cọc',
    parent_id: 'wbs-1-2-1',
    children: [],
    created_at: '2024-01-18T08:00:00Z',
  });
  sampleWBS.push({
    id: 'wbs-1-2-1-2',
    project_id: projectId,
    name: '2.1.2. Gia cố thép',
    parent_id: 'wbs-1-2-1',
    children: [],
    created_at: '2024-01-18T09:00:00Z',
  });

  localStorage.setItem(getWBSKey(projectId), JSON.stringify(sampleWBS));
}
