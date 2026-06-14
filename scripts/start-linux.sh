#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

echo "Building Prelegal..."
docker build -t prelegal .

echo "Starting Prelegal..."
ENV_FLAG=""
if [ -f .env ]; then ENV_FLAG="--env-file .env"; fi
docker run -d --name prelegal -p 8000:8000 $ENV_FLAG prelegal

echo "Prelegal is running at http://localhost:8000"
