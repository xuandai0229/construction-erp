def analyze_boq_and_costs(data):
    """
    Performs BOQ vs Actual comparison and Cost Distribution by type, contractor, and WBS phase.
    """
    wbs = data.get('wbs', [])
    costs = data.get('costs', [])
    
    # 1. Cost Distribution by Type
    cost_types = ['material', 'labor', 'equipment', 'subcontract', 'other']
    cost_by_type = {ct: 0.0 for ct in cost_types}
    
    for c in costs:
        if c.get('deletedAt'):
            continue
        ct = c.get('costType', 'other')
        if ct not in cost_by_type:
            ct = 'other'
        cost_by_type[ct] += float(c.get('amount', 0))
        
    total_cost = sum(cost_by_type.values())
    
    # Labels in Vietnamese for enterprise feel
    type_labels = {
        'material': 'Vật tư',
        'labor': 'Nhân công',
        'equipment': 'Máy thi công',
        'subcontract': 'Thầu phụ',
        'other': 'Chi phí chung'
    }
    
    colors = {
        'material': '#3b82f6',     # sleet blue
        'labor': '#10b981',        # emerald green
        'equipment': '#f59e0b',    # warm amber
        'subcontract': '#a855f7',  # vibrant purple
        'other': '#64748b'         # slate grey
    }
    
    distribution_by_type = []
    for ct in cost_types:
        val = cost_by_type[ct]
        pct = (val / total_cost * 100) if total_cost > 0 else 0.0
        distribution_by_type.append({
            'type': ct,
            'label': type_labels[ct],
            'value': val,
            'pct': pct,
            'color': colors[ct]
        })

    # 2. BOQ vs Actual (Variance Analysis)
    # Sum budgeted vs actual by parent/root WBS items
    wbs_lookup = {w.get('id'): w for w in wbs}
    boq_vs_actual = []
    
    # Map WBS id to total actual cost allocated
    wbs_actuals = {w.get('id'): 0.0 for w in wbs}
    for c in costs:
        if c.get('deletedAt'):
            continue
        w_id = c.get('wbsId')
        if w_id in wbs_actuals:
            wbs_actuals[w_id] += float(c.get('amount', 0))

    # Roll up child costs to parents
    for w_id, act_val in list(wbs_actuals.items()):
        item = wbs_lookup.get(w_id)
        if not item:
            continue
        # Climb WBS tree to add to all parent nodes
        curr_parent_id = item.get('parentId')
        while curr_parent_id:
            if curr_parent_id in wbs_actuals:
                wbs_actuals[curr_parent_id] += act_val
            parent_item = wbs_lookup.get(curr_parent_id)
            curr_parent_id = parent_item.get('parentId') if parent_item else None

    # Roll up budget amounts similarly (if not already aggregated in raw data)
    wbs_budgets = {w.get('id'): float(w.get('budgetAmount', 0)) for w in wbs}
    
    # Gather root nodes
    root_nodes = [w for w in wbs if not w.get('parentId')]
    
    for r in root_nodes:
        r_id = r.get('id')
        budget = wbs_budgets.get(r_id, 0.0)
        actual = wbs_actuals.get(r_id, 0.0)
        variance = budget - actual
        pct_used = (actual / budget * 100) if budget > 0 else 0.0
        
        boq_vs_actual.append({
            'wbsId': r_id,
            'code': r.get('code', ''),
            'name': r.get('name', ''),
            'budget': budget,
            'actual': actual,
            'variance': variance,
            'percentUsed': pct_used,
            'isOverBudget': actual > budget
        })
        
    # 3. Cost Allocation by Contractors / Suppliers
    contractor_costs = {}
    for c in costs:
        if c.get('deletedAt'):
            continue
        sup = c.get('supplier') or 'Nơi cung cấp vãng lai'
        contractor_costs[sup] = contractor_costs.get(sup, 0.0) + float(c.get('amount', 0))
        
    sorted_contractors = sorted(contractor_costs.items(), key=lambda x: x[1], reverse=True)[:5]
    top_contractors = []
    for name, val in sorted_contractors:
        pct = (val / total_cost * 100) if total_cost > 0 else 0.0
        top_contractors.append({
            'name': name,
            'value': val,
            'pct': pct
        })

    return {
        'costByType': distribution_by_type,
        'boqVsActual': boq_vs_actual,
        'topContractors': top_contractors
    }
