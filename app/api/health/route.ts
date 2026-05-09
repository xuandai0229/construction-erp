import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import os from 'os';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'UP';
  
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    dbStatus = 'DOWN';
  }

  const duration = Date.now() - startTime;
  
  return NextResponse.json({
    status: dbStatus === 'UP' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: {
        status: dbStatus,
        latency: `${duration}ms`
      },
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
    status: dbStatus === 'UP' ? 200 : 503
  });
}
