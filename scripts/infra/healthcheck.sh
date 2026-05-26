#!/bin/bash
# ENTERPRISE RELIABILITY LAB - COMPREHENSIVE SERVICE HEALTHCHECK
# Matches docker-compose and local system service ports.

echo "=================================================="
echo "   RELIABILITY LAB RUNTIME HEALTHCHECK DIAGNOSTICS"
echo "=================================================="

# Colors for visual status indicators
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check PostgreSQL (Standard port 5432)
echo -n "Checking PostgreSQL Service Connectivity (Port 5432)... "
if command -v pg_isready >/dev/null 2>&1; then
    pg_isready -h localhost -p 5432 -U postgres >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[HEALTHY]${NC}"
    else
        echo -e "${RED}[UNHEALTHY]${NC} (Refusing connections)"
    fi
else
    # Fallback to pure port checks using /dev/tcp or nc
    (echo > /dev/tcp/localhost/5432) >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[HEALTHY]${NC} (Port 5432 listening)"
    else
        echo -e "${RED}[DOWN]${NC} (Port 5432 closed)"
    fi
fi

# 2. Check Redis (Standard port 6379)
echo -n "Checking Redis Cache Service Connectivity (Port 6379)... "
if command -v redis-cli >/dev/null 2>&1; then
    PING_RES=$(redis-cli -h localhost -p 6379 ping 2>/dev/null)
    if [ "$PING_RES" = "PONG" ]; then
        echo -e "${GREEN}[HEALTHY]${NC} (Responded to PING)"
    else
        echo -e "${RED}[UNHEALTHY]${NC} (No PONG response)"
    fi
else
    (echo > /dev/tcp/localhost/6379) >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[HEALTHY]${NC} (Port 6379 listening)"
    else
        echo -e "${YELLOW}[DOWN]${NC} (Port 6379 closed - application running with local memory cache fallback)"
    fi
fi

# 3. Check Prometheus (Standard port 9090)
echo -n "Checking Prometheus Telemetry Server (Port 9090)... "
(echo > /dev/tcp/localhost/9090) >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}[HEALTHY]${NC}"
else
    echo -e "${YELLOW}[DOWN]${NC} (Telemetry metrics offline)"
fi

# 4. Check Grafana (Standard port 3000)
echo -n "Checking Grafana Dashboard Server (Port 3000)... "
(echo > /dev/tcp/localhost/3000) >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}[HEALTHY]${NC}"
else
    echo -e "${YELLOW}[DOWN]${NC} (Dashboard visualization offline)"
fi

# 5. Check Jaeger (Standard port 16686)
echo -n "Checking Jaeger Distributed Tracing UI (Port 16686)... "
(echo > /dev/tcp/localhost/16686) >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}[HEALTHY]${NC}"
else
    echo -e "${YELLOW}[DOWN]${NC} (Tracing collector offline)"
fi

echo "=================================================="
echo "              DIAGNOSTICS COMPLETE"
echo "=================================================="
