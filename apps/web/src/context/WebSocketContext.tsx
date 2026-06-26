import React, { createContext, useContext, useEffect } from 'react';

const WebSocketContext = createContext<WebSocket | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Dynamically derive the ws:// or wss:// URL from VITE_API_URL
    const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api/v1';
    
    let wsUrl: string;
    try {
      const url = new URL(apiUrl);
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProtocol}//${url.host}`;
    } catch (e) {
      // Fallback in case VITE_API_URL is relative or weird
      const isSecure = window.location.protocol === 'https:';
      wsUrl = `${isSecure ? 'wss:' : 'ws:'}//${window.location.host}`;
    }

    console.log(`[WebSocket] Connecting to ${wsUrl}`);
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const { event: eventName, payload } = JSON.parse(event.data);
        if (eventName === 'STOCK_UPDATE') {
          // Dispatch a custom browser event so any component can listen to it
          const customEvent = new CustomEvent('stock-update', { detail: payload });
          window.dispatchEvent(customEvent);
        }
      } catch (err) {
        console.error('[WebSocket] Failed to parse message:', err);
      }
    };

    ws.onclose = () => console.log('[WebSocket] Connection closed');
    ws.onerror = (err) => console.error('[WebSocket] Error:', err);

    return () => ws.close();
  }, []);

  return <WebSocketContext.Provider value={null}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = () => useContext(WebSocketContext);
