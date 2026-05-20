import json
from datetime import datetime

def calculate_project_kpis(data):
    """
    Construction Enterprise KPI Engine — Authoritative Financial Metrics.

    KPI Schema Contract:
    ════════════════════════════════════════════════════════════════
    CONTRACT LAYER:
      contractValue       = Total signed contract value (with investor)
    REVENUE LAYER (Accrual Accounting):
      recognizedRevenue   = Revenue from approved invoices (accrual basis)
      collectedCash       = Cash actually received from investor (paid invoices)
      outstandingReceivable = Invoiced but not yet collected
      overdueReceivable   = Past-due uncollected amount
    COST LAYER:
      actualCost          = Total approved/realized cost
      paidCost            = Cost already disbursed to suppliers
      accruedCost         = Cost recognized but not yet paid (payable)
    PROFITABILITY LAYER:
      grossProfit         = recognizedRevenue - actualCost
      grossMargin         = grossProfit / recognizedRevenue * 100
      budgetVariance      = totalBudget - actualCost  (positive = under budget)
      costOverrunPct      = actualCost / totalBudget * 100
    EARNED VALUE MANAGEMENT (EVM):
      plannedProgress     = Time elapsed / Total duration (schedule %)
      actualProgress      = Task/WBS completion %
      earnedValue         = actualProgress * totalBudget (BAC)
      plannedValue        = plannedProgress * totalBudget (BAC)
      SPI                 = earnedValue / plannedValue  (Schedule Performance Index)
      CPI                 = earnedValue / actualCost    (Cost Performance Index)
    ════════════════════════════════════════════════════════════════

    Input: dict containing project, wbs, costs, invoices, payments.
    Output: Semantic-safe KPI dictionary.
    """
    project = data.get('project', {})
    wbs = data.get('wbs', [])
    costs = data.get('costs', [])
    invoices = data.get('invoices', [])
    payments = data.get('payments', [])

    # ─── CONTRACT LAYER ──────────────────────────────────────
    contract_value = float(project.get('contractValue', 0))
    total_budget = float(project.get('totalBudget', 0))  # BAC (Budget at Completion)

    # ─── COST LAYER ──────────────────────────────────────────
    active_costs = [c for c in costs if not c.get('deletedAt')]
    actual_cost = sum(float(c.get('amount', 0)) for c in active_costs)
    paid_cost = sum(float(c.get('amount', 0)) for c in active_costs if c.get('status') == 'paid')
    accrued_cost = actual_cost - paid_cost  # Recognized but unpaid = payable

    # ─── REVENUE LAYER (Accrual Accounting) ──────────────────
    active_invoices = [i for i in invoices if not i.get('deletedAt')]
    recognized_revenue = sum(float(i.get('amount', 0)) for i in active_invoices)
    collected_cash = sum(float(i.get('paidAmount', 0)) for i in active_invoices)
    outstanding_receivable = recognized_revenue - collected_cash

    # Overdue receivable: past-due invoices not fully paid
    today = datetime.now()
    overdue_receivable = 0.0
    for inv in active_invoices:
        if inv.get('status') == 'PAID':
            continue
        due_date_str = inv.get('dueDate')
        if due_date_str:
            try:
                due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
                remaining = float(inv.get('remainingAmount', 0))
                if due_date.timestamp() < today.timestamp() and remaining > 0:
                    overdue_receivable += remaining
            except Exception:
                pass

    # ─── PROFITABILITY LAYER ─────────────────────────────────
    gross_profit = recognized_revenue - actual_cost
    gross_margin = (gross_profit / recognized_revenue * 100) if recognized_revenue > 0 else 0.0
    budget_variance = total_budget - actual_cost  # Positive = under budget
    cost_overrun_pct = (actual_cost / total_budget * 100) if total_budget > 0 else 0.0

    # ─── PROGRESS & TIMELINE ─────────────────────────────────
    active_wbs = [w for w in wbs if float(w.get('budgetAmount', 0)) > 0]
    total_active_wbs_budget = sum(float(w.get('budgetAmount', 0)) for w in active_wbs)
    
    weighted_progress_sum = 0.0
    for w in active_wbs:
        w_budget = float(w.get('budgetAmount', 0))
        # Sum all paid actual costs associated with this specific WBS item
        w_paid_costs = sum(float(c.get('amount', 0)) for c in active_costs if c.get('wbsId') == w.get('id') and c.get('status') == 'paid')
        # Progress percentage capped at 100%
        w_progress = min(100.0, (w_paid_costs / w_budget * 100.0)) if w_budget > 0 else 0.0
        # Weight by individual budget relative to total active WBS budget
        weighted_progress_sum += w_progress * w_budget
        
    actual_progress = (weighted_progress_sum / total_active_wbs_budget) if total_active_wbs_budget > 0 else 0.0

    # Timeline
    start_date_str = project.get('startDate')
    end_date_str = project.get('endDate')
    days_elapsed = 0
    duration_days = 365

    if start_date_str and end_date_str:
        try:
            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
            duration_days = max(1, (end_date - start_date).days)
            if start_date.timestamp() < today.timestamp():
                days_elapsed = min(duration_days, (today - start_date).days)
        except Exception:
            pass

    planned_progress = (days_elapsed / duration_days * 100) if duration_days > 0 else 0.0

    # ─── EARNED VALUE MANAGEMENT (EVM) ───────────────────────
    # BAC = Budget at Completion = totalBudget
    bac = total_budget
    earned_value = (actual_progress / 100.0) * bac   # EV = % complete * BAC
    planned_value = (planned_progress / 100.0) * bac  # PV = % scheduled * BAC

    spi = (earned_value / planned_value) if planned_value > 0 else 1.0  # Schedule Performance Index
    cpi = (earned_value / actual_cost) if actual_cost > 0 else 1.0     # Cost Performance Index

    # EAC (Estimate at Completion) = BAC / CPI
    eac = (bac / cpi) if cpi > 0 else bac
    # ETC (Estimate to Complete) = EAC - actualCost
    etc = max(0, eac - actual_cost)

    # ─── DYNAMIC HEALTH SCORE ────────────────────────────────
    health_score = 100

    # Cost overrun penalty (max -30)
    if actual_cost > total_budget and total_budget > 0:
        overrun_pct = ((actual_cost - total_budget) / total_budget) * 100
        health_score -= min(30, overrun_pct * 1.5)

    # Schedule delay penalty via SPI (max -25)
    if spi < 0.9 and planned_value > 0:
        health_score -= min(25, (1.0 - spi) * 50)
    elif planned_progress > actual_progress + 10:
        delay_gap = planned_progress - actual_progress
        health_score -= min(25, delay_gap * 1.0)

    # Debt aging penalty (max -20)
    if overdue_receivable > 0 and contract_value > 0:
        debt_ratio = (overdue_receivable / contract_value) * 100
        health_score -= min(20, debt_ratio * 2.0)

    # CPI penalty (max -15)
    if cpi < 0.85 and actual_cost > 0:
        health_score -= min(15, (1.0 - cpi) * 30)

    health_score = max(0, min(100, int(round(health_score))))
    health_status = 'STABLE'
    if health_score < 60:
        health_status = 'CRITICAL'
    elif health_score < 80:
        health_status = 'WARNING'

    # ─── CASH FLOW METRICS ───────────────────────────────────
    active_payments = [p for p in payments if not p.get('deletedAt')]
    total_cash_in = sum(float(p.get('amount', 0)) for p in active_payments)
    total_cash_out = paid_cost
    net_cashflow = total_cash_in - total_cash_out

    return {
        # Contract
        'contractValue': contract_value,
        # Revenue (Accrual)
        'totalRevenue': recognized_revenue,
        'collectedCash': collected_cash,
        'outstandingReceivable': outstanding_receivable,
        'overdueReceivable': overdue_receivable,
        # Budget
        'totalBudget': total_budget,
        # Cost
        'totalCost': actual_cost,
        'paidCost': paid_cost,
        'accruedCost': accrued_cost,
        'unpaidCost': accrued_cost,  # Alias for backward compat
        # Profitability
        'grossProfit': gross_profit,
        'grossMargin': gross_margin,
        'budgetVariance': budget_variance,
        'costOverrunPct': cost_overrun_pct,
        # Progress
        'actualProgress': actual_progress,
        'plannedProgress': planned_progress,
        'taskProgress': actual_progress,  # Backward compat alias
        'timeProgress': planned_progress,  # Backward compat alias
        # EVM (Earned Value Management)
        'earnedValue': earned_value,
        'plannedValue': planned_value,
        'spi': round(spi, 3),
        'cpi': round(cpi, 3),
        'eac': eac,
        'etc': etc,
        # Receivable (Backward compat)
        'totalInvoiced': recognized_revenue,
        'totalPaidInvoice': collected_cash,
        'totalRemainingInvoice': outstanding_receivable,
        'overdueInvoices': overdue_receivable,
        # Cash flow
        'totalCashIn': total_cash_in,
        'totalCashOut': total_cash_out,
        'netCashflow': net_cashflow,
        # Timeline
        'daysElapsed': days_elapsed,
        'durationDays': duration_days,
        # Health
        'healthScore': health_score,
        'healthStatus': health_status,
        'version': project.get('version', 1)
    }
