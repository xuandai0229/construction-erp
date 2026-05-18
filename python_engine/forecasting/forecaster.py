from datetime import datetime, timedelta

def project_timeline_forecast(data, current_kpis):
    """
    Projects the completion schedule and potential delay risk using burn-rates.
    """
    project = data.get('project', {})
    task_progress = current_kpis.get('taskProgress', 56.0)
    days_elapsed = current_kpis.get('daysElapsed', 0)
    duration_days = current_kpis.get('durationDays', 365)
    
    start_date_str = project.get('startDate')
    end_date_str = project.get('endDate')
    
    # 1. Project Speed (Progress % per day)
    progress_per_day = (task_progress / days_elapsed) if days_elapsed > 0 else 0.0
    
    # Target progress speed (assuming linear uniform distribution)
    target_speed = 100.0 / duration_days if duration_days > 0 else 0.27
    
    # Projected days needed to complete remaining progress
    remaining_progress = 100.0 - task_progress
    projected_days_needed = (remaining_progress / progress_per_day) if progress_per_day > 0 else duration_days
    
    # Estimated Completion Date
    today = datetime.now()
    estimated_completion = today + timedelta(days=projected_days_needed)
    
    # Variance in days
    scheduled_end = today
    if end_date_str:
        try:
            scheduled_end = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        except Exception:
            pass
            
    days_variance = (estimated_completion - scheduled_end).days
    
    status = 'ON_TRACK'
    if days_variance > 30:
        status = 'CRITICAL_DELAY'
    elif days_variance > 5:
        status = 'MINOR_DELAY'
        
    return {
        'progressPerDay': progress_per_day,
        'targetProgressPerDay': target_speed,
        'projectedDaysNeeded': projected_days_needed,
        'estimatedCompletionDate': estimated_completion.isoformat(),
        'scheduledCompletionDate': end_date_str,
        'daysVariance': days_variance,
        'forecastStatus': status
    }
