import { prisma } from "../../lib/prisma";

async function main() {
  const [
    projectsWithoutCompany,
    duplicateProjectNames,
    suppliersWithoutCode,
    duplicateSupplierCodes,
    contractsMissingProject,
    contractsMissingCounterparty,
    wbsWithoutProject,
    costsMissingWbs,
    invoicesMissingWbs
  ] = await Promise.all([
    prisma.project.count({ where: { deletedAt: null, companyId: null } }),
    prisma.$queryRaw<Array<{ companyId: string | null; name: string; count: bigint }>>`
      SELECT "companyId", name, COUNT(*)::bigint AS count
      FROM "Project"
      WHERE "deletedAt" IS NULL
      GROUP BY "companyId", name
      HAVING COUNT(*) > 1
    `,
    prisma.supplier.count({ where: { deletedAt: null, code: "" } }),
    prisma.$queryRaw<Array<{ code: string; count: bigint }>>`
      SELECT code, COUNT(*)::bigint AS count
      FROM "Supplier"
      WHERE "deletedAt" IS NULL
      GROUP BY code
      HAVING COUNT(*) > 1
    `,
    prisma.contract.count({ where: { deletedAt: null, projectId: "" } }),
    prisma.contract.count({ where: { deletedAt: null, supplierId: null, contractorName: null } }),
    prisma.wBSItem.count({ where: { deletedAt: null, projectId: "" } }),
    prisma.costRecord.count({ where: { deletedAt: null, wbsId: "" } }),
    prisma.invoice.count({ where: { deletedAt: null, wbsId: "" } })
  ]);

  const warnings = [
    projectsWithoutCompany && `${projectsWithoutCompany} công trình chưa gắn companyId.`,
    duplicateProjectNames.length && `${duplicateProjectNames.length} nhóm tên công trình trùng trong cùng companyId.`,
    suppliersWithoutCode && `${suppliersWithoutCode} nhà cung cấp thiếu mã NCC.`,
    duplicateSupplierCodes.length && `${duplicateSupplierCodes.length} mã NCC trùng.`,
    contractsMissingProject && `${contractsMissingProject} hợp đồng thiếu projectId.`,
    contractsMissingCounterparty && `${contractsMissingCounterparty} hợp đồng thiếu supplierId/contractorName.`,
    wbsWithoutProject && `${wbsWithoutProject} WBS thiếu projectId.`,
    costsMissingWbs && `${costsMissingWbs} chi phí thiếu WBS.`,
    invoicesMissingWbs && `${invoicesMissingWbs} hóa đơn thiếu WBS.`
  ].filter(Boolean);

  console.log(JSON.stringify({
    status: warnings.length ? "WARNING" : "PASS",
    warnings,
    counts: {
      projectsWithoutCompany,
      duplicateProjectNames: duplicateProjectNames.length,
      suppliersWithoutCode,
      duplicateSupplierCodes: duplicateSupplierCodes.length,
      contractsMissingProject,
      contractsMissingCounterparty,
      wbsWithoutProject,
      costsMissingWbs,
      invoicesMissingWbs
    }
  }, null, 2));
}

main()
  .catch(error => {
    console.error("FAIL verify-project-supplier-contract-wbs-links");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
