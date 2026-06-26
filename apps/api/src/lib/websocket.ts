import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function initWebSocketServer(server: Server) {
  wss = new WebSocketServer({ server });
  
  console.log('🔌 WebSocket Server initialized and bound to HTTP server');

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`[WebSocket] Client connected. Total active connections: ${clients.size}`);

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WebSocket] Client disconnected. Total active connections: ${clients.size}`);
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Connection error:', err);
      clients.delete(ws);
    });
  });
}

export function broadcast(event: string, payload: any) {
  if (!wss) {
    console.warn('[WebSocket] Cannot broadcast: Server not initialized');
    return;
  }

  const message = JSON.stringify({ event, payload });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
