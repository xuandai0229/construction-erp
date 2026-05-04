const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/admin/construction-erp/app/services';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.service.ts') && f !== 'export.service.ts');

files.forEach(f => {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');
  
  // Replace import
  content = content.replace(/import \{ supabase \} from '@\/app\/utils\/supabase';/g, "import { supabaseAdmin as supabase } from '@/app/utils/supabase';");
  
  // We want to wrap the body of exported async functions.
  // Match: export async function functionName(...) { ... }
  // We can do this by splitting the file into functions.
  
  let newContent = '';
  const parts = content.split('export async function ');
  newContent += parts[0]; // imports etc
  
  for (let i = 1; i < parts.length; i++) {
    let part = parts[i];
    
    // Find the first '{' which starts the function body
    const firstBraceIndex = part.indexOf('{');
    if (firstBraceIndex === -1) {
       newContent += 'export async function ' + part;
       continue;
    }
    
    // The function signature
    const sig = part.substring(0, firstBraceIndex + 1);
    
    // The body - we need to find the matching '}'
    let braceCount = 1;
    let bodyEndIndex = -1;
    for (let j = firstBraceIndex + 1; j < part.length; j++) {
      if (part[j] === '{') braceCount++;
      if (part[j] === '}') braceCount--;
      if (braceCount === 0) {
        bodyEndIndex = j;
        break;
      }
    }
    
    if (bodyEndIndex !== -1) {
      let body = part.substring(firstBraceIndex + 1, bodyEndIndex);
      const rest = part.substring(bodyEndIndex);
      
      // Get function name for error logging
      const funcNameMatch = sig.match(/^([a-zA-Z0-9_]+)/);
      const funcName = funcNameMatch ? funcNameMatch[1] : 'unknown';
      
      // Wrap body in try catch, ONLY if it has await supabase
      if (body.includes('await supabase') && !body.includes('try {')) {
         body = `\n  try {${body}  } catch (err: any) {\n    console.error('[SERVICE EXCEPTION] ${funcName}:', err.message || err);\n    return { success: false, error: err.message || 'Unknown error occurred' };\n  }\n`;
      }
      
      newContent += 'export async function ' + sig + body + rest;
    } else {
      newContent += 'export async function ' + part;
    }
  }
  
  fs.writeFileSync(p, newContent);
  console.log('Updated ' + f);
});
