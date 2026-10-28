#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
test_container="yitian-analysis-test-$$"
trap 'docker rm -f "$test_container" >/dev/null 2>&1 || true' EXIT
docker run --detach --name "$test_container" --network none -e POSTGRES_HOST_AUTH_METHOD=trust postgres:17-alpine >/dev/null
for attempt in {1..30}; do
  if docker exec "$test_container" pg_isready -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
db_exec() { docker exec -i "$test_container" psql -X -U postgres -v ON_ERROR_STOP=1; }
db_exec < supabase/tests/bootstrap.sql
db_exec < supabase/migrations/20261028000100_daily_learning_analysis.sql
# Supabase-only transports are represented by explicit stubs; core SQL, permissions,
# transactions, triggers and leases execute in a real isolated PostgreSQL instance.
sed '/^create extension /d' supabase/migrations/20261028000200_daily_analysis_dispatch.sql | db_exec
db_exec < supabase/tests/daily_analysis.sql
