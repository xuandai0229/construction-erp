export class IntelligenceMetadataService {
  static getSemanticRegistry() {
    return {
      entities: {
        PROJECT: {
          description: "A construction site or contract unit",
          fields: ["name", "totalBudget", "startDate", "endDate", "status"]
        },
        COST: {
          description: "Actual expenditure incurred",
          fields: ["amount", "date", "costType", "vendor"]
        },
        INVOICE: {
          description: "Receivable or payable billing document",
          fields: ["amount", "remainingAmount", "dueDate", "vatAmount"]
        }
      },
      metrics: {
        MARGIN: "Revenue minus Cost divided by Revenue",
        BURNDOWN: "Rate of budget consumption over time",
        EXPOSURE: "Total amount of unpaid debt or withheld retention"
      }
    };
  }
}
