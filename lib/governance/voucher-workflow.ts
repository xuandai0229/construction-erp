import { ApiError } from "@/lib/api-error";

export const VOUCHER_STATES = ["NHAP", "CHO_DUYET", "DA_DUYET", "TU_CHOI", "DA_GHI_SO", "DA_HUY"] as const;
export type VoucherState = typeof VOUCHER_STATES[number];

const TRANSITIONS: Record<VoucherState, VoucherState[]> = {
  NHAP: ["CHO_DUYET", "DA_HUY"],
  CHO_DUYET: ["DA_DUYET", "TU_CHOI"],
  DA_DUYET: ["DA_GHI_SO", "DA_HUY"],
  TU_CHOI: ["NHAP", "DA_HUY"],
  DA_GHI_SO: ["DA_DUYET"],
  DA_HUY: [],
};

export class VoucherWorkflowGovernance {
  static normalize(status?: string | null): VoucherState {
    if (status === "DA_CAT") return "NHAP";
    if (status && VOUCHER_STATES.includes(status as VoucherState)) return status as VoucherState;
    return "NHAP";
  }

  static assertTransition(fromRaw: string | null | undefined, to: VoucherState) {
    const from = this.normalize(fromRaw);
    if (!TRANSITIONS[from].includes(to)) {
      throw new ApiError(400, `Không được chuyển trạng thái chứng từ từ ${from} sang ${to}.`);
    }
  }

  static assertPostable(status?: string | null) {
    const current = this.normalize(status);
    if (current !== "DA_DUYET") {
      throw new ApiError(400, "Chứng từ chưa được duyệt, không được ghi sổ.");
    }
  }
}
