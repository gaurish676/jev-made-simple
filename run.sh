#!/usr/bin/env bash
# Quickstart launcher for Jev Probability Explorer

set -e

PORT=8000
echo "=========================================================="
echo "⚡ Starting Jev System One Probability Explorer"
echo "=========================================================="
echo "Open in your browser: http://127.0.0.1:$PORT"
echo "Press Ctrl+C to stop."
echo ""

python3 server.py "$PORT"
