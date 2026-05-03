export interface EnrichedWBSNode {
  id: string;
  project_id: string;
  name: string;
  parent_id: string | null;
  level: number;
  isExpanded: boolean;
  code: string;
  budget: number;
  actual: number;
  variance: number;
  percentage: number;
  status: string;
  children: EnrichedWBSNode[];
}
