#!/usr/bin/env bash
set -e

echo "Stopping Prelegal..."
docker stop prelegal 2>/dev/null || true
docker rm prelegal 2>/dev/null || true
echo "Prelegal stopped."
