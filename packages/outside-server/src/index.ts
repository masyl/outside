import express from 'express';
import path from 'path';
import { SignalingServer } from './signaling';

const app = express();
const PORT = process.env.PORT || 3000;
const SIGNALING_PORT = 3001;

// Serve static files from public directory
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// API endpoint to get game status
app.get('/api/status', (req, res) => {
  const signalingServer = (app as any).signalingServer as SignalingServer;
  res.json({
    isRunning: signalingServer.isGameRunning(),
    hostPeerId: signalingServer.getHostPeerId(),
    connectedClients: signalingServer.getConnectedClients(),
  });
});

// Start signaling server
const signalingServer = new SignalingServer(SIGNALING_PORT);
(app as any).signalingServer = signalingServer;

// Start HTTP server
app.listen(PORT, () => {
  console.log(`[Server] HTTP server running on http://localhost:${PORT}`);
  console.log(`[Server] Signaling server running on ws://localhost:${SIGNALING_PORT}`);
});
