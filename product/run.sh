#!/usr/bin/env bash
# Start Hanoi Agent. Loads env + DB from /home/drewp/.hanoi (outside the git
# working tree) so a stray `git clean` in a parent repo can't wipe them.
set -e
cd "$(dirname "$0")"
export DOTENV_CONFIG_PATH="/home/drewp/.hanoi/.env"
echo "Starting Hanoi Agent (env: $DOTENV_CONFIG_PATH)..."
npm run dev
