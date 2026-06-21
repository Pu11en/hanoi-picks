#!/usr/bin/env bash
# Start Hanoi Agent (Claude Code subscription brain + Discord MCP).
set -e
cd "$(dirname "$0")"
echo "Starting Hanoi Agent..."
npm run dev
