import { Project, WBSItem } from "@/types";

const STORAGE_PREFIX = "construction-erp:";

class ProjectService {
  private storageKey = `${STORAGE_PREFIX}projects`;

  getProjects(): Project[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  addProject(project: Omit<Project, "id" | "created_at">): Project {
    const projects = this.getProjects();
    const newProject: Project = {
      ...project,
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
    };
    projects.push(newProject);
    if (typeof window !== "undefined") {
      localStorage.setItem(this.storageKey, JSON.stringify(projects));
    }
    return newProject;
  }

  getProject(id: string): Project | null {
    const projects = this.getProjects();
    return projects.find((p) => p.id === id) || null;
  }

  updateProject(id: string, updates: Partial<Project>): Project | null {
    const projects = this.getProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return null;

    projects[index] = { ...projects[index], ...updates };
    if (typeof window !== "undefined") {
      localStorage.setItem(this.storageKey, JSON.stringify(projects));
    }
    return projects[index];
  }

  deleteProject(id: string): boolean {
    const projects = this.getProjects();
    const filtered = projects.filter((p) => p.id !== id);
    if (filtered.length === projects.length) return false;

    if (typeof window !== "undefined") {
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    }
    return true;
  }
}

export const projectService = new ProjectService();
