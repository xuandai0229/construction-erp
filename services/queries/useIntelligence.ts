import { useQuery } from '@tanstack/react-query';
import { IntelligenceSnapshot } from '@/app/types/financial';

export function useIntelligenceQuery(projectId: string) {
  return useQuery({
    queryKey: ['intelligence', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const res = await fetch(`/api/workspace/intelligence?projectId=${projectId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch intelligence');
      return json.data as IntelligenceSnapshot;
    },
    enabled: !!projectId,
    refetchInterval: 30000, // Refresh every 30 seconds for live decision support
  });
}
