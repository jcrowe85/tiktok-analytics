# Database Backup Information

## Backup Date: October 14, 2025

### Save Point: PRE-COMMERCIALIZATION
This backup represents a fully functional TikTok analytics application before adding commercial features (Stripe, teams, usage limits).

---

## Backup Files

### 1. Schema-Only Backup
**File:** `database_schema_backup_20251014_180710.sql`
**Size:** 23KB
**Location:** 
- VPS: `/home/jcrowe85/database_schema_backup_20251014_180705.sql`
- Local: `./database_schema_backup_20251014_180710.sql`

**Contents:** Database structure only (tables, indexes, constraints, functions)

### 2. Full Database Backup
**File:** `database_full_backup_20251014_180734.sql`
**Size:** 220KB
**Location:**
- VPS: `/home/jcrowe85/database_full_backup_20251014_180726.sql`
- Local: `./database_full_backup_20251014_180734.sql`

**Contents:** Complete database with all data (schema + data)

---

## Database Schema Overview

### Core Tables:
1. **users** - User accounts with authentication
2. **videos** - TikTok video metadata and metrics
3. **ai_analysis** - AI analysis results (scores, recommendations)
4. **video_snapshots** - Daily snapshots for growth tracking
5. **static_content_analysis** - Analysis for image/carousel content
6. **tiktok_tokens** - OAuth tokens for TikTok API
7. **job_status** - BullMQ job tracking

### Key Features:
- ✅ User authentication with JWT
- ✅ TikTok OAuth integration
- ✅ Video metrics tracking
- ✅ AI analysis with GPT-4o
- ✅ Snapshot-based growth calculations (24h, 7d, 30d)
- ✅ Job queue status tracking
- ✅ Static content analysis for images

---

## How to Restore

### Restore Schema Only:
```bash
# On VPS
docker exec -i tiktok-analytics-postgres psql -U tiktok_user -d tiktok_analytics < database_schema_backup_20251014_180710.sql
```

### Restore Full Database:
```bash
# On VPS - Drop and recreate database first
docker exec tiktok-analytics-postgres psql -U tiktok_user -c "DROP DATABASE IF EXISTS tiktok_analytics;"
docker exec tiktok-analytics-postgres psql -U tiktok_user -c "CREATE DATABASE tiktok_analytics;"
docker exec -i tiktok-analytics-postgres psql -U tiktok_user -d tiktok_analytics < database_full_backup_20251014_180734.sql
```

### From Local to VPS:
```bash
# Copy backup to VPS
scp database_full_backup_20251014_180734.sql jcrowe85@164.92.66.82:/home/jcrowe85/

# SSH into VPS and restore
ssh jcrowe85@164.92.66.82
docker exec tiktok-analytics-postgres psql -U tiktok_user -c "DROP DATABASE IF EXISTS tiktok_analytics;"
docker exec tiktok-analytics-postgres psql -U tiktok_user -c "CREATE DATABASE tiktok_analytics;"
docker exec -i tiktok-analytics-postgres psql -U tiktok_user -d tiktok_analytics < /home/jcrowe85/database_full_backup_20251014_180734.sql
```

---

## Git Commit
**Commit Hash:** ec77723
**Branch:** main
**Message:** SAVE POINT: APP FULLY FUNCTIONAL - PRE-COMMERCIALIZATION

---

## Next Phase (Commercialization)
The following features will be added in the next phase:
- 🔲 Stripe payment integration
- 🔲 Subscription plans (Free, Pro, Agency)
- 🔲 Usage limits and quotas
- 🔲 Team collaboration features
- 🔲 Multi-client support for agencies
- 🔲 Billing dashboard
- 🔲 User role management

---

## Important Notes
- Both backup files are stored on VPS in `/home/jcrowe85/`
- Both backup files are downloaded locally to project root
- These backups can be used to restore the database to this exact working state
- Git commit `ec77723` corresponds to this database state
- All features are working: OAuth, AI analysis, filters, growth tracking, etc.

---

**Backup Created By:** AI Assistant (Claude)
**Backup Timestamp:** 2025-10-14 18:07:34 PDT
**Database Version:** PostgreSQL 15.14
**Application Status:** ✅ Fully Functional

