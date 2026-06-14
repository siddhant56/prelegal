#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

echo "Building Prelegal..."
docker build -t prelegal .

echo "Starting Prelegal..."
docker run -d --name prelegal -p 8000:8000 prelegal

echo "Prelegal is running at http://localhost:8000"
