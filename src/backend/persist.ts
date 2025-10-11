import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { VideoMetrics, VideoSnapshot } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const CSV_PATH = path.join(DATA_DIR, 'tiktok_video_metrics.csv');
const JSON_PATH = path.join(DATA_DIR, 'data.json');
const SNAPSHOTS_PATH = path.join(DATA_DIR, 'snapshots.json');

/**
 * Ensure data directory exists
 */
function ensureDataDirectory(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Convert VideoMetrics to CSV row
 */
function metricsToCsvRow(video: VideoMetrics): string {
  const escape = (str: string) => `"${str.replace(/"/g, '""')}"`;
  
  return [
    video.id,
    video.posted_at_iso,
    video.duration,
    escape(video.caption),
    escape(video.hashtags.join(',')),
    video.view_count,
    video.like_count,
    video.comment_count,
    video.share_count,
    video.engagement_rate.toFixed(4),
    video.like_rate.toFixed(4),
    video.comment_rate.toFixed(4),
    video.share_rate.toFixed(4),
    video.views_24h || '',
    video.views_48h || '',
    video.velocity_24h?.toFixed(2) || '',
    video.velocity_48h?.toFixed(2) || '',
  ].join(',');
}

/**
 * Write metrics to CSV file
 */
export function writeCSV(videos: VideoMetrics[]): void {
  console.log('🚩 Step 7: Write CSV and data.json');
  
  ensureDataDirectory();

  const headers = [
    'id',
    'posted_at_iso',
    'duration_s',
    'caption',
    'hashtags',
    'views',
    'likes',
    'comments',
    'shares',
    'engagement_rate',
    'like_rate',
    'comment_rate',
    'share_rate',
    'views_24h',
    'views_48h',
    'velocity_24h',
    'velocity_48h',
  ].join(',');

  const rows = videos.map(metricsToCsvRow);
  const csv = [headers, ...rows].join('\n');

  try {
    fs.writeFileSync(CSV_PATH, csv, 'utf-8');
    console.log(`   ✅ CSV written: ${CSV_PATH} (${videos.length} videos)`);
  } catch (error) {
    console.warn(`   ⚠️  CSV write skipped (permission denied) - database is primary source`);
  }
}

/**
 * Write metrics to JSON file for frontend
 */
export function writeJSON(videos: VideoMetrics[]): void {
  ensureDataDirectory();

  const json = JSON.stringify(videos, null, 2);
  try {
    fs.writeFileSync(JSON_PATH, json, 'utf-8');
    console.log(`   ✅ JSON written: ${JSON_PATH} (${videos.length} videos)`);
  } catch (error) {
    console.warn(`   ⚠️  JSON write skipped (permission denied) - database is primary source`);
  }
}

/**
 * Load previous snapshots for velocity calculation
 */
export function loadSnapshots(): VideoSnapshot[] {
  ensureDataDirectory();
  
  if (!fs.existsSync(SNAPSHOTS_PATH)) {
    return [];
  }

  try {
    const content = fs.readFileSync(SNAPSHOTS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('⚠️  Failed to load snapshots, starting fresh');
    return [];
  }
}

/**
 * Save snapshots for future velocity calculations
 */
export function saveSnapshots(snapshots: VideoSnapshot[]): void {
  ensureDataDirectory();

  // Keep only last 7 days of snapshots to avoid bloat
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const recentSnapshots = snapshots.filter(s => s.timestamp >= sevenDaysAgo);

  const json = JSON.stringify(recentSnapshots, null, 2);
  fs.writeFileSync(SNAPSHOTS_PATH, json, 'utf-8');
  console.log(`   ✅ Snapshots saved: ${recentSnapshots.length} entries`);
}

/**
 * Append new snapshots to existing ones
 */
export function appendSnapshots(newSnapshots: VideoSnapshot[]): void {
  const existing = loadSnapshots();
  const combined = [...existing, ...newSnapshots];
  saveSnapshots(combined);
}

/**
 * Load previous metrics data
 */
export function loadPreviousMetrics(): VideoMetrics[] {
  if (!fs.existsSync(JSON_PATH)) {
    return [];
  }

  try {
    const content = fs.readFileSync(JSON_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('⚠️  Failed to load previous metrics');
    return [];
  }
}

