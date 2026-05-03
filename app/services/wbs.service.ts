// ============================================
// WBS SERVICE - SUPABASE DATA LAYER
// ============================================

import { WBSItem, WBSTreeNode, WBSResponse } from '@/app/types';
import { supabase } from '@/app/utils/supabase';

/**
 * Get all WBS items for a project from Supabase
 */
export async function getWBS(projectId: string): Promise<WBSItem[]> {
  const { data, error } = await supabase
    .from('wbs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching WBS:', error);
    return [];
  }
  return data as WBSItem[];
}

/**
 * Add a new WBS item
 */
export async function addWBS(
  projectId: string,
  name: string,
  parentId: string | null = null
): Promise<WBSResponse> {
  const { data, error } = await supabase
    .from('wbs')
    .insert([
      {
        project_id: projectId,
        name,
        parent_id: parentId
      }
    ])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data as WBSItem,
  };
}

/**
 * Update an existing WBS item
 */
export async function updateWBS(
  projectId: string,
  wbsId: string,
  updates: Partial<Pick<WBSItem, 'name' | 'parent_id'>>
): Promise<WBSResponse> {
  const { data, error } = await supabase
    .from('wbs')
    .update(updates)
    .eq('id', wbsId)
    .eq('project_id', projectId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data as WBSItem,
  };
}

/**
 * Delete a WBS item
 */
export async function deleteWBS(projectId: string, wbsId: string): Promise<WBSResponse> {
  const { error } = await supabase
    .from('wbs')
    .delete()
    .eq('id', wbsId)
    .eq('project_id', projectId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Build tree structure from flat list (Utility function)
 * Takes flat list of items and returns nested tree
 */
export function buildWBSTree(items: WBSItem[]): WBSTreeNode[] {
  // Build a map for quick lookup
  const itemMap = new Map<string, WBSTreeNode>();
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [], level: 0, isExpanded: true });
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
      tree.push(node);
    }
  });

  // Add level to each node recursively
  const addLevels = (nodes: WBSTreeNode[], level: number): void => {
    nodes.forEach(node => {
      node.level = level;
      if (node.children && node.children.length > 0) {
        addLevels(node.children as WBSTreeNode[], level + 1);
      }
    });
  };

  addLevels(tree, 0);

  // Sort by creation date
  const sortByDate = (nodes: WBSTreeNode[]): void => {
    nodes.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortByDate(node.children as WBSTreeNode[]);
      }
    });
  };

  sortByDate(tree);

  return tree;
}
