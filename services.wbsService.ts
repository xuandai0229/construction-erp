import { WBSItem } from "@/types";

const STORAGE_PREFIX = "construction-erp:";

class WBSService {
  private getStorageKey(projectId: string) {
    return `${STORAGE_PREFIX}wbs:${projectId}`;
  }

  getWBSItems(projectId: string): WBSItem[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(this.getStorageKey(projectId));
    return data ? JSON.parse(data) : [];
  }

  addWBSItem(
    projectId: string,
    name: string,
    parentId: string | null = null
  ): WBSItem {
    const items = this.getWBSItems(projectId);
    const level = parentId ? this.getItemLevel(items, parentId) + 1 : 0;

    const newItem: WBSItem = {
      id: `wbs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      project_id: projectId,
      name,
      parent_id: parentId,
      created_at: new Date().toISOString(),
      level,
    };

    items.push(newItem);
    if (typeof window !== "undefined") {
      localStorage.setItem(this.getStorageKey(projectId), JSON.stringify(items));
    }
    return newItem;
  }

  private getItemLevel(items: WBSItem[], itemId: string): number {
    const item = items.find((i) => i.id === itemId);
    return item?.level ?? 0;
  }

  updateWBSItem(
    projectId: string,
    id: string,
    updates: Partial<WBSItem>
  ): WBSItem | null {
    const items = this.getWBSItems(projectId);
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return null;

    items[index] = { ...items[index], ...updates };
    if (typeof window !== "undefined") {
      localStorage.setItem(this.getStorageKey(projectId), JSON.stringify(items));
    }
    return items[index];
  }

  deleteWBSItem(projectId: string, id: string): boolean {
    const items = this.getWBSItems(projectId);
    // Also delete all children
    const filtered = items.filter((i) => i.id !== id && i.parent_id !== id);
    if (filtered.length === items.length) return false;

    if (typeof window !== "undefined") {
      localStorage.setItem(this.getStorageKey(projectId), JSON.stringify(filtered));
    }
    return true;
  }

  getWBSTree(projectId: string): WBSItem[] {
    const items = this.getWBSItems(projectId);
    const map = new Map<string, WBSItem>();

    // First pass: create map and initialize children arrays
    items.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    // Second pass: build tree hierarchy
    const roots: WBSItem[] = [];
    items.forEach((item) => {
      const mappedItem = map.get(item.id)!;
      if (item.parent_id) {
        const parent = map.get(item.parent_id);
        if (parent && parent.children) {
          parent.children.push(mappedItem);
        }
      } else {
        roots.push(mappedItem);
      }
    });

    return roots;
  }
}

export const wbsService = new WBSService();
