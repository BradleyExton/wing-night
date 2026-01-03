import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import roomsRouter from './routes/rooms.js';
import teamsRouter from './routes/teams.js';
import playersRouter from './routes/players.js';
import gameRouter from './routes/game.js';
import usersRouter from './routes/users.js';
import { setupSocketHandlers } from './handlers/socket.js';
import { clerkAuth, syncUserToDb } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Clerk authentication middleware (adds auth to all requests)
app.use(clerkAuth);
app.use(syncUserToDb);

// Static files for uploaded images
app.use('/logos', express.static(path.join(__dirname, '../public/logos')));
app.use('/photos', express.static(path.join(__dirname, '../public/photos')));

// API routes
app.use('/api/users', usersRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/rooms', teamsRouter);
app.use('/api/rooms', playersRouter);
app.use('/api/rooms', gameRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static client files in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));

  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

// Socket.io setup
const io = new Server(httpServer, {
  cors: corsOptions,
});

setupSocketHandlers(io);

// Make io available to routes (for broadcasting)
app.set('io', io);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`
  🔥 Wing Night Server running!

  Server: http://localhost:${PORT}
  Client: ${process.env.CLIENT_URL || 'http://localhost:5173'}

  API Endpoints:
  - POST /api/rooms - Create room
  - GET /api/rooms/:code - Get room
  - PUT /api/rooms/:code - Update room
  - POST /api/rooms/:code/open - Open room (DRAFT -> LOBBY)
  - POST /api/rooms/:code/join - Join room
  - POST /api/rooms/:code/teams - Create team
  - And more...
  `);
});

export { io };
