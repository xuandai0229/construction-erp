def generate_insights(kpis, boq_analysis, cashflow_analysis, timeline_forecast, risk_analysis):
    """
    Generates high-fidelity strategic insights and actionable recommendations
    based on Construction ERP EVM and accounting KPIs.
    """
    gross_margin = kpis.get('grossMargin', 0)
    overdue_receivable = kpis.get('overdueReceivable', 0)
    spi = kpis.get('spi', 1.0)
    cpi = kpis.get('cpi', 1.0)
    budget_variance = kpis.get('budgetVariance', 0)
    
    insights = []
    
    # 1. Margin & Profitability Insight
    if gross_margin < 15:
        insights.append({
            'id': 'ins-margin-collapse',
            'title': 'Biên lợi nhuận gộp ở mức báo động',
            'explanation': f"Biên lợi nhuận gộp hiện tại chỉ đạt {gross_margin:.1f}%, thấp hơn mức an toàn tiêu chuẩn 15% của ngành. Nguyên nhân do chi phí thực tế lũy kế tăng nhanh so với doanh thu nghiệm thu.",
            'impact': 'NEGATIVE',
            'suggestion': 'Đàm phán lại đơn giá cung ứng vật tư và thúc đẩy chủ đầu tư phê duyệt các hồ sơ nghiệm thu thanh toán còn tồn đọng.'
        })
    else:
        insights.append({
            'id': 'ins-margin-healthy',
            'title': 'Biên lợi nhuận gộp tích cực',
            'explanation': f"Biên lợi nhuận gộp đạt {gross_margin:.1f}%, cho thấy khả năng kiểm soát chi phí thi công rất tốt.",
            'impact': 'POSITIVE',
            'suggestion': 'Duy trì chính sách thắt chặt định mức hao hụt vật tư hiện tại tại công trường.'
        })
        
    # 2. Timeline & Schedule (SPI) Insight
    if spi < 0.95:
        insights.append({
            'id': 'ins-timeline-lag',
            'title': 'Rủi ro trễ tiến độ bàn giao (SPI thấp)',
            'explanation': f"Chỉ số hiệu suất tiến độ (SPI) là {spi:.2f}. Tiến độ thi công thực tế đang chậm hơn so với kế hoạch đường găng (Critical Path).",
            'impact': 'NEGATIVE',
            'suggestion': 'Bổ sung nguồn nhân lực và thiết bị để tăng ca (OT) cho các hạng mục công việc đang là nút thắt (bottlenecks) trên công trường.'
        })
        
    # 3. Cost & Budget (CPI) Insight
    if cpi < 0.95 or budget_variance < 0:
        insights.append({
            'id': 'ins-budget-overrun',
            'title': 'Chênh lệch ngân sách thi công',
            'explanation': f"Chỉ số hiệu suất chi phí (CPI) là {cpi:.2f} với mức vượt ngân sách {budget_variance * -1:,.0f} VND. Dự án đang tiêu hao nhiều chi phí hơn mức giới hạn được phép hoàn thành.",
            'impact': 'NEGATIVE',
            'suggestion': 'Rà soát lại khối lượng cấp phát vật tư và tạm dừng thanh toán cho các khối lượng phát sinh chưa có Variation Order (VO).'
        })
        
    # 4. Cashflow / Receivable Insight
    if overdue_receivable > 0:
        insights.append({
            'id': 'ins-cashflow-debt',
            'title': 'Rủi ro tắc nghẽn thanh khoản dòng tiền',
            'explanation': f"Công nợ phải thu quá hạn từ Chủ đầu tư đạt mức {overdue_receivable:,.0f} VND, gây áp lực trực tiếp lên nguồn vốn lưu động để thanh toán cho thầu phụ.",
            'impact': 'NEGATIVE',
            'suggestion': 'Khởi động quy trình đôn đốc thu hồi nợ cấp bách và chuẩn bị hồ sơ pháp lý đối chiếu công nợ.'
        })

    # Actionable Recommendations for Executive Action Cockpit
    recommendations = []
    
    if overdue_receivable > 0:
        recommendations.append({
            'id': 'rec-collect-debt',
            'title': 'Đẩy nhanh nghiệm thu & thu hồi nợ',
            'description': 'Kích hoạt điều khoản phạt chậm thanh toán trong Hợp đồng Chủ đầu tư. Tổ chức cuộc họp liên ngành để tháo gỡ vướng mắc hồ sơ chứng từ.',
            'urgency': 'HIGH',
            'confidenceLevel': 92
        })
        
    if spi < 0.95:
        recommendations.append({
            'id': 'rec-crash-schedule',
            'title': 'Tăng tốc tiến độ thi công bù đắp (Crashing)',
            'description': 'Huy động đội thi công phụ dự phòng và phê duyệt ngân sách làm thêm giờ (OT) để đẩy nhanh các hạng mục thuộc đường găng dự án.',
            'urgency': 'HIGH',
            'confidenceLevel': 85
        })
        
    if cpi < 0.95:
        recommendations.append({
            'id': 'rec-control-costs',
            'title': 'Thanh tra khối lượng tiêu hao vật tư',
            'description': 'Yêu cầu Ban QS thực hiện kiểm toán (audit) khối lượng sử dụng thép và bê tông tại công trường so với định mức BOQ để tìm ra nguyên nhân gây hao hụt.',
            'urgency': 'HIGH',
            'confidenceLevel': 88
        })

    return {
        'insights': insights,
        'recommendations': recommendations
    }
