import * as fs from 'fs';
import * as path from 'path';

function loadEnvFiles() {
  const envLocal = path.join(process.cwd(), '.env.local');
  const envBase = path.join(process.cwd(), '.env');
  const parse = (filePath: string) => {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx === -1) return;
      const k = trimmed.substring(0, idx).trim();
      let v = trimmed.substring(idx + 1).trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      else if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
      process.env[k] = v;
    });
  };
  parse(envLocal);
  parse(envBase);
}
loadEnvFiles();

import { prisma } from "../lib/prisma";

async function main() {
  const constraints: any[] = await prisma.$queryRawUnsafe(
    `SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid = '"Invoice"'::regclass AND contype = 'c'`
  );
  console.log("Invoice CHECK constraints:");
  for (const c of constraints) {
    console.log(`  ${c.conname}: ${c.def}`);
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
