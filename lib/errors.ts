export class DomainError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class PeriodLockedError extends DomainError {
  constructor() {
    super(403, "Kỳ kế toán đã đóng, không thể phát sinh giao dịch.");
    this.name = "PeriodLockedError";
  }
}

export class UnbalancedEntryError extends DomainError {
  constructor(debits: number, credits: number) {
    super(500, `Lỗi cân đối kế toán: Tổng Nợ (${debits}) không bằng Tổng Có (${credits}).`);
    this.name = "UnbalancedEntryError";
  }
}

export class DuplicateRequestError extends DomainError {
  constructor() {
    super(409, "Giao dịch đã được xử lý trước đó.");
    this.name = "DuplicateRequestError";
  }
}

export class WorkflowTransitionError extends DomainError {
  constructor(currentStatus: string, expectedAction: string) {
    super(400, `Không thể thực hiện hành động ${expectedAction} khi chứng từ đang ở trạng thái ${currentStatus}.`);
    this.name = "WorkflowTransitionError";
  }
}

export class UnauthorizedActionError extends DomainError {
  constructor() {
    super(403, "Bạn không có quyền thực hiện hành động này trên hệ thống.");
    this.name = "UnauthorizedActionError";
  }
}
