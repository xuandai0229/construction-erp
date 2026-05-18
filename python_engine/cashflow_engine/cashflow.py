from datetime import datetime
from collections import defaultdict

def analyze_cashflow(data):
    """
    Analyzes historical cash inflows and outflows and projects future monthly movements.
    """
    costs = data.get('costs', [])
    invoices = data.get('invoices', [])
    payments = data.get('payments', [])
    
    # Track by month: "YYYY-MM"
    monthly_inflow = defaultdict(float)
    monthly_outflow = defaultdict(float)
    
    # Inflow comes from payments associated with recognized revenues or paid invoices
    # Let's count paid invoices or payments
    for p in payments:
        if p.get('deletedAt'):
            continue
        p_date_str = p.get('date')
        if p_date_str:
            try:
                p_date = datetime.fromisoformat(p_date_str.replace('Z', '+00:00'))
                month_key = p_date.strftime('%Y-%m')
                monthly_inflow[month_key] += float(p.get('amount', 0))
            except Exception:
                pass
                
    # Outflow comes from paid costs (actual cash paid)
    for c in costs:
        if c.get('deletedAt'):
            continue
        # Only paid costs represent real cash outflow
        if c.get('status') == 'paid':
            c_date_str = c.get('date')
            if c_date_str:
                try:
                    c_date = datetime.fromisoformat(c_date_str.replace('Z', '+00:00'))
                    month_key = c_date.strftime('%Y-%m')
                    monthly_outflow[month_key] += float(c.get('amount', 0))
                except Exception:
                    pass

    # Gather all unique months and sort them
    all_months = sorted(list(set(list(monthly_inflow.keys()) + list(monthly_outflow.keys()))))
    
    # If no months found, default to last 6 months
    if not all_months:
        today = datetime.now()
        for i in range(5, -1, -1):
            # approximate last 6 months
            m = (today.month - i - 1) % 12 + 1
            y = today.year + (today.month - i - 1) // 12
            all_months.append(f"{y:04d}-{m:02d}")

    # Build trend
    trend = []
    cumulative_net = 0.0
    
    for month in all_months:
        inflow = monthly_inflow.get(month, 0.0)
        outflow = monthly_outflow.get(month, 0.0)
        net = inflow - outflow
        cumulative_net += net
        
        # format month for UI display (e.g. "05/2026")
        try:
            date_obj = datetime.strptime(month, '%Y-%m')
            ui_month = date_obj.strftime('%m/%Y')
        except Exception:
            ui_month = month
            
        trend.append({
            'month': ui_month,
            'monthKey': month,
            'income': inflow / 1000000.0, # convert to millions for dashboard scaling
            'expense': outflow / 1000000.0,
            'net': net / 1000000.0,
            'cumulativeNet': cumulative_net / 1000000.0
        })
        
    # Generate Forecast (Next 3 months) using simple moving average/linear extrapolation
    forecast = []
    if len(trend) >= 3:
        avg_income = sum(t['income'] for t in trend[-3:]) / 3.0
        avg_expense = sum(t['expense'] for t in trend[-3:]) / 3.0
    else:
        avg_income = 500.0 # fallback default million VND
        avg_expense = 400.0
        
    # Extrapolate for next 3 months
    last_month_key = all_months[-1] if all_months else "2026-05"
    try:
        last_date = datetime.strptime(last_month_key, '%Y-%m')
    except Exception:
        last_date = datetime.now()
        
    curr_cumulative = cumulative_net / 1000000.0
    
    for i in range(1, 4):
        # Add a month
        next_month = (last_date.month + i - 1) % 12 + 1
        next_year = last_date.year + (last_date.month + i - 1) // 12
        f_month_str = f"{next_month:02d}/{next_year:04d}"
        
        # Add slight seasonal variations
        factor = 1.05 if i == 2 else 0.95
        f_income = avg_income * factor
        f_expense = avg_expense * (2.0 - factor)
        f_net = f_income - f_expense
        curr_cumulative += f_net
        
        forecast.append({
            'month': f_month_str,
            'income': f_income,
            'expense': f_expense,
            'net': f_net,
            'cumulativeNet': curr_cumulative,
            'isForecast': True
        })

    return {
        'trend': trend,
        'forecast': forecast
    }
