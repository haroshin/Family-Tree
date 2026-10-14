import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import treeRoutes from './routes/treeRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (first from server/.env, then from current working dir .env)
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/family_tree_db';

// CORS Configuration
const allowedOriginEnv = process.env.CLIENT_URL;
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      if (!allowedOriginEnv || allowedOriginEnv === '*' || origin === allowedOriginEnv) {
        return callback(null, true);
      }
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.netlify.app') ||
        origin.endsWith('.onrender.com')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  })
);

app.use(express.json({ limit: '10mb' })); // Support base64 image avatar payloads

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Family Tree MongoDB Backend is healthy and running',
    timestamp: new Date().toISOString()
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tree', treeRoutes);

// In Production / Hosted mode: serve the built Vite frontend if dist exists
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    message: err.message || 'Internal Server Error'
  });
});

// Connect to MongoDB and start server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`\n======================================================`);
    console.log(`🌿 Connected to MongoDB successfully!`);
    console.log(`📦 Database: ${mongoose.connection.name}`);
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
    console.log(`======================================================\n`);

    app.listen(PORT, () => {
      console.log(`API endpoints ready:`);
      console.log(` - Health:   http://localhost:${PORT}/api/health`);
      console.log(` - Auth:     http://localhost:${PORT}/api/auth`);
      console.log(` - Tree:     http://localhost:${PORT}/api/tree`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

