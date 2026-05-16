
import { FinancialAggregationService } from "../services/financial-aggregation.service";

async function dumpWBS() {
  const projectId = "5b1bacfe-f954-4cc0-8936-c6c0949bbb2f";
  const result = await FinancialAggregationService.getWBSAggregation(projectId);
  
  console.log(`DUMP FOR PROJECT: ${projectId}`);
  console.log("WBS AGGREGATION DUMP:");
  console.log(JSON.stringify({
    stats: result.stats,
    treeLength: result.tree.length,
    firstNode: result.tree[0] ? {
      name: result.tree[0].name,
      budget: result.tree[0].budget,
      actual: result.tree[0].actual,
      childrenCount: result.tree[0].children.length
    } : "EMPTY"
  }, null, 2));
}

dumpWBS().catch(console.error);
