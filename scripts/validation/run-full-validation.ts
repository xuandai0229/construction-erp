/**
 * FULL ERP VALIDATION ORCHESTRATOR
 * 
 * This script orchestrates the complete validation process:
 * 1. Database validation (backend)
 * 2. API validation
 * 3. Browser E2E validation (frontend)
 * 4. Generate comprehensive report
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface ValidationPhase {
  name: string;
  command: string;
  required: boolean;
  timeout?: number;
}

const phases: ValidationPhase[] = [
  {
    name: 'Database & Business Logic Validation',
    command: 'tsx scripts/master-erp-validation.ts',
    required: true,
    timeout: 300000 // 5 minutes
  },
  {
    name: 'Browser E2E Screen Validation',
    command: 'npx playwright test tests/e2e/master-screen-validation.spec.ts --reporter=html',
    required: true,
    timeout: 600000 // 10 minutes
  }
];

interface PhaseResult {
  phase: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  output?: string;
  error?: string;
}

const results: PhaseResult[] = [];

async function runPhase(phase: ValidationPhase): Promise<PhaseResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 Running: ${phase.name}`);
  console.log(`${'='.repeat(80)}\n`);
  
  const startTime = Date.now();
  
  try {
    const output = execSync(phase.command, {
      encoding: 'utf-8',
      stdio: 'inherit',
      timeout: phase.timeout
    });
    
    const duration = Date.now() - startTime;
    
    return {
      phase: phase.name,
      status: 'PASS',
      duration,
      output: output?.toString()
    };
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    return {
      phase: phase.name,
      status: 'FAIL',
      duration,
      error: error.message
    };
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('           FULL ERP VALIDATION - ORCHESTRATOR');
  console.log('='.repeat(80));
  console.log(`\n📅 Started at: ${new Date().toISOString()}`);
  console.log(`🎯 Target: Construction ERP System`);
  console.log(`📋 Phases: ${phases.length}\n`);
  
  const overallStartTime = Date.now();
  
  // Run each phase
  for (const phase of phases) {
    const result = await runPhase(phase);
    results.push(result);
    
    if (result.status === 'FAIL' && phase.required) {
      console.log(`\n❌ Required phase "${phase.name}" failed. Stopping validation.`);
      break;
    }
  }
  
  const overallDuration = Date.now() - overallStartTime;
  
  // Generate final report
  generateFinalReport(overallDuration);
}

function generateFinalReport(overallDuration: number) {
  console.log('\n\n' + '='.repeat(80));
  console.log('                    FINAL VALIDATION REPORT');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total Phases: ${results.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ⏱️  Total Duration: ${(overallDuration / 1000).toFixed(2)}s`);
  
  console.log(`\n📋 PHASE RESULTS:`);
  results.forEach((result, index) => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    const duration = (result.duration / 1000).toFixed(2);
    console.log(`\n${index + 1}. ${icon} ${result.phase}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Duration: ${duration}s`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  // Production readiness assessment
  console.log(`\n\n🎯 PRODUCTION READINESS ASSESSMENT:`);
  console.log('='.repeat(80));
  
  if (failed === 0) {
    console.log(`\n✅ STATUS: PRODUCTION READY`);
    console.log(`\nAll validation phases passed successfully.`);
    console.log(`The system is ready for production deployment.`);
  } else {
    console.log(`\n❌ STATUS: NOT PRODUCTION READY`);
    console.log(`\n${failed} validation phase(s) failed.`);
    console.log(`Please review and fix the issues before production deployment.`);
  }
  
  // Save report to file
  const reportPath = path.join(process.cwd(), 'validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    overallDuration,
    summary: {
      total: results.length,
      passed,
      failed,
      skipped
    },
    phases: results,
    productionReady: failed === 0
  }, null, 2));
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  console.log('\n' + '='.repeat(80));
  console.log('                        END OF VALIDATION');
  console.log('='.repeat(80) + '\n');
  
  // Exit with appropriate code
  process.exit(failed === 0 ? 0 : 1);
}

// Run
main().catch(error => {
  console.error('❌ Validation orchestrator failed:', error);
  process.exit(1);
});
