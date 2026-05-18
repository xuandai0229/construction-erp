import sys
import json
import argparse
from project_metrics.kpis import calculate_project_kpis
from financial_engine.boq_variance import analyze_boq_and_costs
from cashflow_engine.cashflow import analyze_cashflow
from forecasting.forecaster import project_timeline_forecast
from risk_engine.detector import detect_risks
from insight_generator.generator import generate_insights
from ai_engine.chat import answer_query

def main():
    parser = argparse.ArgumentParser(description="Python AI Analytics Engine for Construction ERP")
    parser.add_argument("--project_id", type=str, required=True, help="ID of the project to analyze")
    parser.add_argument("--action", type=str, required=True, choices=["all", "kpis", "boq", "cashflow", "forecast", "risk", "insights", "chat"], help="Analytics action to execute")
    parser.add_argument("--query", type=str, default="", help="Conversational query for chat action")
    
    args = parser.parse_args()
    
    # Read raw database JSON snapshot from stdin
    try:
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input data provided via stdin"}))
            return
        data = json.loads(input_data)
    except Exception as e:
        print(json.dumps({"error": f"Failed to parse input JSON: {str(e)}"}))
        return

    # Execute corresponding analytics engine
    try:
        # 1. Base aggregations (KPIs)
        kpis = calculate_project_kpis(data)
        
        if args.action == "kpis":
            print(json.dumps(kpis, ensure_ascii=False))
            return
            
        # 2. BOQ vs Actual & Cost Distribution
        boq_analysis = analyze_boq_and_costs(data)
        if args.action == "boq":
            print(json.dumps(boq_analysis, ensure_ascii=False))
            return
            
        # 3. Cashflow Trend & Forecast
        cashflow_analysis = analyze_cashflow(data)
        if args.action == "cashflow":
            print(json.dumps(cashflow_analysis, ensure_ascii=False))
            return
            
        # 4. Progress & Timeline Forecast
        timeline_forecast = project_timeline_forecast(data, kpis)
        if args.action == "forecast":
            print(json.dumps(timeline_forecast, ensure_ascii=False))
            return
            
        # 5. Risk Detection
        risk_analysis = detect_risks(data, kpis, boq_analysis)
        if args.action == "risk":
            print(json.dumps(risk_analysis, ensure_ascii=False))
            return
            
        # 6. Strategic Insights & Actions
        insights_analysis = generate_insights(kpis, boq_analysis, cashflow_analysis, timeline_forecast, risk_analysis)
        if args.action == "insights":
            print(json.dumps(insights_analysis, ensure_ascii=False))
            return
            
        # 7. AI Conversational Query Chat
        if args.action == "chat":
            chat_response = answer_query(args.query, kpis, boq_analysis, cashflow_analysis, timeline_forecast, risk_analysis)
            print(json.dumps(chat_response, ensure_ascii=False))
            return
            
        # 8. All analytical elements aggregated
        if args.action == "all":
            aggregated = {
                "project_id": args.project_id,
                "kpis": kpis,
                "boq": boq_analysis,
                "cashflow": cashflow_analysis,
                "forecast": timeline_forecast,
                "risk": risk_analysis,
                "insights": insights_analysis
            }
            print(json.dumps(aggregated, ensure_ascii=False))
            return
            
    except Exception as e:
        print(json.dumps({"error": f"Error running analytics module '{args.action}': {str(e)}"}, ensure_ascii=False))

if __name__ == "__main__":
    main()
