import { NextResponse } from 'next/server';
import os from 'os';
import { StartupValidator } from '@/lib/startup-validator';

export async function GET() {
  const startup = await StartupValidator.validate();
  
  return NextResponse.json({
    status: startup.healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      startup,
      memory: {
        free: os.freemem(),
        total: os.totalmem(),
        usage: `${Math.round((1 - os.freemem() / os.totalmem()) * 100)}%`
      },
      system: {
        platform: os.platform(),
        cpuCount: os.cpus().length,
        loadAvg: os.loadavg()
      }
    }
  }, {
    status: startup.healthy ? 200 : 503
  });
}
