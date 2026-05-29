import { ApiError } from "@/lib/api-error";
import { Decimal } from "decimal.js";

export class InventoryPolicy {
  /**
   * Validates quantity and unit cost of a document line
   */
  static validateLineMath(quantity: number, unitCost: number) {
    if (quantity <= 0) {
      throw new ApiError(400, "Số lượng vật tư nhập/xuất phải lớn hơn 0.");
    }
    if (unitCost < 0) {
      throw new ApiError(400, "Đơn giá vật tư không được âm.");
    }
  }

  /**
   * Calculates the new moving average cost
   */
  static calculateMovingAverage(
    oldQty: number | Decimal,
    oldTotalCost: number | Decimal,
    newQty: number | Decimal,
    newTotalCost: number | Decimal
  ): { qty: Decimal; totalCost: Decimal; avgCost: Decimal } {
    const qOld = new Decimal(oldQty.toString());
    const cOld = new Decimal(oldTotalCost.toString());
    const qNew = new Decimal(newQty.toString());
    const cNew = new Decimal(newTotalCost.toString());

    const qty = qOld.plus(qNew);
    const totalCost = cOld.plus(cNew);

    let avgCost = new Decimal(0);
    if (qty.greaterThan(0)) {
      avgCost = totalCost.dividedBy(qty).toDecimalPlaces(2);
    }

    return { qty, totalCost, avgCost };
  }

  /**
   * Asserts that negative stock does not occur for an issue transaction.
   */
  static assertStockAvailable(
    currentQty: number | Decimal,
    issueQty: number | Decimal,
    materialCode: string,
    warehouseCode: string
  ) {
    const qCurrent = new Decimal(currentQty.toString());
    const qIssue = new Decimal(issueQty.toString());

    if (qCurrent.minus(qIssue).lessThan(0)) {
      throw new ApiError(
        400,
        `LỖI XUẤT ÂM KHO: Không thể xuất ${qIssue.toString()} đơn vị vật tư ${materialCode} từ kho ${warehouseCode}. Số lượng tồn kho hiện tại chỉ còn ${qCurrent.toString()} đơn vị.`
      );
    }
  }
}
