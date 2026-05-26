#!/bin/bash
# ENTERPRISE RELIABILITY LAB - ORCHESTRATED SYSTEM STARTUP SCRIPT
# Handles container launch (if Docker daemon exists) and transitions gracefully to local service mode.

echo "=================================================="
echo "      ENTERPRISE RELIABILITY LAB STARTUP"
echo "=================================================="

# Check if Docker is available on the system
if command -v docker >/dev/null 2>&1; then
    echo "🐳 Docker daemon detected. Spinning up full enterprise reliability container stack..."
    docker compose -f docker-compose.enterprise.yml up -d
    
    echo "⏳ Waiting for databases and cache stores to warm up..."
    sleep 10
    
    # Run migrations against Docker PostgreSQL container
    echo "🔄 Synchronizing database schema via Prisma..."
    npx prisma db push
    
    # Run the validation checks
    echo "🚀 Triggering master ERP validation..."
    npm run validation:database
else
    echo "⚠️ Docker daemon is not available on this host."
    echo "🔌 Transitioning automatically to Local OS-managed High-Integrity services..."
    
    # Check if local PostgreSQL is listening
    (echo > /dev/tcp/localhost/5432) >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Active local PostgreSQL 16 service detected on port 5432."
        
        echo "🔄 Synchronizing database schema via Prisma..."
        npx prisma db push
        
        # Execute the database reliability validation scripts
        echo "🚀 Running Master Database & Business validation harness..."
        npx tsx scripts/master-erp-validation.ts
        
        echo "🚀 Running Runtime Reliability & Resilience harness..."
        npx tsx scripts/reliability-harness.ts
    else
        echo "❌ CRITICAL ERROR: No local PostgreSQL service found listening on port 5432."
        echo "   Please start the 'postgresql-x64-16' Windows Service and retry."
        exit 1
    fi
fi

echo "=================================================="
echo "          SYSTEM STARTUP AND VALIDATION COMPLETE"
echo "=================================================="
