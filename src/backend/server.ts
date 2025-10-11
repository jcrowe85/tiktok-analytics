import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import aiRoutes from './routes/ai.ts';
import { testDatabaseConnection } from './database/connection.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_PATH = path.join(__dirname, '../../data/data.json');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, '../../dist')));

// AI Analysis routes
app.use('/api/ai', aiRoutes);

/**
 * Get analytics data with AI scores
 */
app.get('/api/data', async (_req, res) => {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      return res.status(404).json({
        error: 'No data found. Run "npm run fetch" first.',
      });
    }

    const data = fs.readFileSync(DATA_PATH, 'utf-8');
    const videos = JSON.parse(data);

    // Import database connection
    const { executeQuery } = await import('./database/connection.ts');
    
    // Get AI analysis for all videos
    const aiAnalyses = await executeQuery(`
      SELECT 
        video_id,
        status as ai_status,
        scores,
        visual_scores,
        findings,
        fix_suggestions,
        processed_at
      FROM video_ai_analysis
      WHERE status = 'completed'
    `);
    
    // Create a map of AI scores by video ID
    const aiScoresMap = new Map(
      aiAnalyses.map((analysis: any) => [
        analysis.video_id,
        {
          ai_status: analysis.ai_status,
          ai_scores: analysis.scores,
          ai_visual_scores: analysis.visual_scores,
          ai_findings: analysis.findings,
          ai_fix_suggestions: analysis.fix_suggestions,
          ai_processed_at: analysis.processed_at
        }
      ])
    );
    
    // Merge AI scores with video data
    const videosWithAI = videos.map((video: any) => ({
      ...video,
      ...(aiScoresMap.get(video.id) || {})
    }));

    res.json({
      success: true,
      count: videosWithAI.length,
      data: videosWithAI,
    });
  } catch (error) {
    console.error('Error reading data:', error);
    res.status(500).json({
      error: 'Failed to load data',
    });
  }
});

/**
 * Health check
 */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, async () => {
  console.log('\n🚀 TikTok Analytics Server');
  console.log('════════════════════════════════════════');
  console.log(`   API: http://localhost:${PORT}/api/data`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   AI API: http://localhost:${PORT}/api/ai`);
  console.log('\n   Frontend: http://localhost:5173');
  console.log('════════════════════════════════════════\n');
  
  // Test database connection
  await testDatabaseConnection();
});

