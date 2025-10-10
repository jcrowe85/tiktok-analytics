import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

/**
 * Get analytics data
 */
app.get('/api/data', (_req, res) => {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      return res.status(404).json({
        error: 'No data found. Run "npm run fetch" first.',
      });
    }

    const data = fs.readFileSync(DATA_PATH, 'utf-8');
    const videos = JSON.parse(data);

    res.json({
      success: true,
      count: videos.length,
      data: videos,
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
app.listen(PORT, () => {
  console.log('\n🚀 TikTok Analytics Server');
  console.log('════════════════════════════════════════');
  console.log(`   API: http://localhost:${PORT}/api/data`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log('\n   Frontend: http://localhost:5173');
  console.log('════════════════════════════════════════\n');
});

