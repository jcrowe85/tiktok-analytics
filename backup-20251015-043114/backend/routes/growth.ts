/**
 * Growth Metrics API
 * 
 * Provides endpoints for retrieving growth metrics based on daily snapshots
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { getAllMetricsGrowth, takeUserSnapshots } from '../services/snapshotService.js';

const router = express.Router();

/**
 * GET /api/growth/:period
 * Get growth metrics for a specific time period
 * 
 * Periods: 1 (24h), 7 (7d), 30 (30d)
 */
router.get('/:period', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization token' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const userId = decoded.userId;

    const period = parseInt(req.params.period);
    
    if (![1, 7, 30].includes(period)) {
      return res.status(400).json({ error: 'Invalid period. Use 1, 7, or 30' });
    }

    console.log(`📊 Fetching ${period}-day growth for user ${userId}`);
    
    const growth = await getAllMetricsGrowth(userId, period);
    
    res.json({
      period,
      growth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching growth metrics:', error);
    res.status(500).json({ error: 'Failed to fetch growth metrics' });
  }
});

/**
 * POST /api/growth/snapshot
 * Manually trigger a snapshot for the current user
 */
router.post('/snapshot', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization token' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const userId = decoded.userId;

    console.log(`📸 Manual snapshot requested for user ${userId}`);
    
    await takeUserSnapshots(userId);
    
    res.json({
      success: true,
      message: 'Snapshot taken successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error taking manual snapshot:', error);
    res.status(500).json({ error: 'Failed to take snapshot' });
  }
});

export default router;

