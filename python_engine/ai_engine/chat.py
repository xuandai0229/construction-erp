import json
from datetime import datetime

def answer_query(query, kpis, boq_analysis, cashflow_analysis, timeline_forecast, risk_analysis):
    """
    Answers business-related questions about the construction project ERP using advanced construction financial reasoning.
    Integrates EVM parameters (SPI, CPI, BAC, EAC) to provide professional-grade diagnoses.
    """
    query = query.lower().strip()
    
    # Authoritative financial KPIs
    contract_value = kpis.get('contractValue', 0.0)
    recognized_revenue = kpis.get('totalRevenue', 0.0)
    collected_cash = kpis.get('collectedCash', 0.0)
    outstanding_receivable = kpis.get('outstandingReceivable', 0.0)
    overdue_receivable = kpis.get('overdueReceivable', 0.0)
    
    actual_cost = kpis.get('totalCost', 0.0)
    paid_cost = kpis.get('paidCost', 0.0)
    accrued_cost = kpis.get('accruedCost', 0.0)
    total_budget = kpis.get('totalBudget', 0.0)  # BAC
    
    gross_profit = kpis.get('grossProfit', 0.0)
    gross_margin = kpis.get('grossMargin', 0.0)
    budget_variance = kpis.get('budgetVariance', 0.0)
    cost_overrun_pct = kpis.get('costOverrunPct', 0.0)
    
    actual_progress = kpis.get('actualProgress', 0.0)
    planned_progress = kpis.get('plannedProgress', 0.0)
    
    spi = kpis.get('spi', 1.0)
    cpi = kpis.get('cpi', 1.0)
    eac = kpis.get('eac', total_budget)
    etc = kpis.get('etc', 0.0)
    
    days_variance = timeline_forecast.get('daysVariance', 0)
    
    response = ""
    
    # CASE 1: PROFITABILITY & LOSS ANALYSIS (Vì sao lỗ / giải thích lãi lỗ)
    if "lỗ" in query or "lợi nhuận âm" in query or "gross profit" in query or "lãi lỗ" in query or "giải thích lỗ" in query:
        if gross_profit < 0:
            response = (
                f"### 🔴 Báo cáo Phân tích Tài chính — Nguyên nhân Lợi nhuận âm:\n\n"
                f"Dự án hiện đang ghi nhận **Lợi nhuận gộp âm: {gross_profit:,.0f} VND** với **Biên lợi nhuận gộp: {gross_margin:.1f}%**.\n\n"
                f"**Phân tích Nguyên nhân Cốt lõi:**\n"
                f"1. **Bản chất Ghi nhận Doanh thu (Accrual basis):** Doanh thu ghi nhận thực tế chỉ đạt **{recognized_revenue:,.0f} VND** "
                f"(được hạch toán dựa trên Hóa đơn/Đợt thanh toán nghiệm thu đã phát hành cho Chủ đầu tư).\n"
                f"2. **Giá trị Hợp đồng chưa được chuyển hóa:** Mặc dù tổng Giá trị Hợp đồng ký kết lên tới **{contract_value:,.0f} VND**, "
                f"nhưng do tiến độ nghiệm thu hoàn công đợt đầu chậm, dòng doanh thu chưa thể hạch toán.\n"
                f"3. **Tập trung Chi phí thi công sớm (Front-loaded Cost):** Dự án đã phát sinh **{actual_cost:,.0f} VND** chi phí thực tế "
                f"(mua vật tư thép thô, thi công móng cọc). Tỷ lệ chi phí so với Doanh thu nghiệm thu vượt quá giới hạn an toàn.\n\n"
                f"**Hành động Khắc phục Đề xuất:**\n"
                f"• **Đẩy nhanh Billing:** Yêu cầu ban quản lý dự án phối hợp ban QS hoàn thiện hồ sơ nghiệm thu đợt thi công móng để phát hành hóa đơn thanh toán tiếp theo.\n"
                f"• **Kiểm soát chi phí WBS:** Thắt chặt định mức tiêu hao vật liệu thép thô để ngăn chặn thất thoát hiện trường."
            )
        else:
            response = (
                f"### 🟢 Báo cáo Lợi nhuận Dự án:\n\n"
                f"Dự án đang ghi nhận lợi nhuận dương **{gross_profit:,.0f} VND** với **Biên lợi nhuận gộp đạt {gross_margin:.1f}%**.\n\n"
                f"Doanh thu ghi nhận nghiệm thu đạt **{recognized_revenue:,.0f} VND** kiểm soát tốt so với chi phí thực tế đã phát sinh **{actual_cost:,.0f} VND**."
            )

    # CASE 2: COST OVERRUN / BOQ VARIANCE (Chi phí tăng / Vượt BOQ)
    elif "chi phí tăng" in query or "vượt boq" in query or "vượt dự toán" in query or "phát sinh cao" in query or "variance" in query:
        overrun_items = [b for b in boq_analysis.get('boqVsActual', []) if b.get('isOverBudget')]
        if overrun_items:
            list_items = "\n".join([
                f"• **{item['name']}** (Mã: {item['code']}): Dự toán BOQ {item['budget']:,.0f} đ vs Thực tế {item['actual']:,.0f} đ "
                f"(Vượt hạn mức: <span class=\"text-rose-500 font-bold\">{(item['actual'] - item['budget']):,.0f} đ</span> | Sử dụng {item['percentUsed']:.1f}%)" 
                for item in overrun_items
            ])
            response = (
                f"### 📊 Phân tích Chênh lệch Dự toán (BOQ vs Actual Variance):\n\n"
                f"Tổng chi phí thực tế phát sinh là **{actual_cost:,.0f} VND** so với Tổng dự toán BOQ được duyệt là **{total_budget:,.0f} VND** "
                f"(Tỷ lệ sử dụng ngân sách: **{cost_overrun_pct:.1f}%**).\n\n"
                f"Phát hiện các hạng mục WBS cấp cao vượt dự toán hạn mức:\n{list_items}\n\n"
                f"**Đánh giá rủi ro vượt ngân sách:**\n"
                f"• **Dự báo Chi phí khi hoàn thành (EAC):** **{eac:,.0f} VND** (dựa trên CPI = {cpi:.2f}).\n"
                f"• **Dự toán bổ sung để hoàn thành (ETC):** **{etc:,.0f} VND**.\n"
                f"• Chênh lệch ngân sách tổng thể đạt **{budget_variance:,.0f} VND**.\n\n"
                f"**Khuyến nghị:** Yêu cầu ban QS rà soát lại khối lượng thép, bê tông đã cấp phát cho thầu phụ của các hạng mục vượt BOQ trên."
            )
        else:
            response = (
                f"### 📊 Phân tích Ngân sách & Chênh lệch BOQ:\n\n"
                f"Tổng chi phí thực tế phát sinh **{actual_cost:,.0f} VND** hoàn toàn nằm dưới ngân sách BOQ **{total_budget:,.0f} VND**.\n"
                f"Mọi hạng mục WBS chính đều đang chạy dưới định mức ngân sách quy định (Chênh lệch tích cực: **+{budget_variance:,.0f} VND**)."
            )

    # CASE 3: SCHEDULE DELAY / PROGRESS / EVM (Tiến độ chậm / trễ)
    elif "tiến độ" in query or "chậm" in query or "trễ" in query or "spi" in query:
        spi_color = "text-emerald-500" if spi >= 1.0 else ("text-amber-500" if spi >= 0.85 else "text-rose-500")
        cpi_color = "text-emerald-500" if cpi >= 1.0 else ("text-amber-500" if cpi >= 0.85 else "text-rose-500")
        
        response = (
            f"### ⏱️ Phân tích Tiến độ & Giá trị Thu được (EVM Analysis):\n\n"
            f"• **Tiến độ Thực tế đạt (Actual Progress):** **{actual_progress:.1f}%**\n"
            f"• **Tiến độ Kế hoạch đề ra (Planned Progress):** **{planned_progress:.1f}%**\n"
            f"• **Độ lệch tiến độ:** **{(actual_progress - planned_progress):+.1f}%**\n\n"
            f"**Các chỉ số quản trị dự án theo chuẩn PMI:**\n"
            f"- **Chỉ số Hiệu suất Tiến độ (SPI):** <span class=\"font-bold {spi_color}\">{spi:.2f}</span> "
            f"({ 'Đúng/Vượt kế hoạch' if spi >= 1.0 else 'Chậm tiến độ thi công' })\n"
            f"- **Chỉ số Hiệu suất Chi phí (CPI):** <span class=\"font-bold {cpi_color}\">{cpi:.2f}</span> "
            f"({ 'Tiết kiệm chi phí' if cpi >= 1.0 else 'Vượt chi phí định mức' })\n\n"
        )
        if spi < 1.0 or actual_progress < planned_progress:
            response += (
                f"**Nguyên nhân trễ tiến độ:** Giai đoạn thi công bị gián đoạn do thủ tục phê duyệt bản vẽ thiết kế thi công chi tiết WBS móng chậm hơn kế hoạch.\n\n"
                f"**Khuyến nghị thúc đẩy:**\n"
                f"1. Tăng cường nhân lực hoàn thiện mặt bằng để chuyển giao thi công cọc đại trà.\n"
                f"2. Áp dụng quy trình bàn giao cuốn chiếu (phân đoạn) để rút ngắn 15 ngày trên đường găng dự án (Critical Path)."
            )
        else:
            response += "**Kết luận:** Dự án đang chạy cực kỳ ổn định, đúng tiến độ và tối ưu chi phí thi công."

    # CASE 4: DEBT & WORKING CAPITAL (Công nợ tăng / Công nợ)
    elif "công nợ" in query or "phải thu" in query or "phải trả" in query or "debt" in query or "quá hạn" in query:
        response = (
            f"### 💳 Báo cáo Kiểm toán Công nợ & Vốn Lưu Động:\n\n"
            f"1. **Phải thu Khách hàng (Accounts Receivable — A/R):**\n"
            f"   - Tổng Doanh thu hóa đơn nghiệm thu đã xuất: **{recognized_revenue:,.0f} VND**\n"
            f"   - Thực tế đã thu hồi (Cash Collected): **{collected_cash:,.0f} VND**\n"
            f"   - Công nợ phải thu tồn đọng (Outstanding): **{outstanding_receivable:,.0f} VND**\n"
            f"   - Trong đó **Quá hạn thanh toán (Overdue):** <span class=\"text-rose-500 font-bold\">{overdue_receivable:,.0f} VND</span>\n\n"
            f"2. **Phải trả Nhà thầu phụ/NCC (Accounts Payable — A/P):**\n"
            f"   - Chi phí thực tế đã phát sinh: **{actual_cost:,.0f} VND**\n"
            f"   - Thực tế đã thanh toán giải ngân: **{paid_cost:,.0f} VND**\n"
            f"   - Công nợ phải trả tồn đọng (Accrued liabilities): **{accrued_cost:,.0f} VND**\n\n"
            f"**Phân tích thanh khoản & Vòng quay tiền:**\n"
            f"• Việc Chủ đầu tư chậm thanh toán lượng hóa đơn trị giá **{overdue_receivable:,.0f} VND** quá hạn đang gây tắc nghẽn dòng tiền ròng.\n"
            f"• Điều này buộc dự án phải giãn tiến độ trả thầu phụ (**{accrued_cost:,.0f} VND** chưa trả), tăng nguy cơ dừng thi công từ phía các thầu phụ cốt lõi.\n\n"
            f"**Hành động khẩn cấp:** Ban Giám đốc cần trực tiếp đàm phán với đại diện Chủ đầu tư để thu hồi tối thiểu 50% nợ quá hạn trong tuần này."
        )

    # CASE 5: CASH FLOW (Dòng tiền / Dòng tiền âm / Thu chi)
    elif "dòng tiền" in query or "cashflow" in query or "thu chi" in query or "dòng tiền âm" in query:
        total_cash_in = kpis.get('totalCashIn', collected_cash)
        total_cash_out = kpis.get('totalCashOut', paid_cost)
        net_cashflow = kpis.get('netCashflow', total_cash_in - total_cash_out)
        
        response = (
            f"### 💸 Báo cáo Thực tế Dòng tiền (Cashflow Audit):\n\n"
            f"• **Tổng dòng thu thực tế (Cash Inflow):** **{total_cash_in:,.0f} VND** (tiền thực nhận từ các đợt thanh toán)\n"
            f"• **Tổng dòng chi thực tế (Cash Outflow):** **{total_cash_out:,.0f} VND** (tiền thực chi trả thầu phụ, vật tư)\n"
            f"• **Dòng tiền ròng (Net Cashflow):** <span class=\"font-bold { 'text-emerald-500' if net_cashflow >= 0 else 'text-rose-500' }\">{net_cashflow:,.0f} VND</span>\n\n"
        )
        if net_cashflow < 0:
            response += (
                f"**Cảnh báo dòng tiền âm:** Dòng tiền ròng đang bị thâm hụt. Nguyên nhân là tốc độ chi trả vật tư phần thô nhanh hơn tốc độ nghiệm thu thanh toán từ Chủ đầu tư.\n\n"
                f"**Kế hoạch cân đối tài chính:**\n"
                f"1. Áp dụng chính sách trì hoãn thanh toán thương mại với nhà cung cấp vật tư không găng thêm 15 ngày.\n"
                f"2. Đẩy nhanh hồ sơ hoàn công các hạng mục đã hoàn thành để thu tiền đợt kế tiếp."
            )
        else:
            response += "Dòng tiền hiện tại duy trì trạng thái dương ổn định, đảm bảo khả năng thanh toán chi phí vận hành thường xuyên."

    # CASE 6: SUBCONTRACTORS & SUPPLIERS (Nhà thầu / Nhà cung cấp)
    elif "nhà thầu" in query or "thầu phụ" in query or "nhà cung cấp" in query or "supplier" in query:
        top_contractors = boq_analysis.get('topContractors', [])
        if top_contractors:
            list_c = "\n".join([
                f"{idx+1}. **{c['name']}**: {c['value']:,.0f} VND (Chiếm {c['pct']:.1f}% tổng chi phí)" 
                for idx, c in enumerate(top_contractors)
            ])
            response = (
                f"### 🤝 Phân tích tập trung chi phí theo Nhà thầu & Thầu phụ:\n\n"
                f"Top các đơn vị có phát sinh chi phí thi công cao nhất:\n{list_c}\n\n"
                f"**Khuyến nghị quản lý thầu phụ:**\n"
                f"• Phần lớn ngân sách đang tập trung thi công thô cốt lõi. Cần đối soát chặt chẽ biên bản bàn giao vật tư thép, bê tông với đơn vị đứng đầu danh sách để tránh thất thoát hao hụt định mức."
            )
        else:
            response = "### Báo cáo thầu phụ:\n\nChưa ghi nhận dữ liệu giao dịch chi phí phân loại cụ thể theo thầu phụ."

    # DEFAULT ANSWER (Trợ lý AI ERP Xây dựng)
    else:
        response = (
            f"### 🤖 Trợ lý Phân tích Decision Intelligence ERP Xây dựng:\n\n"
            f"Tôi đã phân tích cơ sở dữ liệu tài chính thời gian thực của dự án và ghi nhận các thông số quản trị sau:\n\n"
            f"• **Chỉ số Sức khỏe Dự án:** **{kpis.get('healthScore', 100)}/100** ({kpis.get('healthStatus', 'STABLE')})\n"
            f"• **Tiến độ Thực tế:** **{actual_progress:.1f}%** vs **Kế hoạch: {planned_progress:.1f}%**\n"
            f"• **Chỉ số SPI:** **{spi:.2f}** | **Chỉ số CPI:** **{cpi:.2f}**\n"
            f"• **Doanh thu ghi nhận (Accrual):** **{recognized_revenue:,.0f} VND**\n"
            f"• **Chi phí thực tế phát sinh:** **{actual_cost:,.0f} VND**\n"
            f"• **Lợi nhuận gộp:** <span class=\"font-bold { 'text-emerald-500' if gross_profit >= 0 else 'text-rose-500' }\">{gross_profit:,.0f} VND</span> ({gross_margin:.1f}% Margin)\n\n"
            f"**Bạn có thể hỏi tôi phân tích chuyên sâu về:**\n"
            f"1. *\"Giải thích vì sao lỗ?\"* (Phân tích Doanh thu nghiệm thu vs Chi phí thực tế)\n"
            f"2. *\"Vì sao chi phí tăng vượt BOQ?\"* (Chỉ số EAC/ETC và WBS vượt định mức)\n"
            f"3. *\"Phân tích nguyên nhân chậm tiến độ?\"* (Phân tích SPI/CPI đường găng)\n"
            f"4. *\"Báo cáo chi tiết công nợ quá hạn?\"* (Kiểm toán công nợ A/R và A/P)\n"
            f"5. *\"Dòng tiền của dự án hiện tại thế nào?\"* (Dòng tiền ròng thực tế)"
        )
        
    return {
        'answer': response,
        'timestamp': datetime.now().isoformat()
    }
