/**
 * VALIDATION READINESS CHECKER
 * 
 * Checks if the environment is ready for validation
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface Check {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
}

const checks: Check[] = [];

function addCheck(name: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string) {
  checks.push({ name, status, message });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${message}`);
}

async function main() {
  console.log('\n🔍 CHECKING VALIDATION READINESS');
  console.log('='.repeat(60));
  console.log();
  
  // Check 1: Node.js version
  try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
      addCheck('Node.js Version', 'PASS', `${nodeVersion} (>= 18 required)`);
    } else {
      addCheck('Node.js Version', 'FAIL', `${nodeVersion} (>= 18 required)`);
    }
  } catch (error) {
    addCheck('Node.js Version', 'FAIL', 'Could not determine Node.js version');
  }
  
  // Check 2: .env file exists
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    addCheck('.env File', 'PASS', 'Found');
    
    // Check DATABASE_URL
    const envContent = fs.readFileSync(envPath, 'utf-8');
    if (envContent.includes('DATABASE_URL')) {
      addCheck('DATABASE_URL', 'PASS', 'Configured in .env');
    } else {
      addCheck('DATABASE_URL', 'FAIL', 'Not found in .env');
    }
  } else {
    addCheck('.env File', 'FAIL', 'Not found');
  }
  
  // Check 3: .env.local file exists
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    addCheck('.env.local File', 'PASS', 'Found');
    
    // Check Supabase config
    const envLocalContent = fs.readFileSync(envLocalPath, 'utf-8');
    if (envLocalContent.includes('NEXT_PUBLIC_SUPABASE_URL')) {
      addCheck('Supabase Config', 'PASS', 'Configured in .env.local');
    } else {
      addCheck('Supabase Config', 'WARNING', 'NEXT_PUBLIC_SUPABASE_URL not found');
    }
  } else {
    addCheck('.env.local File', 'WARNING', 'Not found (optional)');
  }
  
  // Check 4: node_modules exists
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    addCheck('Dependencies', 'PASS', 'node_modules found');
  } else {
    addCheck('Dependencies', 'FAIL', 'node_modules not found - run: npm install');
  }
  
  // Check 5: Prisma client generated
  const prismaClientPath = path.join(process.cwd(), 'generated', 'prisma-client');
  if (fs.existsSync(prismaClientPath)) {
    addCheck('Prisma Client', 'PASS', 'Generated');
  } else {
    addCheck('Prisma Client', 'WARNING', 'Not generated - run: npx prisma generate');
  }
  
  // Check 6: Playwright installed
  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
    addCheck('Playwright', 'PASS', 'Installed');
  } catch (error) {
    addCheck('Playwright', 'FAIL', 'Not installed - run: npm install @playwright/test');
  }
  
  // Check 7: Playwright browsers
  const playwrightPath = path.join(process.cwd(), 'node_modules', '@playwright');
  if (fs.existsSync(playwrightPath)) {
    addCheck('Playwright Browsers', 'WARNING', 'May need installation - run: npx playwright install');
  }
  
  // Check 8: TypeScript
  try {
    execSync('npx tsc --version', { stdio: 'pipe' });
    addCheck('TypeScript', 'PASS', 'Installed');
  } catch (error) {
    addCheck('TypeScript', 'FAIL', 'Not installed');
  }
  
  // Check 9: tsx (TypeScript executor)
  try {
    execSync('npx tsx --version', { stdio: 'pipe' });
    addCheck('tsx', 'PASS', 'Installed');
  } catch (error) {
    addCheck('tsx', 'FAIL', 'Not installed - run: npm install tsx');
  }
  
  // Check 10: Validation scripts exist
  const validationScriptPath = path.join(process.cwd(), 'scripts', 'master-erp-validation.ts');
  if (fs.existsSync(validationScriptPath)) {
    addCheck('Validation Scripts', 'PASS', 'Found');
  } else {
    addCheck('Validation Scripts', 'FAIL', 'master-erp-validation.ts not found');
  }
  
  // Check 11: E2E test files exist
  const e2eTestPath = path.join(process.cwd(), 'tests', 'e2e', 'master-screen-validation.spec.ts');
  if (fs.existsSync(e2eTestPath)) {
    addCheck('E2E Tests', 'PASS', 'Found');
  } else {
    addCheck('E2E Tests', 'FAIL', 'master-screen-validation.spec.ts not found');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const passed = checks.filter(c => c.status === 'PASS').length;
  const failed = checks.filter(c => c.status === 'FAIL').length;
  const warnings = checks.filter(c => c.status === 'WARNING').length;
  
  console.log(`\nTotal Checks: ${checks.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  
  if (failed === 0) {
    console.log('\n✅ READY FOR VALIDATION!');
    console.log('\nRun: npm run validation:full');
  } else {
    console.log('\n❌ NOT READY FOR VALIDATION');
    console.log('\nPlease fix the failed checks above before running validation.');
    console.log('\nCommon fixes:');
    console.log('  - npm install');
    console.log('  - npx prisma generate');
    console.log('  - npx playwright install');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Readiness check failed:', error);
  process.exit(1);
});
