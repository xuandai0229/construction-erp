def detect_risks(data, current_kpis, boq_analysis):
    """
    Detects critical financial and operational risks using Construction ERP KPIs.
    """
    contract_value = current_kpis.get('contractValue', 0)
    overdue_receivable = current_kpis.get('overdueReceivable', 0)
    
    spi = current_kpis.get('spi', 1.0)
    cpi = current_kpis.get('cpi', 1.0)
    
    actual_progress = current_kpis.get('actualProgress', 0)
    planned_progress = current_kpis.get('plannedProgress', 0)
    
    risks_detected = []
    
    # Risk 1: WBS Budget Mismatch / Overrun (CPI)
    boq_items = boq_analysis.get('boqVsActual', [])
    overrun_items = [b for b in boq_items if b.get('isOverBudget')]
    if cpi < 0.95 or overrun_items:
        risks_detected.append({
            'type': 'BUDGET_OVERRUN',
            'severity': 'CRITICAL' if cpi < 0.85 or len(overrun_items) > 2 else 'WARNING',
            'message': f"Chỉ số CPI đạt {cpi:.2f}. Có {len(overrun_items)} hạng mục WBS vượt dự toán BOQ.",
            'details': [f"Hạng mục '{item['name']}' vượt {item['variance'] * -1:,.0f} VND" for item in overrun_items[:3]] if overrun_items else ["Dự án đang tiêu hao chi phí vượt mức hoàn thành."]
        })
        
    # Risk 2: Schedule Lag (SPI)
    if spi < 0.95 or actual_progress < planned_progress - 5:
        gap = planned_progress - actual_progress
        risks_detected.append({
            'type': 'SCHEDULE_DELAY',
            'severity': 'CRITICAL' if spi < 0.85 else 'WARNING',
            'message': f"Chỉ số SPI đạt {spi:.2f}. Tiến độ thi công chậm hơn kế hoạch {max(gap, 0):.1f}%.",
            'details': [f"Kế hoạch: {planned_progress:.1f}%, Thực tế hoàn thành: {actual_progress:.1f}%"]
        })
        
    # Risk 3: Accounts Receivable (Liquidity risk)
    if overdue_receivable > 0:
        ratio = overdue_receivable / contract_value * 100 if contract_value > 0 else 0
        risks_detected.append({
            'type': 'RECEIVABLE_OVERDUE',
            'severity': 'CRITICAL' if ratio > 15 else 'WARNING',
            'message': f"Công nợ quá hạn từ khách hàng là {overdue_receivable:,.0f} VND.",
            'details': [f"Chiếm {ratio:.1f}% tổng giá trị hợp đồng, gây rủi ro đứt gãy dòng tiền thi công."]
        })
        
    # Risk 4: Vendor / Contractor Dependency
    top_contractors = boq_analysis.get('topContractors', [])
    if top_contractors and top_contractors[0]['pct'] > 40:
        risks_detected.append({
            'type': 'CONTRACTOR_DEPENDENCY',
            'severity': 'WARNING',
            'message': f"Tập trung chi phí cao vào nhà thầu phụ '{top_contractors[0]['name']}'.",
            'details': [f"Nhà thầu này chiếm {top_contractors[0]['pct']:.1f}% tổng chi phí thực tế phát sinh."]
        })

    # Overall project risk score penalty
    risk_score = 0
    if risks_detected:
        severities = [r['severity'] for r in risks_detected]
        critical_count = severities.count('CRITICAL')
        warning_count = severities.count('WARNING')
        risk_score = (critical_count * 30) + (warning_count * 15)
        risk_score = min(100, max(0, risk_score))
        
    return {
        'risks': risks_detected,
        'riskScore': risk_score,
        'atRiskCount': len(risks_detected)
    }
