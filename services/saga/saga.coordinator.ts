import { prisma } from "@/lib/prisma";
import { LoggerService } from "../logger.service";
import { eventBus } from "@/lib/event-bus";
import { AuditService } from "../audit.service";

export interface SagaStep {
  name: string;
  action: () => Promise<any>;
  compensate: () => Promise<any>;
}

export class SagaCoordinator {
  /**
   * Starts a new distributed saga, executing actions step-by-step and persisting state.
   */
  static async startSaga(
    companyId: string,
    sagaType: string,
    correlationId: string,
    steps: SagaStep[],
    context: any = {}
  ) {
    LoggerService.info(`[Saga Coordinator] Starting distributed saga [${sagaType}] with correlation ID ${correlationId}`);

    // 1. Initialize SagaState record
    const sagaRecord = await prisma.sagaState.create({
      data: {
        companyId,
        sagaType,
        status: "PROCESSING",
        currentStep: 0,
        correlationId,
        steps: steps.map(s => ({ name: s.name, status: "PENDING" })),
        context
      }
    });

    const executionSteps = [...steps];
    const completedIndices: number[] = [];

    // 2. Sequentially execute actions
    for (let i = 0; i < executionSteps.length; i++) {
      const step = executionSteps[i];
      LoggerService.info(`[Saga Coordinator] [${sagaType}] Executing Step ${i + 1}/${executionSteps.length}: ${step.name}`);

      try {
        // Update DB state before running
        await prisma.sagaState.update({
          where: { id: sagaRecord.id },
          data: {
            currentStep: i,
            steps: this.updateStepStatus(sagaRecord.steps as any[], i, "PROCESSING")
          }
        });

        // Run the step action
        await step.action();
        completedIndices.push(i);

        // Update step state as COMPLETED
        await prisma.sagaState.update({
          where: { id: sagaRecord.id },
          data: {
            steps: this.updateStepStatus(sagaRecord.steps as any[], i, "COMPLETED")
          }
        });
      } catch (err: any) {
        LoggerService.error(`[Saga Coordinator] [${sagaType}] Step ${step.name} failed! Triggering compensation sequence.`, { error: err });
        
        // Mark step status as FAILED in DB
        await prisma.sagaState.update({
          where: { id: sagaRecord.id },
          data: {
            status: "FAILED",
            steps: this.updateStepStatus(sagaRecord.steps as any[], i, "FAILED")
          }
        });

        // Trigger compensation rollback in reverse order
        await this.rollbackSaga(sagaRecord.id, executionSteps, completedIndices, companyId, sagaType);
        throw new Error(`[Saga Coordinator] Saga execution failed on step ${step.name}: ${err.message}`);
      }
    }

    // 3. Mark distributed saga as completed
    await prisma.sagaState.update({
      where: { id: sagaRecord.id },
      data: { status: "COMPLETED" }
    });

    LoggerService.info(`[Saga Coordinator] [${sagaType}] Completed successfully!`);
    
    await AuditService.log({
      action: "APPROVE",
      entity: "SAGA",
      entityId: sagaRecord.id,
      reason: `Distributed saga ${sagaType} completed successfully`,
      correlationId,
      severity: "INFO"
    });
  }

  /**
   * Performs reverse sequential compensation (Rollback) of all successful steps
   */
  private static async rollbackSaga(
    sagaId: string,
    steps: SagaStep[],
    completedIndices: number[],
    companyId: string,
    sagaType: string
  ) {
    LoggerService.warn(`[Saga Coordinator] Initiating compensation rollback for saga ${sagaId}...`);
    
    // Reverse traverse completed steps
    for (let i = completedIndices.length - 1; i >= 0; i--) {
      const idx = completedIndices[i];
      const step = steps[idx];
      LoggerService.warn(`[Saga Coordinator] [Compensate] Executing rollback for Step: ${step.name}`);

      try {
        await step.compensate();
        
        // Update DB step state as ROLLED_BACK
        const saga = await prisma.sagaState.findUnique({ where: { id: sagaId } });
        if (saga) {
          await prisma.sagaState.update({
            where: { id: sagaId },
            data: {
              steps: this.updateStepStatus(saga.steps as any[], idx, "ROLLED_BACK")
            }
          });
        }
      } catch (compensateErr) {
        LoggerService.error(`[Saga Coordinator] Critical rollback failure on step ${step.name}! Action requires manual administrative intervention.`, { error: compensateErr });
        // Set state to manual intervention alert
        await prisma.sagaState.update({
          where: { id: sagaId },
          data: { status: "CRITICAL_MANUAL_INTERVENTION" }
        });
        return;
      }
    }

    await prisma.sagaState.update({
      where: { id: sagaId },
      data: { status: "ROLLED_BACK" }
    });

    LoggerService.warn(`[Saga Coordinator] Rollback compensation finished for saga ${sagaId}`);
    
    await AuditService.log({
      action: "REVERSE",
      entity: "SAGA",
      entityId: sagaId,
      reason: `Distributed saga ${sagaType} rolled back due to error`,
      severity: "WARNING"
    });
  }

  /**
   * Helper: updates status array
   */
  private static updateStepStatus(steps: any[], idx: number, status: string): any[] {
    const updated = [...steps];
    if (updated[idx]) {
      updated[idx] = { ...updated[idx], status };
    }
    return updated;
  }

  /**
   * Specialized Saga Implementation: Invoice Approval Distributed Transaction Flow
   */
  static async executeInvoiceApprovalSaga(
    companyId: string,
    invoiceId: string,
    amount: number,
    projectId: string,
    userId: string
  ) {
    const correlationId = `SAGA-INV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    const steps: SagaStep[] = [
      {
        name: "Reserve Treasury Allocation",
        action: async () => {
          LoggerService.info(`[ApproveInvoiceSaga] Step 1: Allocating project funds reserve of ${amount}`);
          // Simulate ledger treasury reservation
          await new Promise(resolve => setTimeout(resolve, 300));
        },
        compensate: async () => {
          LoggerService.info(`[ApproveInvoiceSaga] Compensate Step 1: Releasing reserved treasury allocation of ${amount}`);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      },
      {
        name: "Ledger General Posting",
        action: async () => {
          LoggerService.info(`[ApproveInvoiceSaga] Step 2: Creating dual-entry transaction posting lines`);
          // Simulating DB write
          await new Promise(resolve => setTimeout(resolve, 400));
        },
        compensate: async () => {
          LoggerService.info(`[ApproveInvoiceSaga] Compensate Step 2: Reversing dual-entry transaction posting lines`);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      },
      {
        name: "Procurement Hold Release",
        action: async () => {
          LoggerService.info(`[ApproveInvoiceSaga] Step 3: Transitioning related Purchase Orders to RELEASED`);
          await new Promise(resolve => setTimeout(resolve, 300));
        },
        compensate: async () => {
          LoggerService.info(`[ApproveInvoiceSaga] Compensate Step 3: Restoring hold on related Purchase Orders`);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    ];

    await this.startSaga(companyId, "INVOICE_APPROVAL_SAGA", correlationId, steps, { invoiceId, amount, projectId, userId });
  }
}
