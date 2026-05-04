import { WBSItem, WBSTreeNode } from '@/app/types';

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
