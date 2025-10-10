#!/bin/bash

# TikTok Analytics Cron Job Setup
# This script sets up automatic daily data fetching

echo "🕐 Setting up TikTok Analytics Cron Job"
echo "========================================"

# Get the current directory (where the project is located)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Project directory: $PROJECT_DIR"

# Create the cron job entry
CRON_ENTRY="0 9 * * * cd $PROJECT_DIR && npm run fetch >> $PROJECT_DIR/logs/cron.log 2>&1"

echo ""
echo "📋 Cron job will run daily at 9:00 AM"
echo "   Command: $CRON_ENTRY"
echo ""

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

# Add to crontab
echo "Adding cron job..."
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "✅ Cron job added successfully!"
echo ""
echo "📊 To view cron logs: tail -f $PROJECT_DIR/logs/cron.log"
echo "🗑️  To remove cron job: crontab -e (then delete the line)"
echo ""
echo "🔄 The fetch job will now run automatically every day at 9:00 AM"
